export default function MessageList({ agents = [], messages = [] }) {
  const getAgentByIndex = (idx) => agents[idx] || null;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {messages.map((m, i) => {
        const agent = typeof m.agentIndex === "number" ? getAgentByIndex(m.agentIndex) : null;
        const side = m.side || agent?.side || "left";
        const who = m.speaker || agent?.name || "Agent";
        const when = m.ts ? new Date(m.ts).toLocaleTimeString() : "";

        const alignSelf = side === "right" ? "end" : "start";
        const bg = side === "right" ? "#ed8989ff" : "#80b7f2ff";
        const border = side === "right" ? "#ed8989ff" : "#80b7f2ff";

        return (
          <div
            key={i}
            style={{
              justifySelf: alignSelf,
              maxWidth: "78%",
              border: `1px solid ${border}`,
              borderRadius: 10,
              padding: 12,
              fontSize: 13,
              background: bg,
            }}
          >
            <div style={{ fontSize: 14, color: "white", marginBottom: 6 }}>
              <strong>{who}</strong>{" "}
              <span style={{ color: "#555" }}>
                {side.toUpperCase()} {when && `• ${when}`}
              </span>
            </div>
            <div style={{ lineHeight: 1.5 }}>{m.text}</div>
          </div>
        );
      })}
    </div>
  );
}
