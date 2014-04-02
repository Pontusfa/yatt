/**
 * Transforms a torrent file stream and persist it.
 * @author Pontus Falk
 */

var _ = require('underscore'),
    announceUrl = null,
    privateTracker = null,
    ranks = null,
    queries = null;

/**
 * Transforms a torrent file into a format suitable for persistence, search and manipulation.
 * @param user The user information of the uploader
 * @param form torrent information
 * @param data torrent's data bencoded
 * @param callback function(alert, result) handles the result of the processing
 */
function processTorrent(user, form, data, callback){
    var torrentMeta = null,
        size = null,
        alertTorrent = _verifyTorrent(form),
        alertUser = _verifyUser(user);

    if(_.isObject(alertUser)){ // uploader errors takes precedence
        callback(alertUser);
    }
    else if(_.isObject(alertTorrent)){
        callback(alertTorrent);
    }
    else{
        torrentMeta = _modifyTorrent(data);
        size = _bytesToSize(torrentMeta.info.length);

        form.torrentTags = _.isString(form.torrentTags) && !_.isEmpty(form.torrentTags) ?
            _.uniq(form.torrentTags.split(' ')) :   //dupe-free tags array
            [];

        queries.addDocument({
                title: form.torrentTitle,
                description: form.torrentText,
                tags: form.torrentTags,
                category: form.torrentCategory,
                infoLink: form.torrentInfoLink,
                uploader: user.username,
                size: size,
                meta: torrentMeta
            },
            queries.TORRENTMODEL,
            callback);
    }
}

/**
 * @private
 */
function _verifyUser(user){
    var alert = null;

    if(!_.isObject(user)){
        alert = {type: 'error', message: 'noUploader'};
    }
    else if(!_.isString(user.username)){
        alert = {type: 'error', message: 'noUploaderName'};
    }
    else if(user.rank < ranks.UPLOADER){
        alert = {type: 'error', message: 'notUploader'};
    }
    return alert;
}

/**
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
var _modifyTorrent = function(){
    var bencode = require('bencode');

    return function(data){
        var torrentMeta = bencode.decode(data, 'utf8');

        torrentMeta.info.pieces = bencode.decode(data).info.pieces; //todo: double decoding

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

        delete torrentMeta['created by']; //no silly adverts/messages
        delete torrentMeta.comment;
        delete torrentMeta['creation date'];

        return torrentMeta;
    };
}();

/**
 * Calculates correct prefix size.
 * Thanks to http://stackoverflow.com/a/18650828/1131050
 * @private
 */
function _bytesToSize(bytesString) {
    var k = 1024,
        bytes = parseInt(bytesString),
        sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB'],
        i = null,
        result = null;

    if (bytes === 0 || _.isNaN(bytes)){
        result =  '0 B';
    }
    else{
        i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)),10);
        result = (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
    }
    return result;
}

module.exports = function(siteRanks, queriesObject, trackerUrl, privTracker){
    ranks = siteRanks;
    queries = queriesObject;
    announceUrl = trackerUrl;
    privateTracker = privTracker;

    module.exports = {};
    module.exports.processTorrent = processTorrent;

    return module.exports;
};
