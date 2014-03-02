/**
 * Handles a user uploading a torrent file.
 * @author Pontus Falk
 */

var uploadTorrentModel = null;

/**
 * @private
 */
function _getUploadTorrent(req, res) {
    res.send('här var du ja');
}

/**
 * @private
 */
function _postUploadTorrent(req, res){
    uploadTorrentModel.processTorrent(req.file.name, req.file.data, _postUploadTorrentCallback(res));
}

/**
 * @private
 */
function _postUploadTorrentCallback(res){
    return function(err, result){
        res.end(result.toString());
    };
}

/**
 * Routes the uploadTorrent path.
 * @param app the app to install routes to.
 * @returns {boolean}
 */
function setup(app){
    uploadTorrentModel = require('./uploadTorrentModel')(app.queries);
    app.get('/uploadtorrent', _getUploadTorrent);
    app.post('/uploadtorrent', _postUploadTorrent);
    return true;
}

module.exports.setup = setup;