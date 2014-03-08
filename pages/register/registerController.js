/**
 * Handling the register system.
 * @author Pontus Falk
 */

var _ = require('underscore'),
    registerModel = null,
    template = null,
    ranks = null,
    logger = null;

/**
 * @private
 */
function _getRegister(config){
    var site = {name: config.site.name,
                registration: config.site.registration,
                usernameLength: config.site.usernameLength,
                passwordLength: config.site.passwordLength};
    
    return function(req, res){
        if(req.session.user.rank >= ranks.MEMBER){
            res.redirect('/');
        }
        else{
            res.locals.site = site;
            res.send(template(res.locals));
        }
    };
}

/**
 * @private
 */
function _postRegister(req, res){
    if(req.session.user.rank >= ranks.MEMBER){
        res.redirect('/');
    }
    else{
        registerModel.registerUser(req.body, _postRegisterCallback(req, res));
    }
}

/**
 * TODO: mail registration link
 * @private
 */
function _postRegisterCallback(req, res){
    return function(alert, result){
        if(_.isObject(alert) || !result){
            res.locals[alert.type] = alert.message;
            res.send(template(res.locals));
        }
        else{
            req.session.alert = {type: 'success' , message: 'successfulRegistration'};
            res.redirect('/login');
        }
    };
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
    template = jadeCompiler('register');
    registerModel = require('./registerModel')(app.queries, app.modifyUser, app.config);
    app.get('/register', _getRegister(app.config));
    app.post('/register', _postRegister);
    
    return app.config.site.ranks.PUBLIC_ONLY;

}

module.exports.setup = setup;
