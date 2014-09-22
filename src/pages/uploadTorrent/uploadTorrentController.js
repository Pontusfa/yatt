/**
 * Handles a user uploading a torrent file.
 */

var Model = null,
    site = null,
    ranks = null,
    links = null,
    logger = null,
    template = null,
    categories = null,
    _ = require('underscore');

/**
 * @private
 */
function _getUploadTorrent(req, res) {
    var locals = res.locals;

    locals.site = site;
    locals.lang.categories = categories[req.session.language];

    res.send(template(locals));
}

/**
 * @private
 */
function _postUploadTorrent(req, res) {
    new Controller(req, res).
        sanitizeForm().
        getModel().
        executeModel();
}

function Controller(req, res) {
    this._req = req;
    this._res = res;
    this._user = req.session.user;

    this._callbacks = {
        successCallback: this._successCallback.bind(this),
        errorCallback: this._errorCallback.bind(this)
    };

    return this;
}

Controller.prototype.sanitizeForm = (function() {
    var formWhiteList = ['torrentTitle', 'torrentText', 'torrentTags',
        'torrentInfoLink', 'torrentCategory', 'vow'];
    return function() {
        this._form = _.pick(this._req.body, formWhiteList);
        this._data = this._req.file.data;

        return this;
    };
}());

Controller.prototype.getModel = function() {
    this._model = new Model(this._user, this._form, this._data).
        registerCallbacks(this._callbacks);

    return this;
};

Controller.prototype.executeModel = function() {
    this._model.execute();
    return this;
};

/**
 * @private
 */
Controller.prototype._successCallback = function(alert, result) {
    var redirect = null;

    if(_.isObject(alert)) {
        alert = {type: 'error', message: 'uploadFail'};
        redirect = links.uploadTorrent;
    }
    else {
        alert = {type: 'success', message: 'uploadSuccess'};
        redirect = links.torrent + '?id=' + result._id;
    }
    this._req.session.alert = alert;
    this._res.redirect(redirect);
};

Controller.prototype._errorCallback = function(alert) {
    this._req.session.alert = alert;
    this._res.redirect(links.uploadTorrent);
};

/**
 * Routes the uploadTorrent path.
 * @param app the app to install routes to.
 * @param jadeCompiler a function compiling jade templates
 */
function setup(app, jadeCompiler) {
    Model = require('./uploadTorrentModel')(app.config, app.queries);

    template = jadeCompiler('uploadTorrent');
    site = app.config.site;
    ranks = site.ranks;
    links = site.links;
    logger = app.logger;
    categories = require('../../lib/internationalization')
        .getAdditionalLanguageField('torrentCategories');

    app.get(links.uploadtorrent, _getUploadTorrent);
    app.post(links.uploadtorrent, _postUploadTorrent);

    return app.config.site.ranks.UPLOADER;
}

module.exports.setup = setup;
