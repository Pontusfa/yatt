var queries = null,
_ = require('underscore');

function Model(id) {
    this._id = id;

    return this;
}

Model.prototype.registerCallbacks = function(callbacks) {
    this._callbacks = callbacks;

    return this;
};

Model.prototype.execute = function() {
    var criterium = {_id: this._id},
    wantedFields = null,
    sortBy = null,
    offset = null,
    limit = 1;

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

Model.prototype._getTorrentCallback = function(err, result) {
    var alert = null;

    if(_.isObject(err) || _.isEmpty(result)){
        alert = {type: 'error', message: 'noTorrent'};
        this._callbacks.errorCallback(alert);
    }
    else{
        this._callbacks.getTorrentCallback(result);
    }

    return this;
};

module.exports = function(queriesObj) {
    queries = queriesObj;
    module.exports = Model;

    return module.exports;
};
