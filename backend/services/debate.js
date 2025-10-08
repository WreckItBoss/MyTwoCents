const { llmChat } = require("./aiModel.js"); // ensure file name matches (aiModel.js)
const { getNews } = require("./newsservice.js");
const DebateSession = require("../Models/DebateSession.js");

/** ---------- Personas ---------- **/
const SUPPORT_TEMPLATE = `
You are the Supporting Analyst.
Your task: ARGUE in SUPPORT to the topic of Nuclear Energy.
- Use information about the news article and your general knowledge
- Be professional and evidence-based.
- Engage the opponent's points directly if present.
- Acknowledge trade-offs briefly, but defend the article's core position.
- Keep each turn concise (≤120 words).
- Answer in Japanese
- です・ます調を使って答えてください
`.trim();

const OPPOSE_TEMPLATE = `
You are the Opposing Analyst.
Your task: ARGUE AGAINST the topic of Nuclear Energy.
- Use information about the news article and your general knowledge
- Be professional and evidence-based.
- Engage the opponent's points directly if present.
- Acknowledge trade-offs briefly, but critique the article's core position.
- Keep each turn concise (≤120 words).
- Answer in Japanese
- です・ます調を使って答えてください
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

// One agent speaks, given the article context and prior turns
async function agentTurn({ name, side, system, context, history }) {
  const digest = recentHistory(history, 2000);
  console.log("RECENT HISTORY==========================")
  console.log(digest)
  console.log("==========================")
  const userContent =
`Article context (truncated):
${(context || "").slice(0, 1200)}

Your role: ${name} — ${side.toUpperCase()} side
Debate Instructions:
- Use information about the news article and your general knowledge
- Reference specific claims (quote or paraphrase) from the opponent you agree or disagree with.
- Draw upon your own general knowledge, expertise, and reasoning — not just the article.
- Keep your response concise (≤120 words), using a professional, evidence-based tone.
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
    temperature: 0,
  });

  return {
    speaker: name,
    text: (reply || "").trim(),
    side,
    ts: new Date(),
  };
}

/** ---------- Core: exactly two agents, multi-round ---------- **/
async function generateDebateFromText(text, { numRounds = 1, userPosition = "agree" } = {}) {
  // Two fixed agents
  const leftAgent = { name: "賛成派", side: "left", system: SUPPORT_TEMPLATE };
  const rightAgent = { name: "反対派", side: "right", system: OPPOSE_TEMPLATE };

  const agents = [
    { name: leftAgent.name, basis: "General", side: "left" },
    { name: rightAgent.name, basis: "General", side: "right" },
  ];

  const history = [];
  const turns = [];

  // Decide order based on stance
  
  const first = userPosition === "agree" ? leftAgent : rightAgent;
  const second = userPosition === "agree" ? rightAgent : leftAgent;
  const firstIndex = userPosition === "agree" ? 0 : 1;
  const secondIndex = userPosition === "agree" ? 1 : 0;

  for (let round = 0; round < numRounds; round++) {
    // First agent speaks
    {
      const t = await agentTurn({
        name: first.name,
        side: first.side,
        system: first.system,
        context: text,
        history,
      });
      const full = { ...t, round, agentIndex: firstIndex };
      history.push(full);
      turns.push(full);
    }

    // Second agent responds
    {
      const t = await agentTurn({
        name: second.name,
        side: second.side,
        system: second.system,
        context: text,
        history,
      });
      const full = { ...t, round, agentIndex: secondIndex };
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

  let { numRounds = 1, temperature = 0, userPosition = "agree" } = opts;
  numRounds = [1, 3, 5].includes(Number(numRounds)) ? Number(numRounds) : 1;

  const context =
    article.content_original || article.content || article.title || "";

  const result = await generateDebateFromText(context, { numRounds, userPosition });

  // Save session
  const sessionDoc = await DebateSession.create({
    articleId: article._id,
    topics: [],
    agents: result.agents, // [{ name, basis, side }]
    messages: result.messages.map((m) => ({
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
      userPosition, // record it for session metadata
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
