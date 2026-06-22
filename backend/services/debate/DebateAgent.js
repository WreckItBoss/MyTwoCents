const { llmChat } = require("../aiModel");
const { renderPrompt } = require("../renderPrompt");

class DebateAgent {
  constructor({ name, stance, persona }) {
    this.name = name;
    this.stance = stance;
    this.persona = persona;

    this.topicOpinion = null;
    this.articleOpinion = null;
    this.latestArgument = null;

    this.messages = [
      {
        role: "system",
        content: persona,
      },
    ];
  }

  async generateTopicOpinion(topic) {
    const prompt = renderPrompt("debatePrompt/opinionGenerator.txt", {
      topic,
      stance: this.stance,
    });

    this.topicOpinion = await llmChat({
      messages: [
        { role: "system", content: this.persona },
        { role: "user", content: prompt },
      ],
    });

    return this.topicOpinion;
  }

  async generateArticleOpinion(topic, articleText) {
    const prompt = renderPrompt("debatePrompt/articleOpinionGenerator.txt", {
      topic,
      articleText,
      stance: this.stance,
    });

    this.articleOpinion = await llmChat({
      messages: [
        { role: "system", content: this.persona },
        { role: "user", content: prompt },
      ],
    });

    return this.articleOpinion;
  }

  async generateRebuttal(topic, articleText) {
    const prompt = renderPrompt("debatePrompt/rebuttalGenerator.txt", {
      topic,
      stance: this.stance,
      articleText,
      articleOpinion: this.articleOpinion,
      topicOpinion: this.topicOpinion,
    });

    this.messages.push({
      role: "user",
      content: prompt,
    });

    const response = await llmChat({
      messages: this.messages,
    });

    this.messages.push({
      role: "assistant",
      content: response,
    });

    this.latestArgument = response;
    return response;
  }

  observeMessage(speakerName, speakerStance, text) {
    this.messages.push({
      role: "user",
      content: `${speakerName} (${speakerStance}) said:\n${text}`,
    });
  }
}

module.exports = DebateAgent;