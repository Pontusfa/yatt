/**
 * Serves up a torrent metainfo file.
 * @author Pontus Falk
 */

var queries = null,
    _ = require('underscore'),
    bencode = require('bencode'),
    wantedFields = {'name': 1, 'meta.announce': 1, 'meta.info': 1};

/**
 * Produces a bencoded metafile buffer for the id torrent.
 * @param req the whole request object, containing at least req.id and req.passkey
 * @param callback function(err, bencode) handles the produced bencoded torrent metafile buffer
 */
function getTorrent(req, callback){
    queries.getDocument({ident: req.id}, queries.TORRENTMODEL, wantedFields,
        _getTorrentCallback(req.passkey, callback));
}

/**
 * @private
 */
function _getTorrentCallback(passkey, callback){
    return function(err, foundTorrent){
        if(_.isNull(err) && _.isObject(foundTorrent)){
            var formattedTorrent = _formatTorrent(foundTorrent, passkey);
            callback(null, {name: foundTorrent.name + '.torrent', bencode: bencode.encode(formattedTorrent)});
        }
        else{
            callback(err || new Error('Error: no such torrent.'), null);
        }
    };
}

/**
 * @private
 */
function _formatTorrent(foundTorrent, passkey){
    var newTorrent = {};

    newTorrent.info = {};
    newTorrent.announce = foundTorrent.meta.announce.buffer;
    newTorrent.info.pieces = foundTorrent.meta.info.pieces.buffer;
    newTorrent.info['piece length'] = foundTorrent.meta.info['piece length'];
    newTorrent.info.name = foundTorrent.meta.info.name.buffer;
    newTorrent.info.length = foundTorrent.meta.info.length;
    if(_.isString(passkey)){
        newTorrent.announce = newTorrent.announce + '?passkey=' + passkey;
    }
    return newTorrent;
}

module.exports = function(queriesObject){
    queries = queriesObject;
    return getTorrent;
};