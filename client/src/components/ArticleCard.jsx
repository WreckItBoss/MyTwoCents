export default function ArticleCard({ article = {}, onDebate }) {
  const date = article.date ? new Date(article.date).toLocaleDateString() : "";
  return (
    <div style={{
      border: "1px solid #eee",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      display: "flex",
      justifyContent: "space-between",
      gap: 12
    }}>
      <div>
        <div style={{ fontSize: 14, color: "#666" }}>{article.source}</div>
        <div style={{ fontWeight: 600, marginTop: 4 }}>{article.title}</div>
        <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
          {article.topic} • {date}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <button onClick={onDebate} style={{
          border: "none",
          background: "black",
          color: "white",
          padding: "10px 14px",
          borderRadius: 8,
          cursor: "pointer"
        }}>
          What are my two cents?
        </button>
      </div>
    </div>
  );
}
