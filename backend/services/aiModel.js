// //Currently Using GEMMA 3
// const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
// const MODEL = process.env.LLM_MODEL || "gemma:7b";

// async function llmChat({system, messages, temperature = 0.7}) {
//     const res = await fetch(`${OLLAMA_URL}/api/chat`,{
//         method: 'POST',
//         headers: {'Content-Type': 'application/json'},
//         body:JSON.stringify({
//             model:MODEL,
//             messages:[
//                 ...(system?[{role:'system', content: system}]:[]),
//                 ...messages
//             ],
//             options:{temperature},
//             stream: false  
//         })
//     });
//     console.log("Resolved Ollama URL:", `${process.env.OLLAMA_URL}/api/chat`);
//     console.log(res)
//     if (!res.ok) throw new Error(`LLM error ${res.status}`)
//     const data = await res.json();
//     return data?.message?.content?.trim() || "";
    
// }

// module.exports = {llmChat};
// aiModel.js
function preview(s, n = 200) {
  if (!s) return "(empty)";
  const str = String(s);
  return str.length <= n ? str : str.slice(0, n) + "...";
}

function buildOllamaUrl(pathname = "/api/chat") {
  let base = process.env.OLLAMA_URL || "http://localhost:11434";
  base = base.replace(/\/+$/, "");
  if (base.endsWith("/api")) base = base.slice(0, -4);
  return `${base}${pathname}`;
}

async function llmChat({ system, messages = [], temperature = 0.7 } = {}) {
  // normalize messages
  const msgs = Array.isArray(messages) ? messages : messages ? [messages] : [];

  // 🔎 LOG what we are about to send
  console.log("\n[llmChat] MODEL:", process.env.LLM_MODEL);
  console.log("[llmChat] system.len:", system ? system.length : 0);
  console.log("[llmChat] messages.count:", msgs.length);
  msgs.forEach((m, i) =>
    console.log(`[llmChat] msg[${i}] role=${m.role} len=${(m.content||"").length} preview=`, preview(m.content, 120))
  );

  if (msgs.length === 0) {
    throw new Error("llmChat: messages array is empty");
  }

  const url = buildOllamaUrl("/api/chat");
  const body = {
    model: process.env.LLM_MODEL || "gemma3:12b",
    messages: [
      ...(system ? [{ role: "system", content: system }] : []),
      ...msgs
    ],
    options: { temperature },
    stream: false,
  };

  // 🔎 LOG the final resolved URL
  console.log("[llmChat] URL:", url);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // 🔎 LOG status + body on errors
  if (!res.ok) {
    const text = await res.text();
    console.error("[llmChat] ERROR", res.status, res.statusText);
    console.error("[llmChat] response body:", preview(text, 500));
    throw new Error(`LLM error ${res.status}`);
  }

  const data = await res.json();

  // 🔎 LOG what we got back
  const out = data?.message?.content?.trim() || "";
  console.log("[llmChat] reply.len:", out.length, "preview=", preview(out, 200), "\n");

  return out;
}

module.exports = { llmChat };
