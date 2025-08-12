const router = require("express").Router();
const News = require("../models/News");

router.get("/", async(req, res)=> {
    try{
        const newsList = await News
        .find()
        .sort({date:-1})
        .limit(20)
        res.json(newsList)
    }
    catch (err) {
        res.status(500).json({ error: "server_error", message: err.message });
    }
});

module.exports = router;