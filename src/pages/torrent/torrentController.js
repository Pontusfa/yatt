var links = null,
    Model = null,
    template = null,
    torrentCategories = null,
    config = null,
    site = null;

function _getTorrent(req, res) {
    new Controller(req, res).
        _getModel().
        _executeModel();
}

function Controller(req, res) {
    this._req = req;
    this._res = res;
    this._model = null;
    this._callbacks = {
        getTorrentCallback: this._getTorrentCallback.bind(this),
        errorCallback: this._errorCallback.bind(this)
    };

    return this;
}

Controller.prototype._getModel = function() {
    this._model = new Model(this._req.query.id).
        registerCallbacks(this._callbacks);

    return this;
};

Controller.prototype._executeModel = function() {
    this._model.execute();

    return this;
};

Controller.prototype._getTorrentCallback = function(torrent) {
    var locals = this._res.locals;

    locals.torrent = torrent;

    locals.lang.category =
        torrentCategories[this._req.session.language][torrent.category];

    locals.site = site;
    this._res.send(template(locals));
};

Controller.prototype._errorCallback = function(alert) {
    this._req.session.alert = alert;
    this._res.redirect(site.links.index);
};

function setup(app, jadeCompiler) {
    config = app.config;
    site = config.site;
    links = config.site.links;
    Model = require('./torrentModel')(app.queries);
    template = jadeCompiler('torrent');
    torrentCategories = require('../../lib/internationalization')
        .getAdditionalLanguageField('torrentCategories');

    app.get(links.torrent, _getTorrent);

    return config.site.private ?
        site.ranks.MEMBER:
        site.ranks.PUBLIC;
}

module.exports.setup = setup;

