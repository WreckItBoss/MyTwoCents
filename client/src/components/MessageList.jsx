export default function MessageList({ agents = [], messages = [] }) {
  const getAgentByIndex = (idx) => agents[idx] || null;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {messages.map((m, i) => {
        const agent =
          typeof m.agentIndex === "number" ? getAgentByIndex(m.agentIndex) : null;

        const stance = m.stance || agent?.stance || "support";
        const who = m.speaker || agent?.name || "Agent";
        const stanceLabel = stance === "support" ? "Support" : "Oppose";
        const when = m.ts ? new Date(m.ts).toLocaleTimeString() : "";

        const isOppose = stance === "oppose";
        const alignSelf = isOppose ? "end" : "start";
        const bg = isOppose ? "#fee2e2" : "#dbeafe";
        const border = isOppose ? "#fca5a5" : "#93c5fd";

        return (
          <div
            key={i}
            style={{
              justifySelf: alignSelf,
              maxWidth: "78%",
              border: `1px solid ${border}`,
              borderRadius: 12,
              padding: 12,
              fontSize: 14,
              background: bg,
              textAlign: "left",
            }}
          >
            <div style={{ marginBottom: 6 }}>
              <strong>{who}</strong>
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 12,
                  color: isOppose ? "#991b1b" : "#1d4ed8",
                  fontWeight: 600,
                }}
              >
                {stanceLabel}
              </span>
            </div>

            {when && (
              <div style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>
                {when}
              </div>
            )}

            <div style={{ lineHeight: 1.6 }}>{m.text}</div>
          </div>
        );
      })}
    </div>
  );
}