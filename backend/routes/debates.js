const router = require("express").Router();
const {generateDebateFromText, generateDebateByArticleID} = require("../services/debate.js");
// POST /api/debates/generate  { articleId, numRounds?, maxAgents? }
router.post("/generate", async(req,res) => {
    try{
        const {articleId, numRounds = 1, maxAgents = 3} = req.body;
        if (!articleId) return res.status(400).json({ error: "missing_articleId" });

        const result = await generateDebateByArticleID(articleId, {numRounds, maxAgents});
        res.json(result);
    }catch(err){
        res.status(err.status || 500).json({ error: err.message || "server_error" });
    }
});

//POST /api/debates/generateFromText  { text, numRounds?, maxAgents? }
router.post("/generateFromText", async (req, res) => {
  try {
    const { text, numRounds = 1, maxAgents = 3 } = req.body;
    if (!text) return res.status(400).json({ error: "missing_text" });

    const result = await generateDebateFromText(text, { numRounds, maxAgents });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "server_error" });
  }
});

module.exports = router;