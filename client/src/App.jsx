import { Routes, Route, Link } from "react-router-dom";
import Articles from "./pages/Article.jsx";
import Debate from "./pages/Debate.jsx";

export default function App() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <header>
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
          <h1>MyTwoCents</h1>
        </Link>
      </header>

      <Routes>
        <Route path="/" element={<Articles />} />
        <Route path="/debate/:articleId" element={<Debate />} />
      </Routes>
    </div>
  );
}
