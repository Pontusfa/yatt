/**
 * Handling a user logging in.
 */

var Verifier = null,
    getTemplate = null,
    site = null,
    _ = require('underscore');

/**
 * @private
 */
function _getLogin(parameters) {
    var res = parameters.res;
    
    res.locals.site = site;
    res.send(getTemplate(res.locals));
}

/**
 * @private
 */
function _postLogin(req, res) {
    new Controller(req, res).
        sanitizeForm().
        getModel().
        executeModel();
}

function Controller(req, res) {
    this._req = req;
    this._res = res;
    this._model = null;
    this._modelCallbacks = {
        successCallback: this._postLoginSuccessCallback.bind(this),
        errorCallback: this._postLoginErrorCallback.bind(this)
    };
    return this;
}

Controller.prototype.sanitizeForm = (function () {
    var formWhiteList = ['username', 'password', 'rememberMe'],
        nonAlfaNumericals = /[^\w|\s]/g;
    return function () {
        var input = _.pick(this._req.body, formWhiteList);

        if (_.isString(input.username)) {
            input.username = input.username.replace(nonAlfaNumericals, '');
        }
        this._input = input;
        return this;
    };
}());

Controller.prototype.getModel = function () {
    this._model = new Verifier(this._input).
        registerCallbacks(this._modelCallbacks);
    return this;
};

Controller.prototype.executeModel = function () {
    this._model.validateUser();
};

/**
 * @private
 */
Controller.prototype._postLoginSuccessCallback = (function () {
    var oneYear = 365 * 24 * 60 * 60 * 1000;

    return function (user) {
        var req = this._req,
            res = this._res;

        req.session.user = {username: user.username,
            rank: user.rank,
            passkey: user.passkey};

        if (_.isEqual(this._input.rememberMe, 'on')) {
            req.session.cookie.maxAge = oneYear;
        }
        res.redirect(req.query.redirect || site.links.index);
    };
}());

/**
 * @private
 */
Controller.prototype._postLoginErrorCallback = function (alert) {
    this._req.session.alert = alert;
    this._res.redirect(this._req.originalUrl);
};

/**
 * Sets up the routing for login
 * @param app the app to setup
 * @returns the rank constant needed to visit this page
 * @param jadeCompiler a function to render the wanted template
 */
function setup(app, jadeCompiler) {
    Verifier = require('./loginModel')(app.queries).Verifier;
    getTemplate = jadeCompiler('login');
    site = app.config.site;

    app.get(site.links.login, _getLogin);
    app.post(site.links.login, _postLogin);

    return app.config.site.ranks.PUBLIC_ONLY;
}

module.exports.setup = setup;
