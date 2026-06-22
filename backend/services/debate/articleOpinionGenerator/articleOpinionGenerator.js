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