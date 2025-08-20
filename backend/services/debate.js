const { extractKeywords } = require("./keywordExtractor.js");
const { generalizeTopics } = require("./keywordToAgent");
const { llmChat } = require("./aiModel.js");
const { getNews } = require("./newsservice.js");
const DebateSession = require("../models/DebateSession.js");

// System prompt template for an agent, derived from its basis/keyword.
const AGENT_TEMPLATE = (domain, side) => `
You are a debate agent named ${side === "left" ? "Avery" : "Jordan"}, a specialist in ${domain}.
You represent a ${side === "left" ? "progressive (left-leaning)" : "conservative (right-leaning)"} perspective.

Persona:
- You are knowledgeable in ${domain}, drawing on historical examples, policy debates, and real-world data.  
- Your political lens is ${side === "left" ? "progressive — you value social justice, inclusivity, and reform." 
                                          : "conservative — you value tradition, stability, and individual responsibility."}  
- You debate respectfully: critique ideas, not people.  
- Your goal is to persuade while acknowledging trade-offs and uncertainty.  
- Speak in a professional, fact-based style, concise (≤120 words).  
`.trim();


// ✅ fix: actually return the string
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const nameFor = (k, side) => `${cap(k)} Specialist (${side})`;

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
  const system = AGENT_TEMPLATE(agent.basis, agent.side);
  const digest = recentHistory(history, 1200);

  const userContent =
`Article context (truncated):
${(context || "").slice(0, 1000)}

Your role: ${agent.name} — ${agent.side.toUpperCase()} Team (${agent.basis})

Debate Instructions:
- Engage directly with the article and the most recent arguments from other agents (see below).
- Reference specific claims (quote or paraphrase) you agree or disagree with.
- Keep your response concise (≤120 words), using a professional, evidence-based tone.
- If your opinion changes based on others’ points, clearly explain why.

Previous turns:
${digest || "(none yet)"}`;

  console.log("\n[agentTurn] agent:", agent.name, `[${agent.side}]`);
  console.log("[agentTurn] system.len:", system.length);
  console.log("[agentTurn] user.len:", userContent.length, "preview=", preview(userContent));

  const reply = await llmChat({
    system,
    messages: [{ role: "user", content: userContent }],
    temperature: 0.7,
  });

  return { speaker: agent.name, text: (reply || "").trim(), side: agent.side, ts: new Date() };
}

// Create a debate from raw text (used by both text and article flows).
async function generateDebateFromText(text, { teamSize = 3, numRounds = 1 } = {}) {
  // 1) Extract topics → build teams
  const topics = await extractKeywords(text);
  const generalized = await generalizeTopics(text, topics);

  // Here we check for dupes. So if we have two US Politics Specialist, it will just create one US Politics Specialist
  const seen = new Set();
  const uniqueDomains = [];

  for (const d of generalized){
    const key = (d || "").trim().toLowerCase();
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueDomains.push(d.trim());
  }

  //Clamp team size to unique count

  const effectiveTeamSize = Math.max(1, Math.min(teamSize, uniqueDomains.length));
  if (effectiveTeamSize !== teamSize){
    console.log(`[debate] Adjusting teamSize from ${teamSize} → ${effectiveTeamSize} due to duplicate domains`);
  }

  const base = uniqueDomains.slice(0, effectiveTeamSize);

  const leftTeam = base.map((k)=>({name: nameFor(k, "left"), basis: k, side: "left"}));
  const rightTeam = base.map((k)=>({name: nameFor(k, "right"), basis: k, side: "right"}));
  const agents = [...leftTeam, ...rightTeam];

  const history = [];
  const turns = [];

  for (let round = 0; round < numRounds; round++){
    //Left side goes first
    for(let agent of leftTeam){
      const agentIndex = agents.findIndex(a=>a.name === agent.name);
      const turn = await agentTurn({agent, context: text, history});
      const fullTurn = {...turn, round, agentIndex};
      history.push(fullTurn);
      turns.push(fullTurn);
    }

    for(let agent of rightTeam){
      const agentIndex = agents.findIndex(a=>a.name === agent.name);
      const turn = await agentTurn({agent, context: text, history});
      const fullTurn = {...turn, round, agentIndex};
      history.push(fullTurn);
      turns.push(fullTurn);
    }
  }

  return { topics: uniqueDomains, agents, messages: turns };
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
  let { numRounds = 1, temperature = 0.7, teamSize = 3 } = opts;
  numRounds = [1, 3, 5].includes(Number(numRounds)) ? Number(numRounds) : 1;
  teamSize = Math.max(1, Math.min(Number(teamSize) || 3, 5)); // added this in case I want to expand the team size later. Allows up to 5 per side

  const context = article.content_original || article.content || article.title || "";
  const result = await generateDebateFromText(context, { teamSize, numRounds });

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
      side: m.side,
      ts: m.ts || new Date(),
    })),
    params: {
      model: process.env.LLM_MODEL,
      temperature,
      numRounds,
      teamSize,
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
