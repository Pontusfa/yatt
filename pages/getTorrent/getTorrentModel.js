/**
 * Serves up a torrent metainfo file.
 * @author Pontus Falk
 */

var queries = null,
    _ = require('underscore');
/**
 * Produces a bencoded metafile buffer for the id torrent.
 * @param req the whole request object, containing at least req._id and req.passkey
 * @param callback function(err, bencode) handles the produced bencoded torrent metafile buffer
 */
var getTorrent = function(){
    var wantedFields = {'title': 1, 'meta': 1},
        sort = null,
        offset = 0,
        limit = 1;

    return function(req, callback){
        var criteria = {_id: req.id};

        queries.getDocuments(criteria, queries.TORRENTMODEL,
            sort, offset, limit, wantedFields,
            _getTorrentCallback(req.passkey, callback));
    };
}();

/**
 * @private
 */
var _getTorrentCallback = function(){
    var bencode = require('bencode');

    return function(passkey, callback){
        return function(err, torrent){
            var alert = null,
                result = null;

            if(!_.isObject(err) && _.isObject(torrent)){
                torrent = _formatTorrent(torrent, passkey);
                result = {title: torrent.info.name,
                    bencode: bencode.encode(torrent)};
            }
            else{
                alert = {type: 'error', message: 'noTorrent'};
            }
            callback(alert, result);
        };
    };
}();

/**
 * @private
 */
function _formatTorrent(torrent, passkey){
    torrent = torrent.meta;
    torrent.info.pieces = torrent.info.pieces.buffer;
    if(_.isString(passkey && !_.isEmpty(passkey))){
        torrent.announce = torrent.announce + '?passkey=' + passkey;
    }
    return torrent;
}

module.exports = function(queriesObject){
    queries = queriesObject;
    return getTorrent;
};
