/**
 * Serves up a torrent metainfo file.
 * @author Pontus Falk
 */

var queries = null,
    _ = require('underscore'),
    bencode = require('bencode'),
    wantedFields = {'title': 1, 'meta': 1};

/**
 * @private
 */
function _getTorrentCallback(passkey, callback){
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
}

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

/**
 * Produces a bencoded metafile buffer for the id torrent.
 * @param req the whole request object, containing at least req._id and req.passkey
 * @param callback function(err, bencode) handles the produced bencoded torrent metafile buffer
 */
function getTorrent(req, callback){
    var sort = {},
        limit = 1;

    queries.getDocument({_id: req.id}, queries.TORRENTMODEL,
        sort, limit, wantedFields,
        _getTorrentCallback(req.passkey, callback));
}

module.exports = function(queriesObject){
    queries = queriesObject;
    return getTorrent;
};
