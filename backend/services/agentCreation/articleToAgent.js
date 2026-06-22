const path = require("path");
const fs = require("fs/promises");
const { llmChat } = require("../aiModel.js");

async function articleToAgents(articleText, count = 3) {
  const promptPath = path.resolve(__dirname, "./prompts/articleToAgent.txt");
  const template = await fs.readFile(promptPath, "utf8");

  const prompt = template.replace(
    /\{News Article\}/g,
    String(articleText || "").slice(0, 2500)
  );

  const raw = await llmChat({
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
  });

  return String(raw || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, count);
}

module.exports = { articleToAgents };