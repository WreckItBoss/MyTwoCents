// import { useState } from "react";
// import { useParams, Link } from "react-router-dom";
// import { generateDebate } from "../api.jsx";
// import TopicChips from "../components/TopicChips.jsx";
// import MessageList from "../components/MessageList.jsx";

// export default function Debate() {
//   const { articleId } = useParams();

//   // UI state
//   const [rounds, setRounds] = useState(1);
//   const teamSize = 3;
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [data, setData] = useState(null); // { topics, agents, messages }

//   const onGenerate = async () => {
//     try {
//       setLoading(true);
//       setError("");
//       setData(null);
//       const res = await generateDebate({ articleId, numRounds: rounds, teamSize });
//       setData(res);
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const topics = data?.topics ?? [];
//   const agents = data?.agents ?? [];
//   const messages = data?.messages ?? [];

//   return (
//     <div>
//       <div style={{ marginBottom: 12 }}>
//         <Link to="/" style={{ fontSize: 14 }}>&larr; Back</Link>
//       </div>

//       <h2 style={{ marginTop: 0 }}>Debate</h2>

//       {/* Control bar — place this ABOVE the messages list */}
//       <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "12px 0" }}>
//         <label>Each agent speaks:</label>
//         <select value={rounds} onChange={e => setRounds(Number(e.target.value))}>
//           <option value={1}>1 time</option>
//           <option value={3}>3 times</option>
//           <option value={5}>5 times</option>
//         </select>
//         <button
//           onClick={onGenerate}
//           disabled={loading}
//           style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc", cursor: "pointer" }}
//         >
//           {loading ? "Generating…" : "Generate"}
//         </button>
//         <span style = {{marginLeft: 8, fontsize: 12, color: "#666"}}>
//           Teams: {teamSize} vs {teamSize}
//         </span>
//       </div>

//       {/* Loading / error / empty states */}
//       {error && <div style={{ color: "crimson", marginBottom: 12 }}>Error: {error}</div>}
//       {!loading && !data && <div style={{ color: "#666", marginBottom: 12 }}>Pick rounds and click Generate.</div>}

//       {/* Debate content */}
//       {data && (
//         <>
//           <TopicChips topics={topics} />
//           <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
//             {agents.map((a, idx) => (
//               <div key={idx} style={{
//                 border: "1px solid #e5e7eb", background: "#f9fafb",
//                 padding: "6px 10px", borderRadius: 8, fontSize: 12
//               }}>
//                 {a.name || (a.basis ? `${a.basis} Specialist` : `Agent ${idx+1}`)}
//               </div>
//             ))}
//           </div>
//           <MessageList agents={agents} messages={messages} />
//         </>
//       )}
//     </div>
//   );
// }


import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getArticle, generateDebate } from "../api.jsx";
import TopicChips from "../components/TopicChips.jsx";
import MessageList from "../components/MessageList.jsx";

export default function Debate() {
  const { articleId } = useParams();

  // UI state
  const [rounds, setRounds] = useState(1);      // 1 / 3 / 5 (per agent)
  const [teamSize] = useState(3);               // agents per side (left vs right)
  const [showChat, setShowChat] = useState(false);

  // Data
  const [article, setArticle] = useState(null);
  const [loadingArticle, setLoadingArticle] = useState(true);
  const [debateLoading, setDebateLoading] = useState(false);
  const [debateError, setDebateError] = useState("");
  const [debate, setDebate] = useState(null);   // { topics, agents, messages }

  // Fetch article
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
      const res = await generateDebate({ articleId, numRounds: rounds, teamSize });
      setDebate(res);
      setShowChat(true);
    } catch (e) {
      setDebateError(e.message);
    } finally {
      setDebateLoading(false);
    }
  };

  const topics  = debate?.topics ?? [];
  const agents  = debate?.agents ?? [];
  const messages = debate?.messages ?? [];

  // Layout styles
  const container = {
    display: "grid",
    gridTemplateColumns: showChat ? "1fr 1fr" : "1fr",
    gap: 16,
    alignItems: "start",
  };

  const panel = {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
    background: "#fff",
  };

  const header = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    borderBottom: "1px solid #e5e7eb",
    background: "#f9fafb",
  };

  const bodyScroll = {
    padding: 16,
    maxHeight: "70vh",
    overflow: "auto",
    textAlign: "left",
  };

  const meta = { color: "#666", fontSize: 13, marginTop: 6 };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Link to="/" style={{ fontSize: 14 }}>&larr; Back</Link>
      </div>

      <h2 style={{ marginTop: 0 }}>Debate</h2>

      {/* Controls row */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "12px 0" }}>
        <label>Each agent speaks:</label>
        <select value={rounds} onChange={e => setRounds(Number(e.target.value))}>
          <option value={1}>1 time</option>
          <option value={3}>3 times</option>
          <option value={5}>5 times</option>
        </select>

        <button
          onClick={onGenerate}
          disabled={debateLoading}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc", cursor: "pointer" }}
        >
          {debateLoading ? "Generating…" : "Generate Debate"}
        </button>

        <button
          onClick={() => setShowChat(s => !s)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc", marginLeft: 8 }}
          title={showChat ? "Hide debate" : "Show debate"}
        >
          {showChat ? "Hide Debate" : "Show Debate"}
        </button>

        <span style={{ marginLeft: 8, fontSize: 12, color: "#666" }}>
          Teams: {teamSize}v{teamSize}
        </span>
      </div>

      {debateError && <div style={{ color: "crimson", marginBottom: 12 }}>Error: {debateError}</div>}

      {/* Split layout */}
      <div style={container}>
        {/* Left: Article */}
        <section style={panel}>
          <div style={header}>
            <strong>Article</strong>
          </div>
          <div style={bodyScroll}>
            {loadingArticle && <div>Loading article…</div>}
            {!loadingArticle && !article && <div style={{ color: "#999" }}>Article not found.</div>}
            {article && (
              <>
                <h3 style={{ margin: "0 0 6px" }}>{article.title}</h3>
                <div style={meta}>
                  {article.source} • {article.topic} •{" "}
                  {article.date ? new Date(article.date).toLocaleDateString() : ""}
                </div>
                <div style={{ whiteSpace: "pre-wrap", marginTop: 12, lineHeight: 1.6 }}>
                  {article.content_original || article.content || "(No content)"}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Right: Debate (toggle) */}
        {showChat && (
          <section style={panel}>
            <div style={header}>
              <strong>Debate</strong>
              {/* Small roster hint */}
              <div style={{ fontSize: 12, color: "#666" }}>
                {agents.filter(a => a.side === "left").length} left • {agents.filter(a => a.side === "right").length} right
              </div>
            </div>
            <div style={bodyScroll}>
              {/* Topics + rosters */}
              {debate ? (
                <>
                  <TopicChips topics={topics} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>Left Team</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {agents.filter(a => a.side === "left").map((a, idx) => (
                          <div key={`L${idx}`} style={{
                            border: "1px solid #e5e7eb", background: "#f3f4f6",
                            padding: "6px 10px", borderRadius: 8, fontSize: 12
                          }}>
                            {a.name}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 6, textAlign: "right" }}>Right Team</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {agents.filter(a => a.side === "right").map((a, idx) => (
                          <div key={`R${idx}`} style={{
                            border: "1px solid #cfe0ff", background: "#eef6ff",
                            padding: "6px 10px", borderRadius: 8, fontSize: 12
                          }}>
                            {a.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <MessageList agents={agents} messages={messages} />
                </>
              ) : (
                <div style={{ color: "#666" }}>
                  Pick rounds and click <em>Generate Debate</em>, or toggle “Show Debate” anytime.
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
