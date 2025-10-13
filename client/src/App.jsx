import { Routes, Route } from "react-router-dom";
import Articles from "./pages/Article.jsx";
import Debate from "./pages/Debate/Debate.jsx";
import Navigator from "./components/Navigator/Navigator.jsx";

export default function App() {
  // One consistent shell for all pages (pick one):
  // A) Full-width app:
  const shellStyle = { maxWidth: "none", margin: 0, padding: 0, };
  // B) Or boxed app (centered):
  // const shellStyle = { maxWidth: 900, margin: "0 auto", padding: 16 };

  return (
    <>
      <Navigator />
      <div style={shellStyle}>
        <Routes>
          <Route path="/" element={<Articles />} />
          <Route path="/debate/:articleId" element={<Debate />} />
        </Routes>
      </div>
    </>
  );
}
