import { useEffect, useState } from "react";
import {useNavigate} from "react-router-dom";
import {listNews} from "../api.jsx";
import ArticleCard from "../components/ArticleCard.jsx";

export default function Articles(){
    const nav = useNavigate();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(()=>{
        (async ()=>{
            try {
                setLoading(true);
                const data = await listNews({limit: 20});
                setArticles(data);
            } catch (e) {
                setErr(e.message);
            }finally{
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <div>Loading articles...</div>
    if (err) return <div style={{ color: "crimson" }}>Error: {err}</div>;
    if (!articles.length) return <div>No articles found.</div>;

    return(
        <div>
            <h2 style={{ margin: "8px 0 16px" }}>Latest Articles</h2>
            {articles.map((a) => (
                <ArticleCard 
                    key={a._id} 
                    article={a} 
                    onDebate={() => nav(`/debate/${a._id}`)} 
                />
            ))}
        </div>
    );
}