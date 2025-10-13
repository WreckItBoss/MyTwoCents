// import { useEffect, useState } from "react";
// import { useParams, Link } from "react-router-dom";
// import { getArticle, generateDebate } from "../../api.jsx";
// import TopicChips from "../../components/TopicChips.jsx";
// import MessageList from "../../components/MessageList.jsx";
// import "./Debate.css";

// export default function Debate() {
//   const { articleId } = useParams();

//   const [rounds, setRounds] = useState(1);
//   const [teamSize] = useState(3);
//   const [showChat, setShowChat] = useState(false);

//   const [article, setArticle] = useState(null);
//   const [loadingArticle, setLoadingArticle] = useState(true);
//   const [debateLoading, setDebateLoading] = useState(false);
//   const [debateError, setDebateError] = useState("");
//   const [debate, setDebate] = useState(null);

//   useEffect(() => {
//     (async () => {
//       try {
//         setLoadingArticle(true);
//         const doc = await getArticle(articleId);
//         setArticle(doc);
//       } catch (e) {
//         console.error(e);
//       } finally {
//         setLoadingArticle(false);
//       }
//     })();
//   }, [articleId]);

//   const onGenerate = async () => {
//     try {
//       setDebateLoading(true);
//       setDebateError("");
//       const res = await generateDebate({ articleId, numRounds: rounds, teamSize });
//       setDebate(res);
//       setShowChat(true);
//     } catch (e) {
//       setDebateError(e.message);
//     } finally {
//       setDebateLoading(false);
//     }
//   };

//   const topics = debate?.topics ?? [];
//   const agents = debate?.agents ?? [];
//   const messages = debate?.messages ?? [];

//   return (
//     <div className = "debate-page">
//       <div className = "debate-body">
//       {/* Controls */}
//       <div className="control-bar">
//         <label>Each agent speaks:</label>
//         <select value={rounds} onChange={e => setRounds(Number(e.target.value))}>
//           <option value={1}>1 time</option>
//           <option value={3}>3 times</option>
//           <option value={5}>5 times</option>
//         </select>

//         <button onClick={onGenerate} disabled={debateLoading}>
//           {debateLoading ? "Generating…" : "Generate Debate"}
//         </button>

//         <button onClick={() => setShowChat(s => !s)} title={showChat ? "Hide debate" : "Show debate"}>
//           {showChat ? "Hide Debate" : "Show Debate"}
//         </button>

//         <span>Teams: {teamSize}v{teamSize}</span>
//       </div>

//       {debateError && <div style={{ color: "crimson", marginBottom: 12 }}>Error: {debateError}</div>}

//       <div className={`debate-container ${showChat ? "split" : "single"}`}>
//         {/* Article panel */}
//         <section className="panel">
//           <div className="panel-header"><strong>Article</strong></div>
//           <div className="panel-body">
//             {loadingArticle && <div>Loading article…</div>}
//             {!loadingArticle && !article && <div style={{ color: "#999" }}>Article not found.</div>}
//             {article && (
//               <>
//                 <h3 style={{ margin: "0 0 6px" }}>{article.title}</h3>
//                 <div className="meta">
//                   {article.source} • {article.topic} •{" "}
//                   {article.date ? new Date(article.date).toLocaleDateString() : ""}
//                 </div>
//                 <div style={{ whiteSpace: "pre-wrap", marginTop: 12, lineHeight: 1.6 }}>
//                     {article.content_original || article.content || "(No content)"}
//                 </div>
//               </>
//             )}
//           </div>
//         </section>

//         {/* Debate panel */}
//         {showChat && (
//           <section className="panel">
//             <div className="panel-header">
//               <strong>Debate</strong>
//               <div style={{ fontSize: 12, color: "#666" }}>
//                 {agents.filter(a => a.side === "left").length} left • {agents.filter(a => a.side === "right").length} right
//               </div>
//             </div>
//             <div className="panel-body">
//               {debate ? (
//                 <>
//                   <TopicChips topics={topics} />
//                   <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
//                     <div>
//                       <div className="team-title">Left Team</div>
//                       <div className="team">
//                         {agents.filter(a => a.side === "left").map((a, idx) => (
//                           <div key={`L${idx}`} className="agent-badge">{a.name}</div>
//                         ))}
//                       </div>
//                     </div>
//                     <div>
//                       <div className="team-title right">Right Team</div>
//                       <div className="team right">
//                         {agents.filter(a => a.side === "right").map((a, idx) => (
//                           <div key={`R${idx}`} className="agent-badge right">{a.name}</div>
//                         ))}
//                       </div>
//                     </div>
//                   </div>

