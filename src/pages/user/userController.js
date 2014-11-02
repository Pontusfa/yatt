var models = null,
    links = null,
    site = null,
    template = null,
    ranksID = null,
    _ = require('underscore'),
    ranksLanguage = null;

function _user(req, res) {
    new Controller(req, res).
        getModel().
        executeModel();
}

function Controller(req, res) {
    this._req = req;
    this._res = res;

    this._getCallbacks = {
        successCallback: this._successCallback.bind(this),
        errorCallback: this._errorCallback.bind(this)
    };
    this._modifyCallbacks = {
        successCallback: this._successModifyCallback.bind(this),
        errorCallback: this._errorCallback.bind(this)
    };

    return this;
}

/**
 * @private
 */
Controller.prototype.getModel = function() {
    var queries = this._req.query;

    if(!_.isEmpty(_.intersection(_.keys(queries), ['ban', 'unban', 'promote', 'demote']))){
        this._model = new models.ModifyUserModel(this._req.query, this._req.session.user).
            registerCallbacks(this._modifyCallbacks);
    }
    else{
        this._model = new models.GetUserModel(this._req.query.id, this._req.session.user.rank).
            registerCallbacks(this._getCallbacks);
    }

    return this;
};

/**
 * @private
 */
Controller.prototype.executeModel = function() {
    this._model.execute();

    return this;
};

/**
 * @private
 */
Controller.prototype._successCallback = function (result) {
    var res = this._res,
        locals = res.locals || {};

    locals.user = result;
    locals.lang = locals.lang || {};
    locals.lang.ranks = ranksLanguage[this._req.session.language];
    locals.site = site;
    res.send(template(res.locals));
};

Controller.prototype._successModifyCallback = function(alert) {
    this._req.session.alert = alert;
    this._res.redirect(links.user + '?id=' + this._req.query.id);
};

/**
 * @private
 */
Controller.prototype._errorCallback = function (alert) {
    this._req.session.alert = alert;
    this._res.redirect(links.index);
};

/**
 * Routes the user path.
 * @param app the app to install routes to.
 * @param jadeCompiler a function compiling jade templates
 */
function setup(app, jadeCompiler) {
    site = app.config.site;
    ranksID = site.ranks;
    ranksLanguage = require('../../lib/internationalization')
        .getAdditionalLanguageField('ranks');
    links = site.links;
    models = require('./userModel')(app.queries, ranksID);
    template = jadeCompiler('user');

    app.get(links.user, _user);
    app.post(links.user, _user);

    return app.config.site.private ?
        app.config.site.ranks.MEMBER:
        app.config.site.ranks.PUBLIC;
}

module.exports.setup = setup;