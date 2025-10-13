const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") }); // safe even if already loaded
const fs = require("fs/promises");
const { llmChat } = require("./aiModel");

const mongoose = require('mongoose');
const { getNews } = require('./newsservice');

function preview(s, n = 160) {
  if (!s) return "(empty)";
  const str = String(s);
  return str.length <= n ? str : str.slice(0, n) + "...";
}
async function extractKeywords(text) {
    const promptPath = path.resolve(__dirname, "./prompts/keywordExtract.txt");
    const template = await fs.readFile(promptPath, "utf8");
    const promptText = template.replace(/\{News Article\}/g, text);
    console.log("\n[extractKeywords] text.len:", text.length, "preview=", preview(text));
    console.log("[extractKeywords] prompt.len:", promptText.length, "preview=", preview(promptText));

    const raw = await llmChat({
        messages: [{ role: 'user', content: promptText }],
    });
  return raw.trim().split(',').map(k => k.trim());
}

module.exports = {extractKeywords};

// (async () => {
//   try {
//     // 1️⃣ Connect to MongoDB
//     await mongoose.connect('mongodb+srv://isseymatsumoto0911:digitaldiet123@firstcluster.rrflv8n.mongodb.net/', {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });

//     // 2️⃣ Fetch one news item (replace with your real ID)
//     const news = await getNews('689b0299ae080e256d3887b4');
//     console.log(news["content"]);

//     // 3️⃣ Close connection
//     await mongoose.connection.close();
//   } catch (err) {
//     console.error(err);
//   }
// })();
