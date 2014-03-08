/**
 * Transforms a torrent file stream and persist it.
 * @author Pontus Falk
 */

var bencode = require('bencode'),
_ = require('underscore'),
    queries = null,
    maxAttempts = 128;

/**
 * Transforms a torrent file into a format suitable for persistence and manipulation.
 * @param name torrent's name
 * @param data torrent's data bencoded
 * @param callback function(err, result) handles the result of the processing
 */
function processTorrent(name, data, callback){
    var torrentMeta = bencode.decode(data);

    _processTorrentHelper(name, torrentMeta, maxAttempts, callback);
}

/**
 * hides the maximum attempts behind the curtains.
 * @private
 */
function _processTorrentHelper(name, torrentMeta, attempts, callback){
    var crypto = require('crypto'),
        torrentIdent = crypto.randomBytes(32).toString('base64').replace(/\W/g, ''),
        limit = 1;

    if(attempts > 0){
        queries.getDocument({ident: torrentIdent},
                            queries.TORRENTMODEL,
                            limit, {ident: 1},
                            _processTorrentCallback(
                                name, torrentMeta,
                                torrentIdent, attempts,
                                callback));
    }
    else{
        callback(new Error(
            'Error: Couldn\'t create an unique torrent ident. Strange.'), false);
    }
}

/**
 * @private
 */
function _processTorrentCallback(name, torrentMeta, ident, attempts, callback){
    return function(err, foundTorrent) {
        if(_.isObject(err)){
            callback(err, false);
        }
        else if(_.isNull(foundTorrent)){
            queries.addDocument(
                {name: name.replace('.torrent', ''),
                 ident: ident, meta: torrentMeta},
                queries.TORRENTMODEL, callback);
        }
        else{
            _processTorrentHelper(name, torrentMeta, --attempts, callback);
        }
    };
}

module.exports = function(queriesObject){
    queries = queriesObject;

	module.exports = {};
	module.exports.processTorrent = processTorrent;
    
    return module.exports;
};
