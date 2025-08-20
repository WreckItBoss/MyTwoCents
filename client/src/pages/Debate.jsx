import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { generateDebate } from "../api.jsx";
import TopicChips from "../components/TopicChips.jsx";
import MessageList from "../components/MessageList.jsx";

export default function Debate() {
  const { articleId } = useParams();

  // UI state
  const [rounds, setRounds] = useState(1);
  const teamSize = 3;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null); // { topics, agents, messages }

  const onGenerate = async () => {
    try {
      setLoading(true);
      setError("");
      setData(null);
      const res = await generateDebate({ articleId, numRounds: rounds, teamSize });
      setData(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const topics = data?.topics ?? [];
  const agents = data?.agents ?? [];
  const messages = data?.messages ?? [];

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Link to="/" style={{ fontSize: 14 }}>&larr; Back</Link>
      </div>

      <h2 style={{ marginTop: 0 }}>Debate</h2>

      {/* Control bar — place this ABOVE the messages list */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "12px 0" }}>
        <label>Each agent speaks:</label>
        <select value={rounds} onChange={e => setRounds(Number(e.target.value))}>
          <option value={1}>1 time</option>
          <option value={3}>3 times</option>
          <option value={5}>5 times</option>
        </select>
        <button
          onClick={onGenerate}
          disabled={loading}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc", cursor: "pointer" }}
        >
          {loading ? "Generating…" : "Generate"}
        </button>
        <span style = {{marginLeft: 8, fontsize: 12, color: "#666"}}>
          Teams: {teamSize} vs {teamSize}
        </span>
      </div>

      {/* Loading / error / empty states */}
      {error && <div style={{ color: "crimson", marginBottom: 12 }}>Error: {error}</div>}
      {!loading && !data && <div style={{ color: "#666", marginBottom: 12 }}>Pick rounds and click Generate.</div>}

      {/* Debate content */}
      {data && (
        <>
          <TopicChips topics={topics} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {agents.map((a, idx) => (
              <div key={idx} style={{
                border: "1px solid #e5e7eb", background: "#f9fafb",
                padding: "6px 10px", borderRadius: 8, fontSize: 12
              }}>
                {a.name || (a.basis ? `${a.basis} Specialist` : `Agent ${idx+1}`)}
              </div>
            ))}
          </div>
          <MessageList agents={agents} messages={messages} />
        </>
      )}
    </div>
  );
}
