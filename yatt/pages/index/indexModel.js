var queries = require('../../lib/queries');

function _getNews(callback){
    var criteria = {},
        limit = 3,
        wantedFields= {};

    queries.getDocument(
        criteria,
        queries.NEWSMODEL,
        limit,
        wantedFields,
        callback);
}

function buildIndex(callback){
    _getNews(callback);
}

module.exports.buildIndex = buildIndex;
