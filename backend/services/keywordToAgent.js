const path = require("path");
const fs = require("fs/promises");
const {llmChat} = require("./aiModel.js");

async function keywordToAgents(articleText, keyword) {
    const promptPath = path.resolve(__dirname, "./prompts/keywordToAgent.txt");
    const template = await fs.readFile(promptPath, "utf8");
    const prompt = template
        .replace("{News Article}", articleText.slice(0,1200))
        .replace("{Keyword}", keyword);
    const raw = await llmChat({messages: [{role: "user", content: prompt}]});

    const first = (raw || "").split("\n")[0] || "";
    return first.trim().replace(/^[\-\s>]+/, "").replace(/[.,;:]+$/g, "");
}

async function generalizeTopics(articleText, keywords = []) {
    const results = [];
    for (const k of keywords){
        try {
            const domain = await keywordToAgents(articleText, k);
            console.log("[generalizeTopics] map:", k, "→", domain); // this line is to see if it maps the keyword to the domain
            results.push(domain);
        } catch (error) {
            console.error("[generalizedTopics] fallback for:", k, error.message);
            results.push(k);
        }
    }
    return results;
}

module.exports = { generalizeTopics };