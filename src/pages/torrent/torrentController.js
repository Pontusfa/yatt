var links = null,
    models = null,
    template = null,
    torrentCategories = null,
    config = null,
    site = null;

function _getTorrent(req, res) {
    new Controller(req, res).
        getModel().
        executeModel();
}

function Controller(req, res) {
    this._req = req;
    this._res = res;
    this._model = null;
    this._callbacks = {
        getTorrentCallback: this._getTorrentCallback.bind(this),
        removeTorrentCallback: this._removeTorrentCallback.bind(this),
        errorCallback: this._errorCallback.bind(this)
    };

    return this;
}

Controller.prototype.getModel = function () {
    var req = this._req;
    
    if(req.query.remove === 1 || req.query.remove === '1') { //TODO: one of 'em
        this._model = new models.removeModel(req.query.id, req.session.user.rank);
    }
    else {
        this._model = new models.TorrentModel(req.query.id, req.session.user.rank);
    }
    this._model.registerCallbacks(this._callbacks);

    return this;
};

Controller.prototype.executeModel = function () {
    this._model.execute();

    return this;
};

Controller.prototype._getTorrentCallback = function (result) {
    var locals = this._res.locals;

    locals.torrent = result.torrent;
    locals.site = site;
    locals.lang.title = locals.torrent.title;
    locals.canRemove = result.canRemove;
    
    this._res.send(template(locals));
};

Controller.prototype._removeTorrentCallback = function(alert) {
    this._req.session.alert = alert;
    this._res.redirect(links.index);
};

Controller.prototype._errorCallback = function (alert) {
    this._req.session.alert = alert;
    this._res.redirect(site.links.index);
};

function setup(app, jadeCompiler) {
    config = app.config;
    site = config.site;
    links = config.site.links;
    models = require('./torrentModel')(app.queries, app.config.site.ranks);
    template = jadeCompiler('torrent');
    torrentCategories = require('../../lib/internationalization')
        .getAdditionalLanguageField('torrentCategories');

    app.get(links.torrent, _getTorrent);

    return config.site.private ?
        site.ranks.MEMBER :
        site.ranks.PUBLIC;
}

module.exports.setup = setup;

