/**
 * Transforms a torrent file stream and persist it.
 * @author Pontus Falk
 */

var bencode = require('bencode'),
    _ = require('underscore'),
    announceUrl = null,
    privateTracker = null,
    queries = null;

/**
 *
 * @private
 */
function _verifyTorrent(form){
    var alert = null;

    if(_.isEmpty(form.torrentTitle)){
        alert = {type: 'error', message: 'noTitle'};
    }
    else if(_.isEmpty(form.torrentText)){
        alert = {type: 'error', message: 'noText'};
    }
    else if(_.isEmpty(form.torrentCategory)){
        alert = {type: 'error', message: 'noCategory'};
    }
    else if(!_.isEqual(form.vow, 'on')){
        alert = {type: 'error', message: 'noVow'};
    }
    return alert;
}


/**
 * @private
 */
function _modifyTorrent(torrentMeta){
    if(privateTracker){
        torrentMeta.announce = announceUrl;
        torrentMeta.info.private = 1;
        delete torrentMeta['announce-list'];
    }
    else{
        torrentMeta.announce = torrentMeta.announce ?
            torrentMeta.announce :
            announceUrl;
        torrentMeta.info.private = 0;
    }

    delete torrentMeta['created by'];
    delete torrentMeta.comment;
    delete torrentMeta['creation date'];
}

/**
 * Transforms a torrent file into a format suitable for persistence, search and manipulation.
 * @param form torrent information
 * @param data torrent's data bencoded
 * @param callback function(alert, result) handles the result of the processing
 */
function processTorrent(form, data, callback){
    var torrentMeta = bencode.decode(data, 'utf8'),
        alert = _verifyTorrent(form);

    torrentMeta.info.pieces = bencode.decode(data).info.pieces; //todo: double decoding

    if(_.isObject(alert)){
        callback(alert);
    }
    else{
        _modifyTorrent(torrentMeta);

        form.torrentTags = form.torrentTags ?
            form.torrentTags.split(' ') :
            [];

        queries.addDocument({
                title: form.torrentTitle,
                description: form.torrentText,
                tags: form.torrentTags,
                category: form.torrentCategory,
                infoLink: form.torrentInfoLink,
                meta: torrentMeta
            },
            queries.TORRENTMODEL,
            callback);
    }
}


module.exports = function(queriesObject, trackerUrl, privTracker){
    queries = queriesObject;
    announceUrl = trackerUrl;
    privateTracker = privTracker;

    module.exports = {};
    module.exports.processTorrent = processTorrent;

    return module.exports;
};
