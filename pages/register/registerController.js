/**
 * Handling the register system.
 */

var _ = require('underscore'),
    registerModel = null,
    template = null,
    ranks = null,
    site = null,
    logger = null;

/**
 * @private
 */
function _getRegister(req, res){
    _setupTooltips(res);

    res.locals.site = site;
    res.send(template(res.locals));
}

/**
 * @private
 */
function _postRegister(req, res){
    if(!site.registration){
        res.redirect('/register');
    }
    else{
        registerModel.registerUser(req.body, _postRegisterCallback(req, res));
    }
}

/**
 * TODO: mail a registration link
 * @private
 */
function _postRegisterCallback(req, res){
    return function(alert, result){
        if(_.isObject(alert) || !result){
            res.locals[alert.type] = alert.message;

            res.locals.site = site;
            _setupTooltips(res);
            res.send(template(res.locals));
        }
        else{
            req.session.alert = {type: 'success', message: 'successfulRegistration'};
            res.redirect('/login');
        }
    };
}

/**
 * Creates the text ouput used to explain to the user
 * the requirements for registering to the site.
 * TODO: precalculate
 * @param res
 * @private
 */
function _setupTooltips(res){
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
 * @returns {boolean}
 */
function setup(app, jadeCompiler){
    logger = app.logger;

    ranks = app.config.site.ranks;
    site = {name: app.config.site.name,
        registration: app.config.site.registration,
        usernameLength: app.config.site.usernameLength,
        passwordLength: app.config.site.passwordLength};
    template = jadeCompiler('register');
    registerModel = require('./registerModel')(app.queries, app.modifyUser, app.config);

    app.get('/register', _getRegister);
    app.post('/register', _postRegister);

    return app.config.site.ranks.PUBLIC_ONLY;

}

module.exports.setup = setup;
