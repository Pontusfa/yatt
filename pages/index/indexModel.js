var queries = require('../../lib/queries'),
    ranks = null,
    _ = require('underscore');

function _getNews(callback){
    var criteria = {},
        sort = {created: -1},
        limit = 3,
        wantedFields= {};

    queries.getDocument(
        criteria,
        queries.NEWSMODEL,
        sort,
        limit,
        wantedFields,
        callback);
}

function buildIndex(callback){
    _getNews(callback);
}

/**
 * Handles queries received from the user
 * @param requestQueries an object with queries containing type of query and relevant info
 * @param user the user who is requesting the query
 * @param callback a function to deal with the outcome of the request query
 */
function handleRequestQueries(requestQueries, user, callback){
    var alert;
    if(user.rank < ranks.MODERATOR){
        alert = {type: 'error', message: 'notAllowed'};
        callback(alert);
    }
    else if(_.isString(requestQueries.removenews)){
        queries.removeDocument({_id: requestQueries.removenews},
            queries.NEWSMODEL,
            function(err){
                if(_.isObject(err)){
                    alert = {type: 'error', message : 'errorRemoveNews'};
                }
                else{
                    alert = {type: 'success', message: 'successRemoveNews'};
                }
                callback(alert);
            }
        );
    }
    else{
        alert = {type:'error', message: 'noSuchQuery'};
        callback(alert);
    }
}

/**
 * Adding a news article to the system.
 * @param news the object containing title and text body
 * @param user the user adding the news article
 * @param callback function that handles the result of adding the article
 */
function addNews(news, user, callback){
    var alert;

    if(user.rank < ranks.MODERATOR){
        alert = {type: 'error', message: 'notAllowed'};
        callback(alert);
    }

    else if(_.isEmpty(news)){
        alert = {type: 'error', message: 'emptyNews'};
        callback(alert);
    }
    else{
        queries.addDocument(news, queries.NEWSMODEL,
            function(err, result){
                if(_.isObject(err)){
                    alert = {type: 'error', message: 'errorAddNews'};
                }
                else{
                    alert = {type: 'success', message: 'successAddNews'};
                }
                callback(alert);
            }
        );
    }
}

module.exports = function(config){
    ranks = config.site.ranks;
    module.exports.handleRequestQueries = handleRequestQueries;
    module.exports.buildIndex = buildIndex;
    module.exports.addNews = addNews;

    return module.exports;
}

