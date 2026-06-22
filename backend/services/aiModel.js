
//ChatGPT

const OpenAI = require("openai");
require("dotenv").config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function llmChat({ system, messages}) {
  console.log("\n[llmChat] MODEL:", process.env.LLM_MODEL);
  const res = await client.chat.completions.create({
    model: process.env.LLM_MODEL || "gpt-4o-mini",
    messages: [
      ...(system ? [{ role: "system", content: system }] : []),
      ...messages,
    ],
  });

  return res.choices[0].message.content;
}

module.exports = { llmChat };
