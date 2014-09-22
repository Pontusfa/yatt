/**
 * Handling the register system.
 */

var _ = require('underscore'),
    RegisterModel = null,
    template = null,
    errors = null,
    site = null,
    logger = null;

/**
 * @private
 */
function _getRegister(req, res) {
    _setupTooltips(res);

    res.locals.site = site;
    res.locals.form = {};
    res.send(template(res.locals));
}

/**
 * @private
 */
function _postRegister(req, res) {
    if(!site.registration) {
        res.redirect(site.links.register);
    }
    else {
        new Controller(req, res).
            sanitizeForm().
            getModel().
            executeModel();
    }
}

function Controller(req, res) {
    this._req = req;
    this._res = res;
    this._callbacks = {
        successCallback: this._successCallback.bind(this),
        errorCallback: this._errorCallback.bind(this)
    };
    return this;
}

Controller.prototype.sanitizeForm = (function() {
    var formWhitelist = ['username', 'password', 'passwordAgain', 'email', 'vow'];

    return function() {
        this._user = _.pick(this._req.body, formWhitelist);
        return this;
    };
}());

Controller.prototype.getModel = function() {
    this._model = new RegisterModel(this._user).
        registerCallbacks(this._callbacks);

    return this;
};

Controller.prototype.executeModel = function() {
    this._model.addUser(this._user);
};

Controller.prototype._successCallback = function() {
    this._req.session.alert = {type: 'success', message: 'successfulRegistration'};
    this._res.redirect(site.links.login);
};

/**
 * todo: mail a registration link
 * @private
 */
Controller.prototype._errorCallback = function(alert) {
    var res = this._res;

    this._req.session.alert = alert;
    res.locals[alert.type] = errors[this._req.session.language][alert.message];
    res.locals.site = site;
    _setupTooltips(res);
    res.locals.form = this._user || {};
    res.send(template(res.locals));
};

/**
 * Creates the text ouput used to explain to the user
 * the requirements for registering to the site.
 * TODO: prebuild?
 * @param res
 * @private
 */
function _setupTooltips (res) {


    res.locals.usernameTooltip =  res.locals.lang.inputLength + ' ' +
        site.usernameLength.min + ' ' +  res.locals.lang.and + ' ' +
        site.usernameLength.max + ' ' +  res.locals.lang.characters + ' ' +
        res.locals.lang.beginCharacter;

    res.locals.passwordTooltip = res.locals.lang.inputLength + ' ' +
        site.passwordLength.min + ' ' + res.locals.lang.and + ' ' +
        site.passwordLength.max + ' ' + res.locals.lang.characters;

    res.locals.samePasswordTooltip = res.locals.lang.samePassword;
    res.locals.validMailTooltip = res.locals.lang.validMail;
}
/**
 * Sets up the routing for registering
 * @param app the app to setup
 * @param jadeCompiler provide a compiler for jade templates
 */
function setup(app, jadeCompiler) {
    logger = app.logger;
    site = app.config.site;
    template = jadeCompiler('register');
    errors = require('../../lib/internationalization')
        .getAdditionalLanguageField('error');
    RegisterModel = require('./registerModel')(app.queries, app.modifyUser, app.config).RegisterUser;

    app.get(site.links.register, _getRegister);
    app.post(site.links.register, _postRegister);

    return site.ranks.PUBLIC_ONLY;
}

module.exports.setup = setup;
