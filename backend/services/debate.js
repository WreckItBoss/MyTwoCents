const {extractKeywords} = require("./keywordExtractor.js");
const {llmChat} = require("./aiModel.js");
const {getNews} = require("./newsservice.js");
const DebateSession = require("../models/DebateSession.js")
const AGENT_TEMPLATE = (keyword) =>
  `You are a ${keyword} specialist. Debate the article using domain knowledge.
- Make specific, checkable claims when possible.
- Acknowledge trade-offs and uncertainty.
- Be concise (<=120 words). Avoid absolutist language.
- Professional, evidence-seeking tone.`;

const nameFor = (k) => {`${k[0].toUpperCase()}${k.slice(1)} Specialist`};

function preview(s, n = 160) {
  if (!s) return "(empty)";
  const str = String(s);
  return str.length <= n ? str : str.slice(0, n) + "...";
}

async function agentTurn({ agent, context, history }) {
  const system = agent.prompt;
  const userContent =
    `Article context (truncated to 1000 chars):
    ${context.slice(0, 1000)}

    You are ${agent.name}. Provide your POV for this round in <=120 words.
    Previous turns:
    ${history.map(m => `- ${m.speaker}: ${m.text}`).join("\n")}`;
  console.log("\n[agentTurn] agent:", agent.name);
  console.log("[agentTurn] system.len:", system.length);
  console.log("[agentTurn] user.len:", userContent.length, "preview=", preview(userContent));

  const reply = await llmChat({
    system,
    messages: [{ role: "user", content: userContent }],
    temperature: 0.7,
  });
   return { speaker: agent.name, text: reply?.trim() || "", ts: new Date() };
}

async function generateDebateFromText(text, {maxAgents = 3, numRounds = 1}={}) {
    const topics = await extractKeywords(text);
    const agents = topics.slice(0, maxAgents).map((k)=>({
        name: nameFor(k),
        basis: k,
        prompt: AGENT_TEMPLATE(k)
    }));
    //Here each agent gets a turn to speak
    const turns = [];
    const history = [];

for (let r = 0; r < numRounds; r++) {
  for (const agent of agents) {
    const turn = await agentTurn({
      agent,
      context: text,
      history,
    });
    turns.push(turn);
    history.push(turn);
  }
}

    return { topics, agents, messages: turns };
}

async function generateDebateByArticleID(articleId, opts = {}) {
    const article = await getNews(articleId);
    if(!article){
        const e = new Error("Article not found");
        e.status = 404;
        throw e;
    }
    const { maxAgents = 3, numRounds = 1, temperature = 0.7 } = opts;
    const context = article.content_original || article.content || article.title || "";
    const result = await generateDebateFromText(context, opts);
    const sessionDoc = await DebateSession.create({
      articleId: article._id,
      topics: result.topics,
      agents: result.agents,
      messages: result.messages.map((m,i)=>({
        speaker: m.speaker,
        text: m.text,
        round: Math.floor(i/maxAgents),
        agentIndex: i % maxAgents,
        ts: m.ts || new Date()
      })),
      params: {
        model: process.env.LLM_MODEL,
        temperature,
        maxAgents,
        numRounds
      },
    })
    return {
      sessionId: sessionDoc._id.toString(),
      articleId: article._id.toString(),
      topics: result.topics,
      agents: result.agents,
      messages: result.messages,
      createdAt: sessionDoc.createdAt
    };
}
module.exports = {generateDebateFromText, generateDebateByArticleID,};
