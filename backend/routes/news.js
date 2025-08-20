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
//getting news article 

router.get("/:id", async(req, res)=>{
    try {
        const doc = await News.findById(req.params.id).lean();
        if (!doc) return res.status(404).json({error: "not_found"});
        res.json(doc);
    } catch (error) {
        res.status(500).json({error: "server_error", message: error.message});
    }
});

module.exports = router;