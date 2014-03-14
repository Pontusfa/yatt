/**
 * Handles a user uploading a torrent file.
 * @author Pontus Falk
 */

var uploadTorrentModel = null,
    site = null,
    logger = null,
    template = null,
    _ = require('underscore');

/**
 * @private
 */
function _getUploadTorrent(req, res) {
    res.locals.site = site;
    res.send(template(res.locals));
}

/**
 * @private
 */
function _postUploadTorrent(req, res){
    uploadTorrentModel.processTorrent(req.file.name, req.file.data,
                                      _postUploadTorrentCallback(req, res));
}

/**
 * @private
 */
function _postUploadTorrentCallback(req, res){
    var alert = null,
        redirect = null;
    
    return function(err, result){
        if(_.isObject(err)){
            logger.error('Failed uploading torrent: ' + err.message);
            alert = {type: 'error', message: 'uploadFail'};
            redirect = 'uploadtorrent';
        }
        else{
            alert = {type: 'success', message: 'uploadSuccess'};
            redirect = 'index'; //TODO: redirect to torrent page
        }
        req.session.alert = alert;
        res.redirect(redirect);
    };
}

/**
 * Routes the uploadTorrent path.
 * @param app the app to install routes to.
 * @param jadeCompiler a function compiling jade templates
 */
function setup(app, jadeCompiler){
    uploadTorrentModel = require('./uploadTorrentModel')(app.queries);
    template = jadeCompiler('uploadTorrent');
    site = {name: app.config.site.name};
    logger = app.logger;
    app.get('/uploadtorrent', _getUploadTorrent);
    app.post('/uploadtorrent', _postUploadTorrent);
    return app.config.site.ranks.UPLOADER;
}

module.exports.setup = setup;
