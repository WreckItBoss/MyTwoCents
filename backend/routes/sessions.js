const router = require("express").Router();
const mongoose = require("mongoose");
const DebateSession = require("../Models/DebateSession.js");

// GET /api/sessions/:id — get one session
router.get("/:id", async(req, res) =>{
    try {
        const {id} = req.params;
        if(!mongoose.isValidObjectId(id)){
            return res.status(400).json({error: "invalid_id"});
        }
        const doc = await DebateSession.findById(id).lean();
        if(!doc) return res.status(404).json({error: "not_found"});
        res.json(doc);
    } catch (error) {
        res.status(500).json({error: "server_error", message: err.message});
    }
});

// GET /api/sessions?articleId=... — list sessions for an article (newest first)

router.get("/", async(req,res)=>{
    try {
        const{articleId, limit = 20} = req.query;
        const q = {};
        if(articleId){
            if(!mongoose.isValidObjectId(articleId)){
                return res.status(400).json({error: "invalid_id"});
            }
            q.articleId = articleId;
        }
        const list = await DebateSession.find(q)
        .sort({createdAt: -1})
        .limit(Math.min(Number(limit) || 20, 100))
        .lean();
        res.json(list);
    } catch (error) {
        res.status(500).json({error: "server_error", message:err.message});
    }
})

module.exports = router;