const router = require("express").Router();
const {generateDebateFromText, generateDebateByArticleID} = require("../services/debate.js");
// POST /api/debates/generate  { articleId, numRounds?, maxAgents? }
router.post("/generate", async(req,res) => {
    try{
        let {articleId, numRounds = 1, teamSize = 3} = req.body;
        if (!articleId) return res.status(400).json({ error: "missing_articleId" });
        const allowedRounds = [1, 3, 5];
        numRounds = Number(numRounds);
        if (!allowedRounds.includes(numRounds)) numRounds = 1;
        teamSize = Math.max(1, Math.min(Number(teamSize) || 3, 5));
        const result = await generateDebateByArticleID(articleId, {numRounds, teamSize});
        res.json(result);
    }catch(err){
        res.status(err.status || 500).json({ error: err.message || "server_error" });
    }
});

// POST /api/debates/generateFromText  { text, numRounds?, teamSize?, maxAgents?(legacy) }
router.post("/generateFromText", async (req, res) => {
  try {
    let { text, numRounds = 1, teamSize = 3 } = req.body;
    if (!text) return res.status(400).json({ error: "missing_text" });
    const allowedRounds = [1, 3, 5];
    numRounds = Number(numRounds);
    if (!allowedRounds.includes(numRounds)) numRounds = 1;
    teamSize = Math.max(1, Math.min(Number(teamSize) || 3, 5));
    const result = await generateDebateFromText(text, { numRounds, teamSize });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "server_error" });
  }
});

module.exports = router;