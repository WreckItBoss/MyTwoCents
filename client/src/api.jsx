const BASE = import.meta.env.VITE_API_BASE;

async function http(url, options={}){
    const res = await fetch(`{BASE}${url}`, {
        headers: {"Content-Type": "application/json"};
        ...options,
    });
    if (!res.ok){
        const text = await res.text().catch(()=>"");
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }
    return res.json();
}

export function listNews({limit = 20} = {}){
    const qs = new URLSearchParams({limit: String(limit)});
    return http(`/api/news?${qs.toString()}`);
}

export function generateDebate({articleId, numRounds = 1, maxAgents = 3}){
    return http(`/api/debates/generate`,{
        method: "POST",
        body: JSON.stringify({articleId, numRounds, maxAgents}),
    });
}