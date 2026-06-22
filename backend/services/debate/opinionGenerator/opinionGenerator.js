/** ---------- Stage 1: Topic Opinion Generation ---------- **/
async function generateTopicOpinion({ topic, agent }) {
  const system = buildSystemPrompt(agent);

  const userPrompt = `
Topic:
${topic}

Assigned stance:
${agent.stanceLabel}

Task:
Generate your stance-consistent opinion about the TOPIC itself, based on your internal knowledge.

Requirements:
- Clearly state your position on the topic
- Use general knowledge and reasoning
- Mention 1–2 key arguments supporting your stance
- Keep it concise (≤100 words)
  `.trim();

  const reply = await llmChat({
    system,
    messages: [{ role: "user", content: userPrompt }],
    temperature: 0,
  });

  const output = (reply || "").trim();
  logStage("STAGE 1: Topic Opinion", agent, topic, output);

  return output
}
