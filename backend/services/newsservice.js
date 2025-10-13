const News = require('../Models/News.js');

async function getNews(id) {
    return News.findById(id).lean()
}

module.exports = {getNews};