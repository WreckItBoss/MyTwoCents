export default function MessageList({ agents = [], messages = [] }) {
  const getSpeakerLabel = (i) => {
    const idx = agents.length ? i % agents.length : 0;
    const a = agents[idx];
    if (!a) return "Agent";
    // if your backend includes agent.name, prefer it; else synthesize from basis
    const name = a.name || (a.basis ? `${a.basis} Specialist` : "Agent");
    return name;
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {messages.map((m, i) => {
        const when = m.ts ? new Date(m.ts).toLocaleTimeString() : "";
        const who = m.speaker || getSpeakerLabel(i);
        return (
          <div key={i} style={{
            border: "1px solid #eee",
            borderRadius: 10,
            padding: 12,
            background: "white"
          }}>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>
              <strong>{who}</strong> <span style={{ color: "#999" }}>{when}</span>
            </div>
            <div style={{ lineHeight: 1.5 }}>{m.text}</div>
          </div>
        );
      })}
    </div>
  );
}
