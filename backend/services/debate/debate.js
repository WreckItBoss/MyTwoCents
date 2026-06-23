const { getNews } = require("../newsservice.js");
const DebateSession = require("../../Models/DebateSession.js");
const {articleToAgents} = require("../agentCreation/articleToAgent.js");
const DebateManager = require("./DebateManager.js");
const { createAgents } = require("../agentCreation/agentCreation.js");

function inferTopicFromArticle(article = {}){
  return (
    article.topic ||
    article.title ||
    "この記事が扱う社会的・政治的トピック"
  );
}

async function generateDebateByArticleID(articleId, options={}){
  const { numRounds = 3, teamSize = 1, userPosition = "Agree", onEvent = () => {}}; //don't use these numRounds, teamSize, userPosition yet. Keep it for now
  const article = await getNews(articleId);

  if (!article){
    const e = new Error("Article not found");
    e.status = 404;
    throw e;
  }

  const topic = inferTopicFromArticle(article);
  console.log("TOPIC:", topic);

  const articleText =
  article.content_original ||
  article.content ||
  article.title ||
  "";

  onEvent({type: "agentCreation", data: "エージェント生成中"});
  const roles = await createAgents(articleText, 1);
  onEvent({type: "agentCreationCompleted", data: "エージェント生成完成"});

  console.log("Generated Roles:", roles);
  
  const manager = new DebateManager({
    topic,
    articleText,
    roles,
    onEvent,
  });

  const result = await manager.runDebate();
  console.log("RESULT AGENTS:", result.agents);
  const sessionDoc = await DebateSession.create({
    articleId: article._id,
    topics: [topic],

    agents: result.agents.map((agent) => ({
      name: agent.name,
      basis: agent.basis,
      stance: agent.stance,
    })),

    messages: result.messages.map((message) => ({
      speaker: message.speaker,
      text: message.text,
      round: message.round,
      agentIndex: message.agentIndex,
      stance: message.stance,
      ts: message.ts || new Date(),
    })),

    params:{
      model: process.env.LLM_MODEL,
      maxAgents: result.agents.length,
      numRounds: result.numRounds,
    },
    sessionLabel: "Supporting vs Opposing",
  });

  return {
    sessionId: sessionDoc._id.toString(),
    articleId: article._id.toString(),
    topics: [topic],
    agents:result.agents,
    messages: result.messages,
    createdAt: sessionDoc.createdAt,
  };
}
module.exports = {
  generateDebateByArticleID,
};
