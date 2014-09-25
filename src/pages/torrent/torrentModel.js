var queries = null,
    ranks = null,
    models = {},
    _ = require('underscore');

function TorrentModel(id, userRank) {
    this._id = id;
    this._userRank = userRank;

    return this;
}

TorrentModel.prototype.registerCallbacks = function (callbacks) {
    this._callbacks = callbacks;

    return this;
};

TorrentModel.prototype.execute = function () {
    var criterium = {_id: this._id},
        wantedFields = null,
        sortBy = null,
        offset = null,
        limit = 1;

    this._canRemove = this._userRank >= ranks.MODERATOR;
    
    queries.getDocuments(
        criterium,
        queries.TORRENTMODEL,
        sortBy,
        offset,
        limit,
        wantedFields,
        this._getTorrentCallback.bind(this));

    return this;
};

TorrentModel.prototype._getTorrentCallback = function (err, torrent) {
    var result = {},
        alert = null;

    if (_.isObject(err) || _.isEmpty(torrent)) {
        alert = {type: 'error', message: 'noTorrent'};
        this._callbacks.errorCallback(alert);
    }
    else {
        torrent.created = new Date(torrent.created).toLocaleDateString();
        result.torrent = torrent;
        result.canRemove = this._canRemove;
        
        this._callbacks.getTorrentCallback(result);
    }
};

function RemoveModel(id, userRank) {
    this._id = id;
    this._userRank = userRank;

    return this;
}

RemoveModel.prototype.registerCallbacks = function (callbacks) {
    this._callbacks = callbacks;

    return this;
};

RemoveModel.prototype.execute = function() {
    if(this._userRank >= ranks.MODERATOR) {
        queries.removeDocument({_id: this._id}, queries.TORRENTMODEL, this._removeTorrentCallback.bind(this));
    }
    else {
        this._callbacks.errorCallback({type: 'error', message: 'notAllowed'});
    }
};

RemoveModel.prototype._removeTorrentCallback = function(error, torrent) {
    if(_.isObject(error) || torrent === null || torrent === {}) {
        this._callbacks.errorCallback({type: 'error', message: 'noTorrent'});
    }
    else {
        this._callbacks.removeTorrentCallback({type: 'success', message: 'successRemoveTorrent'});
    }
};

module.exports = function (queriesObj, userRank) {
    queries = queriesObj;
    ranks = userRank;
    
    models.TorrentModel = TorrentModel;
    models.removeModel = RemoveModel;
    module.exports = models;

    return module.exports;
};
