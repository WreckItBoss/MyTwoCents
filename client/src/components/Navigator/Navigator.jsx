// components/Navigator.jsx
import { Link } from "react-router-dom";
import "./Navigator.css";

export default function Navigator() {
  return (
    <nav className="nav-bleed">
      <div className="nav-inner">
        <Link to="/" className="nav-brand">MyTwoCents</Link>
      </div>
    </nav>
  );
}
