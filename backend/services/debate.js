const { extractKeywords } = require("./keywordExtractor.js");
const { llmChat } = require("./aiModel.js");
const { getNews } = require("./newsservice.js");
const DebateSession = require("../models/DebateSession.js");

// System prompt template for an agent, derived from its basis/keyword.
const AGENT_TEMPLATE = (keyword) =>
  `You are a ${keyword} specialist. Debate the article using domain knowledge.
- Make specific, checkable claims when possible.
- Acknowledge trade-offs and uncertainty.
- Be concise (<=120 words). Avoid absolutist language.
- Professional, evidence-seeking tone.`;

// ✅ fix: actually return the string
const nameFor = (k) => `${k[0].toUpperCase()}${k.slice(1)} Specialist`;

function preview(s, n = 160) {
  if (!s) return "(empty)";
  const str = String(s);
  return str.length <= n ? str : str.slice(0, n) + "...";
}

// Keep a short digest of previous turns so agents can respond without blowing context.
function recentHistory(history, limitChars = 1200) {
  const lines = [];
  let used = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const line = `- ${history[i].speaker}: ${history[i].text}`;
    if (used + line.length > limitChars) break;
    lines.push(line);
    used += line.length;
  }
  return lines.reverse().join("\n");
}

// One agent speaks, given the article context and prior turns.
async function agentTurn({ agent, context, history }) {
  const system = AGENT_TEMPLATE(agent.basis); // ✅ derive system from basis (don’t store prompt)
  const digest = recentHistory(history, 1200);

  const userContent =
`Article context (truncated):
${(context || "").slice(0, 1000)}

Your role: ${agent.name} (${agent.basis})

Instructions:
- Respond to the article AND the latest points from other agents (below).
- Quote/paraphrase specific claims you agree/disagree with.
- Be concise (<=120 words). Professional, evidence-seeking tone.
- If you revise your stance due to others, say why.

Previous turns:
${digest || "(none yet)"}`;

  console.log("\n[agentTurn] agent:", agent.name);
  console.log("[agentTurn] system.len:", system.length);
  console.log("[agentTurn] user.len:", userContent.length, "preview=", preview(userContent));

  const reply = await llmChat({
    system,
    messages: [{ role: "user", content: userContent }],
    temperature: 0.7,
  });

  return { speaker: agent.name, text: (reply || "").trim(), ts: new Date() };
}

// Create a debate from raw text (used by both text and article flows).
async function generateDebateFromText(text, { maxAgents = 3, numRounds = 1 } = {}) {
  // 1) Extract topics → build agents
  const topics = await extractKeywords(text);
  const agents = topics.slice(0, maxAgents).map((k) => ({
    name: nameFor(k),
    basis: k,
    // no 'prompt' field stored
  }));

  // 2) Round-robin: every round, each agent speaks once; history grows each turn
  const history = [];
  const turns = [];

  for (let round = 0; round < numRounds; round++) {
    for (let agentIndex = 0; agentIndex < agents.length; agentIndex++) {
      const agent = agents[agentIndex];
      const turn = await agentTurn({ agent, context: text, history });
      const fullTurn = { ...turn, round, agentIndex };
      history.push(fullTurn);
      turns.push(fullTurn);
    }
  }

  return { topics, agents, messages: turns };
}

// Wrapper: fetch article, then delegate to generateDebateFromText; save a session.
async function generateDebateByArticleID(articleId, opts = {}) {
  const article = await getNews(articleId);
  if (!article) {
    const e = new Error("Article not found");
    e.status = 404;
    throw e;
  }

  // Ensure sane defaults here too (route should also sanitize)
  let { maxAgents = 3, numRounds = 1, temperature = 0.7 } = opts;
  maxAgents = Math.max(1, Math.min(Number(maxAgents) || 3, 5));
  numRounds = [1, 3, 5].includes(Number(numRounds)) ? Number(numRounds) : 1;

  const context = article.content_original || article.content || article.title || "";
  const result = await generateDebateFromText(context, { maxAgents, numRounds });

  // Save a session (no prompts stored)
  const sessionDoc = await DebateSession.create({
    articleId: article._id,
    topics: result.topics,
    agents: result.agents, // { name, basis }
    messages: result.messages.map((m) => ({
      speaker: m.speaker,
      text: m.text,
      round: m.round,
      agentIndex: m.agentIndex,
      ts: m.ts || new Date(),
    })),
    params: {
      model: process.env.LLM_MODEL,
      temperature,
      maxAgents,
      numRounds,
    },
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

module.exports = {
  generateDebateFromText,
  generateDebateByArticleID,
  recentHistory,
};
