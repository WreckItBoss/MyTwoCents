const { renderPrompt } = require("../renderPrompt");

function generatePersona({ name, topic, stance }) {
  return renderPrompt("personaGenerator/personaGenerator.txt", {
    name,
    topic,
    stance,
  });
}

module.exports = {
  generatePersona,
};