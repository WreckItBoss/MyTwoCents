import { useEffect, useState } from "react";
import {useParams, Link} from "react-router-dom";
import { generateDebate } from "../api.jsx";
import TopicChips from "../components/TopicChips.jsx";
import MessageList from "../components/MessageList.jsx";

export default function Debate(){
    const {articleId} = useParams();
    const[state, setState] = useState({loading: true, error: "", data: null});
    
    useEffect(()=>{
        let cancelled = false;
        (async()=>{
            console.log("🔄 Fetching debate...");
            try {
                setState({loading: true, error: "", data:null});
                const data = await generateDebate({articleId, numRounds: 1, maxAgents: 3});
                console.log("✅ Debate data:", data);
                if(!cancelled) setState({loading: false, error: "", data: data});
            } catch (error) {
                console.error("❌ Error fetching debate:", error);
                if (!error) setState({loading: false, error: error.message, data: null});
            }
        })();
        return () => { cancelled = true; };
    }, [articleId]);
    if (state.loading) return <div>Generating your two cents…</div>;
    if (state.error) return <div style={{ color: "crimson" }}>Error: {state.error}</div>;

    const { topics = [], agents = [], messages = [] } = state.data || {};

    return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Link to="/" style={{ fontSize: 14 }}>&larr; Back</Link>
      </div>

      <h2 style={{ marginTop: 0 }}>Debate</h2>
      <TopicChips topics={topics} />

      {/* Agents summary */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {agents.map((a, idx) => (
          <div key={idx} style={{
            border: "1px solid #e5e7eb",
            background: "#f9fafb",
            padding: "6px 10px",
            borderRadius: 8,
            fontSize: 12
          }}>
            {(a.name) ? a.name : (a.basis ? `${a.basis} Specialist` : `Agent ${idx+1}`)}
          </div>
        ))}
      </div>

      <MessageList agents={agents} messages={messages} />
    </div>
  );

}