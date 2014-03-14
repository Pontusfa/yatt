/**
 * Transforms a torrent file stream and persist it.
 * @author Pontus Falk
 */

var bencode = require('bencode'),
    queries = null;

/**
 * Transforms a torrent file into a format suitable for persistence and manipulation.
 * @param name torrent's name
 * @param data torrent's data bencoded
 * @param callback function(err, result) handles the result of the processing
 */
function processTorrent(name, data, callback){
    var torrentMeta = bencode.decode(data);

     queries.addDocument(
                {name: name.replace('.torrent', ''), meta: torrentMeta},
                queries.TORRENTMODEL, callback);
}

module.exports = function(queriesObject){
    queries = queriesObject;
    
    module.exports = {};
    module.exports.processTorrent = processTorrent;
    
    return module.exports;
};
