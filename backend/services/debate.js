
const { llmChat } = require("./aiModel.js");
const { getNews } = require("./newsservice.js");
const DebateSession = require("../Models/DebateSession.js");
const { articleToAgents } = require("./articleToAgent.js");

/** ---------- Agent Definitions ---------- **/
const SUPPORT_STANCE = {
  side: "left",
  stanceSymbol: "+",
  stanceLabel: "support",
};

const OPPOSE_STANCE = {
  side: "right",
  stanceSymbol: "-",
  stanceLabel: "oppose",
};

/** ---------- Prompt Templates ---------- **/
function buildSystemPrompt(agent, topic) {
  return `
You are a ${agent.name}.
You are an expert participating in a structured debate about a news article.

Your expertise:
- You have professional knowledge and domain understanding as a ${agent.name}
- You should reason from the perspective of this profession

Your stance:
- ${agent.stanceLabel.toUpperCase()} the topic

General requirements:
- Answer in Japanese
- Use ですます調
- Be professional and evidence-based
- Do not hallucinate
- Keep the response concise (≤120 words unless otherwise specified)
- Stay consistent with your assigned stance
  `.trim();
}

/** ---------- Helpers ---------- **/
function clip(s = "", n = 500) {
  const t = String(s).replace(/\s+/g, " ").trim();
  return t.length <= n ? t : t.slice(0, n - 1) + "…";
}

function recentHistory(history = [], limitChars = 1800) {
  const lines = [];
  let used = 0;

  for (let i = history.length - 1; i >= 0; i--) {
    const h = history[i] || {};
    const round = typeof h.round === "number" ? `Round ${h.round + 1}` : "";
    const side = (h.side || "").toUpperCase();
    const who = h.speaker || "Agent";
    const text = clip(h.text || "", 300);
    const line = [round, side, who].filter(Boolean).join(" • ") + `: ${text}`;

    if (used + line.length > limitChars) break;
    lines.push(line);
    used += line.length;
  }

  return lines.reverse().join("\n");
}


function inferTopicFromArticle(article = {}) {
  return (
    article.topic ||
    article.title ||
    "この記事が扱う社会的・政治的トピック"
  );
}
/** ---------- Stage 1: Topic Opinion Generation ---------- **/
async function generateTopicOpinion({ topic, agent }) {
  const system = buildSystemPrompt(agent);

  const userPrompt = `
Topic:
${topic}

Assigned stance:
${agent.stanceLabel}

Task:
Generate your stance-consistent opinion about the TOPIC itself, based on your internal knowledge.

Requirements:
- Clearly state your position on the topic
- Use general knowledge and reasoning
- Mention 1–2 key arguments supporting your stance
- Keep it concise (≤100 words)
  `.trim();

  const reply = await llmChat({
    system,
    messages: [{ role: "user", content: userPrompt }],
    temperature: 0,
  });

  const output = (reply || "").trim();
  logStage("STAGE 1: Topic Opinion", agent, topic, output);

  return output
}


/** ---------- Stage 2: News Opinion Generation ---------- **/
async function generateNewsOpinion({ articleText, topic, agent }) {
  const system = buildSystemPrompt(agent);

  const userPrompt = `
Topic:
${topic}

News Article:
${clip(articleText, 1800)}

Task:
Generate your stance-consistent opinion about this news article.
Interpret the article through your assigned stance.

Requirements:
- Focus on the article content
- Refer to claims, implications, or framing in the article
- Stay consistent with your stance on the topic
- Keep it concise (≤100 words)
  `.trim();

  const reply = await llmChat({
    system,
    messages: [{ role: "user", content: userPrompt }],
    temperature: 0,
  });

  const output = (reply || "").trim();
  logStage("STAGE 2: News Opinion", agent, topic, output);

  return output
}

/** ---------- Stage 3: Rebuttal Generation ---------- **/
async function generateRebuttal({
  topic,
  articleText,
  agent,
  topicOpinion,
  newsOpinion,
  history,
}) {
  const system = buildSystemPrompt(agent);
  const digest = recentHistory(history, 1800);

  const userPrompt = `
Topic:
${topic}

News Article:
${clip(articleText, 1200)}

Topic-based opinion:
${topicOpinion}

Article-based opinion:
${newsOpinion}

Previous dialogue history:
${digest || "(none yet)"}

Task:
Generate your next rebuttal in the debate.

Requirements:
- Integrate the topic-based opinion and article-based opinion into the response
- Generate a rebuttal using the dialogue history, directly addressing the opponent’s most recent claim if present
- Maintain consistency with the assigned stance
- Minor agreement is allowed, but the overall stance must not change
- Be concise, professional, and evidence-based
- Limit the response to ≤120 words
  `.trim();

  const reply = await llmChat({
    system,
    messages: [{ role: "user", content: userPrompt }],
    temperature: 0,
  });

  return (reply || "").trim();
}

/** ---------- Agent Pipeline ---------- **/
async function initializeAgentState({ topic, articleText, agent }) {
  const topicOpinion = await generateTopicOpinion({ topic, agent });
  const newsOpinion = await generateNewsOpinion({ topic, articleText, agent });

  return {
    ...agent,
    basis: "General + Article",
    topicOpinion,
    newsOpinion,
  };
}

async function runAgentTurn({
  round,
  agentIndex,
  agentState,
  topic,
  articleText,
  history,
}) {
  const rebuttal = await generateRebuttal({
    topic,
    articleText,
    agent: agentState,
    topicOpinion: agentState.topicOpinion,
    newsOpinion: agentState.newsOpinion,
    history,
  });

  return {
    speaker: agentState.name,
    text: rebuttal,
    round,
    agentIndex,
    side: agentState.side,
    ts: new Date(),
  };
}

