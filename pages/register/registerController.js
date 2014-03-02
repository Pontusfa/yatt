/**
 * Handling the register system.
 * @author Pontus Falk
 */

var _ = require('underscore'),
    registerModel = null,
    template = null,
    logger = null;

/**
 * @private
 */
function _getRegister(req, res){
    if(req.session.loggedIn){
        res.redirect('/');
    }
    else{
        res.end(template(res.locals));
    }
}

/**
 * @private
 */
function _postRegister(req, res){
    if(req.session.loggedIn){
        res.redirect('/');
    }
    else{
        registerModel.registerUser(req.body, _postRegisterCallback(req, res));
    }
}

/**
 * @private
 */
function _postRegisterCallback(req, res){
    return function(err, result){
        if(_.isObject(err) || !result){
            logger.info(err.message);
            res.write('couldn\'t register at this time. Please try again later.');
            res.end();
        }
        else{
            res.redirect(req.query.redirect || '/');
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
    template = jadeCompiler('register.jade');
    registerModel = require('./registerModel')(app.queries, app.modifyUser, app.config);
    app.get('/register', _getRegister);
    app.post('/register', _postRegister);
    return true;
}

module.exports.setup = setup;