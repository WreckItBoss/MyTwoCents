const DebateAgent = require("./DebateAgent");
const { generatePersona } = require("../personaGenerator/personaGenerator");

class DebateManager {
  constructor({ topic, articleText, roles, numRounds = 3 }) {
    this.topic = topic;
    this.articleText = articleText;
    this.roles = roles;
    this.numRounds = numRounds;

    this.agents = [];
    this.debateHistory = [];
  }

    initializeAgents() {
        for (const role of this.roles.support) {
            const persona = generatePersona({
                name: role,
                topic: this.topic,
                stance: "support",
            });

            this.agents.push(
                new DebateAgent({
                    name: role,
                    stance: "support",
                    persona,
                })
            );
        }

        for (const role of this.roles.oppose) {

            const persona = generatePersona({
                name: role,
                topic: this.topic,
                stance: "oppose",
            });

            this.agents.push(
                new DebateAgent({
                    name: role,
                    stance: "oppose",
                    persona,
                })
            );
        }
    }

  async initializeOpinions() {
    for (const agent of this.agents) {
      await agent.generateTopicOpinion(this.topic);
      await agent.generateArticleOpinion(this.topic, this.articleText);
    }
  }

  async runDebate() {
    this.initializeAgents();
    await this.initializeOpinions();

    for (let round = 1; round <= this.numRounds; round++) {
      await this.runRound(round);
    }

    return {
    agents: this.agents.map((agent) => ({
        name: agent.name,
        basis: agent.name,
        stance: agent.stance,
        topicOpinion: agent.topicOpinion,
        articleOpinion: agent.articleOpinion,
    })),
    messages: this.debateHistory,
    numRounds: this.numRounds,
    };
  }

  async runRound(round) {
    if (round === 1) {
      await this.runOpeningRound(round);
    } else {
      await this.runRebuttalRound(round);
    }
  }

  async runOpeningRound(round) {
    const roundMessages = [];

    for (const agent of this.agents) {
      const argument = await agent.generateRebuttal(
        this.topic,
        this.articleText
      );

      const message = this.createMessage(agent, argument, round);

      roundMessages.push({ agent, message });
      this.debateHistory.push(message);
    }

    for (const { agent: speakingAgent, message } of roundMessages) {
      this.broadcastMessage(speakingAgent, message);
    }
  }

  async runRebuttalRound(round) {
    for (const agent of this.agents) {
      const argument = await agent.generateRebuttal(
        this.topic,
        this.articleText
      );

      const message = this.createMessage(agent, argument, round);

      this.debateHistory.push(message);

      this.broadcastMessage(agent, message);
    }
  }

  createMessage(agent, text, round) {
    return {
      round,
      speaker: agent.name,
      stance: agent.stance,
      agentIndex: this.agents.indexOf(agent),
      text,
      ts: new Date(),
    };
  }

  broadcastMessage(speakingAgent, message) {
    for (const otherAgent of this.agents) {
      if (otherAgent !== speakingAgent) {
        otherAgent.observeMessage(
          message.speaker,
          message.stance,
          message.text
        );
      }
    }
  }
}

module.exports = DebateManager;