/** ---------- Core Debate ---------- **/
async function generateDebateFromText(
  text,
  {
    numRounds = 3,
    userPosition = "agree",
    topic = "一般的な社会的トピック",
    experts = ["Policy Analyst", "Researcher", "Subject Matter Expert"],
  } = {}
) {
  const { supportAgents, opposeAgents, allAgents } =
    createStanceAgentsFromExperts(experts);

  const initializedAgents = [];

  for (const agent of allAgents) {
    const state = await initializeAgentState({
      topic,
      articleText: text,
      agent,
    });
    initializedAgents.push(state);
  }

  const agents = initializedAgents.map((a) => ({
    name: a.name,
    basis: a.basis,
    side: a.side,
    topicOpinion: a.topicOpinion,
    newsOpinion: a.newsOpinion,
  }));

  const history = [];
  const turns = [];

  const supportStates = initializedAgents.filter((a) => a.side === "left");
  const opposeStates = initializedAgents.filter((a) => a.side === "right");

  const firstTeam = userPosition === "agree" ? supportStates : opposeStates;
  const secondTeam = userPosition === "agree" ? opposeStates : supportStates;

for (let round = 0; round < numRounds; round++) {
  for (let i = 0; i < supportStates.length; i++) {
    const supportAgent = supportStates[i];
    const opposeAgent = opposeStates[i];

    if (userPosition === "agree") {
      const supportIndex = initializedAgents.indexOf(supportAgent);

      const supportTurn = await runAgentTurn({
        round,
        agentIndex: supportIndex,
        agentState: supportAgent,
        topic,
        articleText: text,
        history,
      });

      history.push(supportTurn);
      turns.push(supportTurn);

      if (opposeAgent) {
        const opposeIndex = initializedAgents.indexOf(opposeAgent);

        const opposeTurn = await runAgentTurn({
          round,
          agentIndex: opposeIndex,
          agentState: opposeAgent,
          topic,
          articleText: text,
          history,
        });

        history.push(opposeTurn);
        turns.push(opposeTurn);
      }
    } else {
      const opposeIndex = initializedAgents.indexOf(opposeAgent);

      const opposeTurn = await runAgentTurn({
        round,
        agentIndex: opposeIndex,
        agentState: opposeAgent,
        topic,
        articleText: text,
        history,
      });

      history.push(opposeTurn);
      turns.push(opposeTurn);

      if (supportAgent) {
        const supportIndex = initializedAgents.indexOf(supportAgent);

        const supportTurn = await runAgentTurn({
          round,
          agentIndex: supportIndex,
          agentState: supportAgent,
          topic,
          articleText: text,
          history,
        });

        history.push(supportTurn);
        turns.push(supportTurn);
      }
    }
  }
}

  return {
    topics: [topic],
    agents,
    messages: turns,
  };
}

/** ---------- Article Wrapper + Persistence ---------- **/
async function generateDebateByArticleID(articleId, opts = {}) {
  const article = await getNews(articleId);
  if (!article) {
    const e = new Error("Article not found");
    e.status = 404;
    throw e;
  }

  let { numRounds = 1, temperature = 0, userPosition = "agree" } = opts;
  numRounds = [1, 3, 5].includes(Number(numRounds)) ? Number(numRounds) : 1;

  const topic = inferTopicFromArticle(article);
  const context =
    article.content_original ||
    article.content ||
    article.title ||
    "";
  const experts = await articleToAgents(context, 3);
  const result = await generateDebateFromText(context, {
    numRounds,
    userPosition,
    topic,
    experts,
  });

  const sessionDoc = await DebateSession.create({
    articleId: article._id,
    topics: result.topics,
    agents: result.agents.map((a) => ({
      name: a.name,
      basis: a.basis,
      side: a.side,
    })),
    messages: result.messages.map((m) => ({
      speaker: m.speaker,
      text: m.text,
      round: m.round,
      agentIndex: m.agentIndex,
      side: m.side,
      ts: m.ts || new Date(),
    })),
    params: {
      model: process.env.LLM_MODEL,
      temperature,
      maxAgents: 2,
      numRounds,
    },
    sessionLabel: "Supporting vs Opposing",
  });

  return {
    sessionId: sessionDoc._id.toString(),
    articleId: article._id.toString(),
    topics: result.topics,
    agents: result.agents,
    messages: result.messages,
    createdAt: sessionDoc.createdAt,
  };
}

function logStage(title, agent, topic, content) {
  console.log(`\n===== ${title} =====`);
  console.log(`Agent: ${agent.name} (${agent.stanceLabel})`);
  console.log(`Topic: ${topic}`);
  console.log("Output:");
  console.log(content);
  console.log("=================================\n");
}

function createStanceAgentsFromExperts(experts = []) {
  const cleanExperts = experts.filter(Boolean).slice(0, 3);

  const supportAgents = cleanExperts.map((expert) => ({
    name: expert,
    basis: expert,
    ...SUPPORT_STANCE,
  }));

  const opposeAgents = cleanExperts.map((expert) => ({
    name: expert,
    basis: expert,
    ...OPPOSE_STANCE,
  }));

  return {
    supportAgents,
    opposeAgents,
    allAgents: [...supportAgents, ...opposeAgents],
  };
}

module.exports = {
  generateTopicOpinion,
  generateNewsOpinion,
  generateRebuttal,
  generateDebateFromText,
  generateDebateByArticleID,
  recentHistory,
};

