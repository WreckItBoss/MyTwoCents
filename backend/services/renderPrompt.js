const fs = require("fs");
const path = require("path");

function renderPrompt(filename, variables = {}) {
  const filePath = path.join(__dirname, filename);

  let prompt = fs.readFileSync(filePath, "utf8");

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{${key}}`, "g");
    prompt = prompt.replace(regex, value ?? "");
  }

  return prompt;
}

module.exports = {
  renderPrompt,
};