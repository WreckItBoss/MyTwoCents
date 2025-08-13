//Currently Using GEMMA 3
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const MODEL = process.env.LLM_MODEL || "gemma:7b";

async function llmChat({system, messages, temperature = 0.7}) {
    const res = await fetch(`${OLLAMA_URL}/api/chat`,{
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body:JSON.stringify({
            model:MODEL,
            messages:[
                ...(system?[{role:'system', content: system}]:[]),
                ...messages
            ],
            options: temperature
        })
    });
    if (!res.ok) throw new Error(`LLM error ${res.status}`)
    const data = await res.json();
    return data?.message?.content?.trim() || "";
    
}

module.exports = {llmChat};