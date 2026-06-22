const { getNews } = require("./newsservice.js");
const DebateSession = require("../Models/DebateSession.js");
const {articleToAgents} = require("./agentCreation/articleToAgent.js");
const DebateManager = require("./debate/DebateManager.js");
const { createAgents } = require("./agentCreation/agentCreation.js");

function inferTopicFromArticle(article = {}){
  rturn (
    article.topic ||
    article.title ||
    "この記事が扱う社会的・政治的トピック"
  );
}

async function generateDebateByArticleID(articleId){
  const article = await getNews(articleId);

  if (!article){
    const e = new Error("Article not found");
    e.status = 404;
    throw e;
  }

  const topic = inferTopicFromArticle(article);

  const articleText =
  article.content_original ||
  article.content ||
  article.title ||
  "";

  const roles = await createAgents(articleText, 1);

  const manager = new DebateManager({
    topic,
    articleText,
    roles,
  });

  const result = await manager.runDebate();

  const sessionDoc = await DebateSession.create({
    articleId: article._id,
    topic: [topic],

    agents: result.agents.map((agent) => ({
      name: agent.name,
      basis: agent.basis,
      side: agent.side,
    })),

    messages: result.messages.map((message) =>({
      speaker: message.speaker,
      text: message.text,
      round: message.round,
      agentIndex: message.agentIndex,
      side: message.side,
      ts: message.ts || new Date(),
    })),

    params:{
      model: proccess.env.LLM_MODEL,
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
