/**
 * Handling a user logging in.
 * @author Pontus Falk
 */

var verifyUser = null,
    getTemplate = null,
    site = null,
    _ =  require('underscore');

/**
 * @private
 */
function _getLogin(req, res){
    res.locals.site = site;
    res.send(getTemplate(res.locals));
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
            req.session.user = {username: user.username,
                                rank: user.rank,
                                passkey: user.passkey};


            if(_.isEqual(req.body.rememberMe,'on')){
                req.session.cookie.maxAge = oneYear;
            }
            res.redirect(req.query.redirect || '/');
        }
        else{
            res.locals[alert.type] = alert.message;
            res.locals.site = site;
            res.send(getTemplate(res.locals));
        }
    };
}

/**
 * Sets up the routing for login
 * @param app the app to setup
 * @returns the rank constant needed to visit this page
 * @param jadeCompiler a function to render the wanted template
 */
function setup(app, jadeCompiler){
    verifyUser = require('./loginModel').verify(app.queries);
    getTemplate = jadeCompiler('login');
    site = {name: app.config.site.name, registration: app.config.site.registration};

    app.get('/login', _getLogin);
    app.post('/login', _postLogin);

    return app.config.site.ranks.PUBLIC_ONLY;
}

module.exports.setup = setup;
