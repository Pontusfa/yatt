var queries = require('../../lib/queries'),
ranks = null,
_ = require('underscore');

function Super(){
    this._notAllowedAlert = {type: 'error', message: 'notAllowed'};
    this._emptyAlert = {type: 'error', message: 'emptyAction'};
    
    return this;
}

Super.prototype.registerCallbacks = function(callbacks){
    this._callbacks = callbacks;
};

Super.prototype._redirectCallback = function(err){
    var alert = null;

    if(_.isEmpty(err)){
        alert = this._successAlert;
    }
    else{
        alert = this._failAlert;
    }

    this._callbacks.redirectCallback(alert);
};

Super.prototype._validateRequest = function(minRank){
    if(this._rank < minRank){
        this._callbacks.redirectCallback(this._notAllowedAlert);
        return false;
    }
    else if(_.isEmpty(this._action)){
        this._callbacks.redirectCallback(this._emptyAlert);
        return false;
    }
    else{
        return true;
    }
};

function RemoveNews(rank, query){
    this._rank = rank;
    this._action = query;
    this._successAlert = {type: 'success', message: 'successRemoveNews'};
    this._failAlert = {type: 'error', message : 'errorRemoveNews'};
    //TODO: prototype dat shyt?
}

RemoveNews.prototype = new Super();

RemoveNews.prototype.execute = function(){
    if(this._validateRequest(ranks.MODERATOR)){
        queries.removeDocument(
            {_id: this._action},
            queries.NEWSMODEL,
            this._redirectCallback.bind(this)
        );
    }
};

function Build(rank){
    this._rank = rank;
}

Build.prototype = new Super();

Build.prototype.execute = function(){
    var criteria = {},
    sort = {created: -1},
    offset = 0,
    limit = 3,
    wantedFields = {};
    
    queries.getDocuments(
        criteria,
        queries.NEWSMODEL,
        sort,
        offset,
        limit,
        wantedFields,
        this._buildCallback.bind(this));
};

Build.prototype._buildCallback = function(err, news){
    var result = {};
    
    if(_.isObject(err)){
        this._redirectCallback(err);
    }
    else{
        _.forEach(news, function(newsItem){
            newsItem.created = new Date(newsItem.created).toLocaleDateString();
        });
        
        result.index = news;
        result.canAdd = this._rank >= ranks.MODERATOR ? true : false;
        result.canRemove = result.canAdd;
        
        this._callbacks.successBuildCallback(result);
    }
};

function AddNews(user, news){
    this._user = user;
    this._action = news;
    this._successAlert = {type: 'success', message: 'successAddNews'};
    this._failAlert = {type: 'error', message : 'errorAddNews'};
}

AddNews.prototype = new Super();

AddNews.prototype.execute = function(){
    if(this._validateRequest(ranks.MODERATOR)){
        queries.addDocument(this._action,
                            queries.NEWSMODEL,
                            this._redirectCallback.bind(this));
    }
};

module.exports = function(config){
    ranks = config.site.ranks;
    module.exports = {
        Build: Build,
        RemoveNews: RemoveNews,
        AddNews: AddNews
    };
    
    return module.exports;
};

