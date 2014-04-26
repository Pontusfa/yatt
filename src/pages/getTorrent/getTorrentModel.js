/**
 * Serves up a torrent metainfo file.
 */

var queries = null,
modifyUser = null,
_ = require('underscore');

var GetTorrentModel = function(id, user){
    this._id = id;
    this._user = user || null;
};

GetTorrentModel.prototype.registerCallbacks = function(callbacks){
    this._callbacks = callbacks;
    return this;
};

GetTorrentModel.prototype.getTorrent = (function(){
    var wantedFields = {title: 1, meta: 1},
    sort = null,
    offset = 0,
    limit = 1;
    
    return function(){
        var criteria = {_id: this._id};
        
        queries.getDocuments(criteria, queries.TORRENTMODEL,
                             sort, offset, limit, wantedFields,
                             this._getTorrentCallback.bind(this));
    };
}());

GetTorrentModel.prototype._getTorrentCallback = (function(){
    var bencode = require('bencode');

    return function(err, torrent){
                
        if(_.isObject(err)){
            this._callbacks.errorCallback({type:'error', message: 'databaseFail'});
        }
        else{ //TODO: move re-encoding to uploadTorrent?
            torrent = this._formatTorrent(torrent);
            
            var crypto = require('crypto'),
            sha1 = crypto.createHash('sha1');
            apa = bencode.encode(torrent.info);
            apa = sha1.update(apa);
            apa = apa.digest('decimal');
            console.log(encodeURIComponent(apa));

        
            this._callbacks.successCallback({
                title: torrent.info.name,
                bencode: bencode.encode(torrent)});
        }
    };
}());

/**
 * @private
 */
GetTorrentModel.prototype._formatTorrent = function(torrent){
    var passkey = this._user.passkey;
    
    torrent = torrent.meta;
    torrent.info.pieces = torrent.info.pieces.buffer;
    if(_.isString(passkey && !_.isEmpty(passkey))){
        torrent.announce = torrent.announce + '?passkey=' + passkey;
    }
    return torrent;
};

module.exports = function(queriesObject, modifyUserObject){
    modifyUser = modifyUserObject;
    queries = queriesObject;
    module.exports = GetTorrentModel;
    return module.exports;
};
