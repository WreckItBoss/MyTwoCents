const BASE = import.meta.env.VITE_API_BASE;

// async function http(url, options={}){
//     const res = await fetch(`{BASE}${url}`, {
//         headers: {"Content-Type": "application/json"};
//         ...options,
//     });
//     if (!res.ok){
//         const text = await res.text().catch(()=>"");
//         throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
//     }
//     return res.json();
// }

async function http(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const ct = res.headers.get("content-type") || "";
  const isJSON = ct.includes("application/json");

  if (!res.ok) {
    const body = isJSON ? await res.json().catch(() => ({})) : await res.text();
    const msg = isJSON ? JSON.stringify(body) : body.slice(0, 300);
    throw new Error(`HTTP ${res.status} at ${url}: ${msg}`);
  }

  if (!isJSON) {
    const text = await res.text();
    throw new Error(
      `Expected JSON at ${url}, got content-type="${ct}". First 120 chars: ${text.slice(0, 120)}`
    );
  }

  return res.json();
}


export function listNews({limit = 20} = {}){
    const qs = new URLSearchParams({limit: String(limit)});
    return http(`/api/news?${qs.toString()}`);
}

export function generateDebate({articleId, numRounds = 1, teamSize = 3}){
    return http(`/api/debates/generate`,{
        method: "POST",
        body: JSON.stringify({articleId, numRounds, teamSize}),
    });
}