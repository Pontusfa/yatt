/**
 * Controls the behavior of the /index controllers.
 */

var template = null,
    site = null,
    ranks = null,
    models = null,
    indexLink = null,
    _ = require('underscore');

function _index(req, res) {
    new Controller(req, res).
        sanitizeQuery().
        getModel().
        executeModel();
}

function Controller(req, res) {
    this._req = req;
    this._res = res;
    this._callbacks = {
        successBuildCallback: this._successBuildCallback.bind(this),
        redirectCallback: this._redirectCallback.bind(this)
    };
    this._user = req.session.user;

    return this;
}

Controller.prototype.sanitizeQuery = function () {
    var req = this._req;
    this._query = !_.isEmpty(req.query) ? req.query.removenews : null;
    this._body = !_.isEmpty(req.body) ?
    {
        title: req.body.title,
        text: req.body.text
    } : null;


    return this;
};

Controller.prototype.getModel = function () {
    var model,
        user = this._user;

    if (!_.isEmpty(this._query)) { //TODO: make sure query actually is removeNews :)
        model = new models.RemoveNews(user.rank, this._query);
    }
    else if (!_.isEmpty(this._body)) {
        model = new models.AddNews(user, this._body);
    }
    else {
        model = new models.Build(user.rank);
    }

    model.registerCallbacks(this._callbacks);
    this._model = model;

    return this;
};

Controller.prototype.executeModel = function () {
    this._model.execute();

    return this;
};

Controller.prototype._successBuildCallback = function (result) {
    var res = this._res;

    res.locals.canRemove = result.canRemove;
    res.locals.canAdd = result.canAdd;
    res.locals.index = result.index;
    res.locals.site = site;

    res.send(template(res.locals));
};

Controller.prototype._redirectCallback = function (alert) {
    this._req.session.alert = alert;
    this._res.redirect(indexLink);
};


/**
 * Handles routing for /index
 * @param app the app to install routing to
 * @param jadeCompiler a compiler from jade to html
 * @returns {boolean} successful routing
 */
function setup(app, jadeCompiler) {
    template = jadeCompiler('index');
    site = app.config.site;
    indexLink = site.links.index;
    ranks = site.ranks;
    models = require('./indexModel')(app.config);

    app.get(indexLink, _index);
    app.post(indexLink, _index);

    return site.private ?
        ranks.MEMBER :
        ranks.PUBLIC;
}

module.exports.setup = setup;

