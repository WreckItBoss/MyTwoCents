
//ChatGPT

const OpenAI = require("openai");
require("dotenv").config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function llmChat({ system, messages, temperature = 1 }) {
  console.log("\n[llmChat] MODEL:", process.env.LLM_MODEL);
  const res = await client.chat.completions.create({
    model: process.env.LLM_MODEL || "gpt-4o-mini",
    messages: [
      ...(system ? [{ role: "system", content: system }] : []),
      ...messages,
    ],
    temperature,
  });

  return res.choices[0].message.content;
}

module.exports = { llmChat };
