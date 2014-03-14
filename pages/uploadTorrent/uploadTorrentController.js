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
    uploadTorrentModel.processTorrent(req.body, req.file.data, _postUploadTorrentCallback(req, res));
}

/**
 * @private
 */
function _postUploadTorrentCallback(req, res){
    var redirect = null;

    return function(alert, result){

        if(_.isObject(alert)){
            redirect = 'uploadtorrent';
        }
        else{
            alert = {type: 'success', message: 'uploadSuccess'};
            redirect = 'torrent?id=' + result._id;
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
    uploadTorrentModel = require('./uploadTorrentModel')
        (app.queries, app.config.site.trackerUrl, app.config.site.private);
    template = jadeCompiler('uploadTorrent');

    site = {name: app.config.site.name,
        trackerUrl: app.config.site.trackerUrl,
        categories: app.config.site.categories,
        privateTracker: app.config.site.private};

    logger = app.logger;
    app.get('/uploadtorrent', _getUploadTorrent);
    app.post('/uploadtorrent', _postUploadTorrent);
    return app.config.site.ranks.UPLOADER;
}

module.exports.setup = setup;
