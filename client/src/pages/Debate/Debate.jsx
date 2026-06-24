import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getArticle, generateDebate } from "../../api.jsx";
import TopicChips from "../../components/TopicChips.jsx";
import MessageList from "../../components/MessageList.jsx";
import "./Debate.css";

export default function Debate() {
  const { articleId } = useParams();

  const [teamSize] = useState(1);
  const [userPosition, setUserPosition] = useState(null);
  const [showChat, setShowChat] = useState(false);

  const [article, setArticle] = useState(null);
  const [loadingArticle, setLoadingArticle] = useState(true);
  const [debateLoading, setDebateLoading] = useState(false);
  const [debateError, setDebateError] = useState("");
  const [debate, setDebate] = useState({topics: [], agents: [], messages: []});

  const [streamEvent, setStreamEvent] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoadingArticle(true);
        const doc = await getArticle(articleId);
        setArticle(doc);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingArticle(false);
      }
    })();
  }, [articleId]);

  const onGenerate = async () => {
    try {
      setDebateLoading(true);
      setDebateError("");

      const stream = generateDebate({
        articleId,
        numRounds: 3,
        teamSize,
        userPosition,
      })

      stream.addEventListener("thinking", (event) => {
        setStreamEvent(`${JSON.parse(event.data).speaker} is thinking... `);
        console.log("thinking event: ", event.data);
      }); 
      stream.addEventListener("message", (event) => {
        const incomingMessages = JSON.parse(event.data);
        setDebate((prev)=>{
          return{
            ...prev,
            messages: [
              ...prev.messages,
              incomingMessages
            ]
          }
        });
        
        console.log("Message ", JSON.parse(event.data).text);
      });
      stream.addEventListener("agent_creation", (event) => {
        setStreamEvent("Creating speclialists...");
        console.log("Agents are being created...");
      });
      stream.addEventListener("agent_creation_completed", (event) => {
        const incomingAgents = JSON.parse(event.data).roles;
        const supportAgents = incomingAgents.support.map((role)=>({name: role, stance: "support"}));
        const opposeAgents = incomingAgents.oppose.map((role) => ({name: role, stance: "oppose"}));
        setDebate((prev) => {
          return{
            ...prev,
            agents: [
              ...prev.agents,
              ...supportAgents,
              ...opposeAgents
            ]
          }
        })
        setStreamEvent("Specialists created");
        console.log("Agent created: ", incomingAgents);
      });

      setShowChat(true);
    } catch (e) {
      setDebateError(e.message);
    } finally {
      setDebateLoading(false);
    }
  };

  const topics = debate?.topics ?? [];
  const agents = debate?.agents ?? [];
  const messages = debate?.messages ?? [];

const supportAgents = agents.filter((a) => a.stance === "support");
const opposeAgents = agents.filter((a) => a.stance === "oppose");

  return (
    <div className="debate-page">
      <div className="debate-body">
        <div className="control-bar">
          <button
            onClick={() => setShowChat((s) => !s)}
            title={showChat ? "チャットを隠す" : "チャットを表示"}
          >
            {showChat ? "チャットを隠す" : "チャットを表示"}
          </button>
        </div>

        {debateError && (
          <div style={{ color: "crimson", marginBottom: 12 }}>
            Error: {debateError}
          </div>
        )}

        <div className={`debate-container ${showChat ? "split" : "single"}`}>
          <section className="panel">
            <div className="panel-header">
              <strong>ニュース記事</strong>
            </div>

            <div className="panel-body">
              {loadingArticle && <div>Loading article…</div>}

              {!loadingArticle && !article && (
                <div style={{ color: "#999" }}>Article not found.</div>
              )}

              {article && (
                <>
                  <h3 style={{ margin: "0 0 6px" }}>{article.title}</h3>

                  <div className="meta">
                    {article.source} • {article.topic} •{" "}
                    {article.date
                      ? new Date(article.date).toLocaleDateString()
                      : ""}
                  </div>

                  <div
                    style={{
                      whiteSpace: "pre-wrap",
                      marginTop: 12,
                      lineHeight: 1.6,
                    }}
                  >
                    {article.content_original ||
                      article.content ||
                      "(No content)"}
                  </div>
                </>
              )}
            </div>
          </section>

          {showChat && (
            <section className="panel">
              <div className="panel-header">
                <strong>意見生成チャット</strong>
              </div>

              <div className="panel-body">
                {!debate ? (
                  <div className="debate-controls">
                    <div className="control-row">
                      <p className="toggle-question">
                        <strong>
                          {article?.topic || article?.title || "this article"}
                        </strong>{" "}
                        について賛成ですか？反対ですか？
                      </p>

                      <div className="toggle-buttons">
                        <button
                          className={userPosition === "agree" ? "active" : ""}
                          onClick={() => setUserPosition("agree")}
                        >
                          賛成
                        </button>

                        <button
                          className={
                            userPosition === "disagree" ? "active" : ""
                          }
                          onClick={() => setUserPosition("disagree")}
                        >
                          反対
                        </button>
                      </div>
                    </div>

                    <div className="control-row">
                      <button
                        className="generate-btn"
                        onClick={onGenerate}
                        disabled={debateLoading || !userPosition}
                      >
                        {debateLoading ? "生成中..." : "意見を生成"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <TopicChips topics={topics} />

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                        marginBottom: 16,
                      }}
                    >
                      <div>
                        <div className="team-title">Support</div>
                        <div className="team">
                          {supportAgents.map((a, idx) => (
                            <div key={`support-${idx}`} className="agent-badge">
                              {a.name}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="team-title right">Oppose</div>
                        <div className="team right">
                          {opposeAgents.map((a, idx) => (
                            <div
                              key={`oppose-${idx}`}
                              className="agent-badge right"
                            >
                              {a.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <MessageList agents={agents} messages={messages} />
                  </>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}