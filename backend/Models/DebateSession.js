const mongoose = require("mongoose");
const {Schema} = mongoose;

const AgentSchema = new Schema({
  name: String,
  basis: String,
  stance: {
    type: String,
    enum: ["support", "oppose"],
    required: true,
  },
}, { _id: false });

const MessageSchema = new Schema({
  speaker: String,
  text: String,
  round: Number,
  agentIndex: Number,
  stance: {
    type: String,
    enum: ["support", "oppose"],
  },
  ts: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const ParamsSchema = new Schema({
    model: String,
    temperature: Number,
    maxAgents: Number,
    numRounds: Number
},{_id: false})

const DebateSessionSchema = new Schema({
    articleId: {type: Schema.Types.ObjectId, ref: "News", index: true, required: true},
    topics: [String],
    agents: [AgentSchema],
    messages: [MessageSchema],
    params: ParamsSchema,
    sessionLabel: String, //just a label that is human-friendly
},{timestamps: true});

module.exports = mongoose.models.DebateSession
  ? mongoose.models.DebateSession
  : mongoose.model("DebateSession", DebateSessionSchema);