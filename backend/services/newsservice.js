const News = require('../models/News.js');

async function getNews(id) {
    return News.findById(id).lean()
}

modules.export = {getNews};