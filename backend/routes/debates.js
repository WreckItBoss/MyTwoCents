const router = require("express").Router();
const { generateDebateFromText, generateDebateByArticleID } = require("../services/debate/debate.js");

// POST /api/debates/generate  { articleId, numRounds?, teamSize?, userPosition? }
router.post("/generate", async (req, res) => {
  try {
    console.log("raw body:", req.body);
    let { articleId, numRounds = 1, teamSize = 3, userPosition = "agree" } = req.body;
    
    if (!articleId) return res.status(400).json({ error: "missing_articleId" });

    const allowedRounds = [1, 3, 5];
    numRounds = Number(numRounds);
    if (!allowedRounds.includes(numRounds)) numRounds = 1;
    teamSize = Math.max(1, Math.min(Number(teamSize) || 3, 5));

    // normalize stance
    userPosition = (userPosition === "disagree") ? "disagree" : "agree";
    console.log("backend got stance:", userPosition);

    const result = await generateDebateByArticleID(articleId, { numRounds, teamSize, userPosition });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "server_error" });
  }
});


// POST /api/debates/generateFromText  { text, numRounds?, teamSize?, userPosition? }
router.post("/generateFromText", async (req, res) => {
  try {
    let { text, numRounds = 1, teamSize = 3, userPosition = "agree" } = req.body;
    if (!text) return res.status(400).json({ error: "missing_text" });

    // sanitize
    const allowedRounds = [1, 3, 5];
    numRounds = Number(numRounds);
    if (!allowedRounds.includes(numRounds)) numRounds = 1;

    teamSize = Math.max(1, Math.min(Number(teamSize) || 3, 5));
    userPosition = (userPosition === "disagree") ? "disagree" : "agree";

    const result = await generateDebateFromText(text, { numRounds, teamSize, userPosition });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "server_error" });
  }
});

router.get("/event-stream", async(req, res) => {
  let onEvent;
  try {
    let { articleId, numRounds = 1, teamSize = 1, userPosition = "agree" } = req.query;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    onEvent = (event) => {
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${JSON.stringify(event.data)}\n\n`);
    };

    await generateDebateByArticleID(articleId, { numRounds, teamSize, userPosition, onEvent});
    
    onEvent({
      type: "End",
      data: {message: "Debate generation completed"}
    });

    res.end();

  } catch (error) {
    if (onEvent) {
        onEvent({
            type: "error",
            data: {
                message: error.message || "server_error",
            },
        });
    }

    res.end();
  }
});

module.exports = router;
