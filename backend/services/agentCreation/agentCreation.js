const { llmChat } = require("../aiModel");
const { renderPrompt } = require("../renderPrompt");

async function createAgents(articleText, n = 1) {
  const prompt = renderPrompt("agentCreation/agentCreation.txt", {
    N: n,
    article_text: articleText,
  });

  const raw = await llmChat({
    messages: [{ role: "user", content: prompt }],
  });

  console.log("RAW AGENT RESPONSE:", raw);
  return parseAgents(raw);
}

function parseAgents(raw = "") {
  const support = [];
  const oppose = [];

  for (const line of raw.trim().split("\n")) {
    if (line.startsWith("SUPPORT:")) {
      support.push(...parseRoleLine(line, "SUPPORT:"));
    }

    if (line.startsWith("OPPOSE:")) {
      oppose.push(...parseRoleLine(line, "OPPOSE:"));
    }
  }

  return {
    support,
    oppose,
  };
}

function parseRoleLine(line, label) {
  return line
    .replace(label, "")
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);
}

module.exports = {
  createAgents,
};