//                   <MessageList agents={agents} messages={messages} />
//                 </>
//               ) : (
//                 <div style={{ color: "#666" }}>
//                   Pick rounds and click <em>Generate Debate</em>, or toggle “Show Debate” anytime.
//                 </div>
//               )}
//             </div>
//           </section>
//         )}
//       </div>
//       </div>
//     </div>
//   );
// }
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getArticle, generateDebate } from "../../api.jsx";
import TopicChips from "../../components/TopicChips.jsx";
import MessageList from "../../components/MessageList.jsx";
import "./Debate.css";

export default function Debate() {
  const { articleId } = useParams();

  const [rounds, setRounds] = useState(1);
  const [teamSize] = useState(3);
  const [userPosition, setUserPosition] = useState(null);
  const [showChat, setShowChat] = useState(false);

  const [article, setArticle] = useState(null);
  const [loadingArticle, setLoadingArticle] = useState(true);
  const [debateLoading, setDebateLoading] = useState(false);
  const [debateError, setDebateError] = useState("");
  const [debate, setDebate] = useState(null);

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
      console.log("frontend sending stance:", userPosition);
      setDebateLoading(true);
      setDebateError("");
      const res = await generateDebate({
        articleId,
        // numRounds: rounds,
        numRounds: 1,
        teamSize,
        userPosition,
      });
      setDebate(res);
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

  return (
    <div className="debate-page">
      <div className="debate-body">
        {/* Keep the toggle show/hide button */}
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
          {/* Article panel */}
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

          {/* Debate panel */}
          {showChat && (
            <section className="panel">
              <div className="panel-header">
                <strong>意見生成チャット</strong>
                {/* {debate && (
                  <button className="back-btn" onClick={() => setDebate(null)}>
                    ← Back
                  </button>
                )} */}
              </div>
              <div className="panel-body">
                {!debate ? (
                  // === SETTINGS VIEW ===
                  <div className="debate-controls">
                    {/* Row 1: rounds */}
                    {/* <div className="control-row">
                      <p>Each agent speaks: 1 time</p>
                      <select
                        value={rounds}
                        onChange={(e) => setRounds(Number(e.target.value))}
                      >
                        <option value={1}>1 time</option>
                        <option value={3}>3 times</option>
                        <option value={5}>5 times</option>
                      </select>
                    </div> */}

                    {/* Row 2: stance toggle */}
                    <div className="control-row">
                      <p className="toggle-question">
                        <strong>{article?.topic || article?.title || "this article"}</strong>{" "}について賛成ですか？反対ですか？
                      </p>
                      <div className="toggle-buttons">
                        <button
                          className={userPosition === "agree" ? "active" : ""}
                          onClick={() => setUserPosition("agree")}
                        >
                          賛成
                        </button>
                        <button
                          className={userPosition === "disagree" ? "active" : ""}
                          onClick={() => setUserPosition("disagree")}
                        >
                          反対
                        </button>
                      </div>
                    </div>

                    {/* Row 3: generate button */}
                    <div className="control-row">
                      <button
                        className="generate-btn"
                        onClick={onGenerate}
                        disabled={debateLoading || !userPosition}
                      >
                        {/* {debateLoading ? "Generating…" : "Generate Debate"} */}
                        {debateLoading ? "生成中..." : "意見を生成"}
                      </button>
                    </div>
                  </div>

                ) : (
                  // === DEBATE CHAT VIEW ===
                  <>
                    <TopicChips topics={topics} />
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <div className="team-title">賛成派</div>
                        {/* <div className="team">
                          {agents
                            .filter((a) => a.side === "left")
                            .map((a, idx) => (
                              <div key={`L${idx}`} className="agent-badge">
                                {a.name}
                              </div>
                            ))}
                        </div> */}
                      </div>
                      <div>
                        <div className="team-title right">反対派</div>
                        {/* <div className="team right">
                          {agents
                            .filter((a) => a.side === "right")
                            .map((a, idx) => (
                              <div key={`R${idx}`} className="agent-badge right">
                                {a.name}
                              </div>
                            ))}
                        </div> */}
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
