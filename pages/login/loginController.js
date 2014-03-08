/**
 * Handling a user logging in.
 * @author Pontus Falk
 * @version 0.0.1
 */

var verifyUser = null,
    getTemplate = null,
    _ =  require('underscore');

/**
 * @private
 */
function _getLogin(config){
    var name = config.site.name;
    
    return function (req, res){
        res.locals.site = {name: name};
        res.send(getTemplate(res.locals));
    };
}

/**
 * @private
 */
function _postLogin(req, res){
    verifyUser(req.body, _postLoginCallback(req, res));
}

/**
 * @private
 */
function _postLoginCallback(req, res){
    var oneYear = 365*24*60*60*1000;
    
    return function(alert, user){
        if(_.isNull(alert) && _.isObject(user)) {
            req.session.user = user;
            
            if(req.body.rememberMe === 'on'){
                req.session.cookie.maxAge = oneYear;
            }
            
            res.redirect(req.query.redirect || '/');
        }
        else{
            res.locals[alert.type] = alert.message;
            res.send(getTemplate(res.locals));
        }
    };
}

/**
 * Sets up the routing for login
 * @param app the app to setup
 * @returns the rank constant needed to visit this page
 */
function setup(app, jadeCompiler){
    verifyUser = require('./loginModel').verify(app.queries);
    getTemplate = jadeCompiler('login');
    app.get('/login', _getLogin(app.config));
    app.post('/login', _postLogin);

    return app.config.site.ranks.PUBLIC_ONLY;
}

module.exports.setup = setup;
