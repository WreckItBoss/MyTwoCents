// scripts/seedNews.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const News = require("../models/News");

async function main() {
  const MONGO_URL = process.env.MONGO_URL;
  if (!MONGO_URL) throw new Error("Missing MONGO_URL");

  await mongoose.connect(MONGO_URL);
  console.log("✅ Connected");

  // Change this to your file or folder:
  const dataPath = path.resolve(__dirname, "japaneseNews");


  let docs = [];
  const stat = fs.statSync(dataPath);

  if (stat.isDirectory()) {
    // load all *.json files in the folder
    const files = fs.readdirSync(dataPath).filter(f => f.endsWith(".json"));
    for (const f of files) {
      const raw = fs.readFileSync(path.join(dataPath, f), "utf8");
      const obj = JSON.parse(raw);
      if (Array.isArray(obj)) docs.push(...obj);
      else docs.push(obj);
    }
  } else {
    // single file (array or single object)
    const raw = fs.readFileSync(dataPath, "utf8");
    const obj = JSON.parse(raw);
    docs = Array.isArray(obj) ? obj : [obj];
  }

  let upserted = 0, skipped = 0;
  for (const payload of docs) {
    // normalize date if string
    if (payload.date && typeof payload.date === "string") {
      const d = new Date(payload.date);
      if (!isNaN(d)) payload.date = d;
    }

    const query = payload.ID ? { ID: payload.ID }
                 : payload.url ? { url: payload.url }
                 : null;

    if (!query) { skipped++; continue; }

    await News.findOneAndUpdate(
      query,
      { $set: payload },
      { upsert: true, setDefaultsOnInsert: true }
    );
    upserted++;
  }

  console.log(`Done. Upserted: ${upserted}, Skipped (no ID/url): ${skipped}`);
  await mongoose.disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
