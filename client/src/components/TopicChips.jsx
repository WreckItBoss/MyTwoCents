export default function TopicChips({ topics = [] }) {
  if (!topics.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
      {topics.map(t => (
        <span key={t} style={{
          fontSize: 12,
          background: "#f3f4f6",
          border: "1px solid #e5e7eb",
          padding: "4px 8px",
          borderRadius: 999
        }}>
          {t}
        </span>
      ))}
    </div>
  );
}
