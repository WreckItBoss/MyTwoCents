const fs = require("fs");
const path = require("path");

const promptCache = {};

function renderPrompt(filename, variables = {}) {
    if (!promptCache[filename]) {
        promptCache[filename] = fs.readFileSync(
            path.join(__dirname, "prompts", filename),
            "utf8"
        );
    }

    let prompt = promptCache[filename];

    for (const [key, value] of Object.entries(variables)) {
        prompt = prompt.replace(
            new RegExp(`{{${key}}}`, "g"),
            value ?? ""
        );
    }

    return prompt;
}