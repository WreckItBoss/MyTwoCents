const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const NewsSchema = new Schema({
    topic: {type: String, required: true},
    source: {type: String, required: true},
    bias: { type: Number },
    url: { type: String, unique: true, sparse: true },
    title: { type: String },
    date: { type: Date },
    authors: { type: String },
    content: { type: String },
    content_original: { type: String },
    source_url: { type: String },
    bias_text: { type: String }, 
    ID: { type: String, unique: true },

});

module.exports = mongoose.model('News', NewsSchema);