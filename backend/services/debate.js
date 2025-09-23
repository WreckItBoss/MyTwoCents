const { llmChat } = require("./aiModel.js"); // ensure file name matches (aiModel.js)
const { getNews } = require("./newsservice.js");
const DebateSession = require("../Models/DebateSession.js");

/** ---------- Personas ---------- **/
const SUPPORT_TEMPLATE = `
You are the Supporting Analyst.
Your task: read the article and ARGUE IN SUPPORT of its central claim or implication.
- Be professional and evidence-based.
- Engage the opponent's points directly if present.
- Acknowledge trade-offs briefly, but defend the article's core position.
- Keep each turn concise (≤80 words).
`.trim();

const OPPOSE_TEMPLATE = `
You are the Opposing Analyst.
Your task: read the article and ARGUE AGAINST its central claim or implication.
- Be professional and evidence-based.
- Engage the opponent's points directly if present.
- Acknowledge trade-offs briefly, but critique the article's core position.
- Keep each turn concise (≤80 words).
`.trim();

/** ---------- Helpers ---------- **/
function preview(s, n = 160) {
  if (!s) return "(empty)";
  const str = String(s);
  return str.length <= n ? str : str.slice(0, n) + "...";
}

function clip(s = "", n = 400) {
  const t = String(s).replace(/\s+/g, " ").trim();
  return t.length <= n ? t : t.slice(0, n - 1) + "…";
}

// keep a short digest of previous turns for coherence
function recentHistory(history = [], limitChars = 1400) {
  const lines = [];
  let used = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const h = history[i] || {};
    const round = typeof h.round === "number" ? `Round ${h.round + 1}` : "";
    const side = (h.side || "").toUpperCase();
    const tag = [round, side].filter(Boolean).join(" • ");
    const who = h.speaker || "Agent";
    const text = clip(h.text || "");
    const line = tag ? `${tag} — ${who}: ${text}` : `${who}: ${text}`;
    if (used + line.length > limitChars) break;
    lines.push(line);
    used += line.length;
  }
  return lines.reverse().join("\n");
}

async function agentTurn({ name, side, system, context, history }) {
  const digest = recentHistory(history, 2000);
  const userContent =
`Article context (truncated):
${(context || "").slice(0, 1200)}

Your role: ${name} — ${side.toUpperCase()} side
Debate Instructions:
- Engage directly with the article and the most recent arguments from other agents (see below).
- Reference specific claims (quote or paraphrase) you agree or disagree with.
- Draw upon your own general knowledge, expertise, and reasoning — not just the article.
- Keep your response concise (≤80 words), using a professional, evidence-based tone.
- If your opinion changes based on others’ points, clearly explain why.
- If you agree with the other person's opinion, state their name and why you agree.
- Do not hallucinate.

Previous turns:
${digest || "(none yet)"}`;

  console.log("\n[agentTurn]", name, `[${side}]`);
  console.log("[system.len]:", system.length, " [user.len]:", userContent.length, " preview=", preview(userContent));

  const reply = await llmChat({
    system,
    messages: [{ role: "user", content: userContent }],
    temperature: 0.7,
  });

  return {
    speaker: name,
    text: (reply || "").trim(),
    side,
    ts: new Date(),
  };
}

/** ---------- Core: exactly two agents, multi-round ---------- **/
async function generateDebateFromText(text, { numRounds = 1 } = {}) {
  // Two fixed agents
  const leftAgent = { name: "Supporting Analyst", side: "left", system: SUPPORT_TEMPLATE };
  const rightAgent = { name: "Opposing Analyst", side: "right", system: OPPOSE_TEMPLATE };

  const agents = [
    { name: leftAgent.name, basis: "General", side: "left" },
    { name: rightAgent.name, basis: "General", side: "right" },
  ];

  const history = [];
  const turns = [];

  for (let round = 0; round < numRounds; round++) {
    // left (support) goes first
    {
      const t = await agentTurn({
        name: leftAgent.name,
        side: leftAgent.side,
        system: leftAgent.system,
        context: text,
        history,
      });
      const full = { ...t, round, agentIndex: 0 };
      history.push(full);
      turns.push(full);
    }
    {
      const t = await agentTurn({
        name: rightAgent.name,
        side: rightAgent.side,
        system: rightAgent.system,
        context: text,
        history,
      });
      const full = { ...t, round, agentIndex: 1 };
      history.push(full);
      turns.push(full);
    }
  }

  return {
    topics: [], // no keyword extraction now
    agents,
    messages: turns,
  };
}

/** ---------- Article wrapper + persistence ---------- **/
async function generateDebateByArticleID(articleId, opts = {}) {
  const article = await getNews(articleId);
  if (!article) {
    const e = new Error("Article not found");
    e.status = 404;
    throw e;
  }

  let { numRounds = 1, temperature = 0.7 } = opts;
  numRounds = [1, 3, 5].includes(Number(numRounds)) ? Number(numRounds) : 1;

  const context = article.content_original || article.content || article.title || "";
  const result = await generateDebateFromText(context, { numRounds });

  // Save session
  const sessionDoc = await DebateSession.create({
    articleId: article._id,
    topics: [],
    agents: result.agents, // [{ name, basis, side }]
    messages: result.messages.map(m => ({
      speaker: m.speaker,
      text: m.text,
      round: m.round,
      agentIndex: m.agentIndex,
      side: m.side, // "left" | "right"
      ts: m.ts || new Date(),
    })),
    params: {
      model: process.env.LLM_MODEL,
      temperature,
      numRounds,
      teamSize: 1, // not used anymore, but kept for compatibility
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

module.exports = {
  generateDebateFromText,
  generateDebateByArticleID,
  recentHistory,
};
