
/** ---------- Stage 3: Rebuttal Generation ---------- **/
async function generateRebuttal({
  topic,
  articleText,
  agent,
  topicOpinion,
  newsOpinion,
  history,
}) {
  const system = buildSystemPrompt(agent);
  const digest = recentHistory(history, 1800);

  const userPrompt = `
Topic:
${topic}

News Article:
${clip(articleText, 1200)}

Topic-based opinion:
${topicOpinion}

Article-based opinion:
${newsOpinion}

Previous dialogue history:
${digest || "(none yet)"}

Task:
Generate your next rebuttal in the debate.

Requirements:
- Integrate the topic-based opinion and article-based opinion into the response
- Generate a rebuttal using the dialogue history, directly addressing the opponent’s most recent claim if present
- Maintain consistency with the assigned stance
- Minor agreement is allowed, but the overall stance must not change
- Be concise, professional, and evidence-based
- Limit the response to ≤120 words
  `.trim();

  const reply = await llmChat({
    system,
    messages: [{ role: "user", content: userPrompt }],
    temperature: 0,
  });

  return (reply || "").trim();
}
