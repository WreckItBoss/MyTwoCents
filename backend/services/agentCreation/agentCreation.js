const { llmChat } = require("../../aiModel");
const { renderPrompt } = require("../promptLoader");

async function createAgents(articleText, n = 1) {
  const prompt = renderPrompt("agentCreation/agentCreation.txt", {
    N: n,
    "2N": 2*n,
    newsArticle: articleText,
  });

  const raw = await llmChat({
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
  });

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