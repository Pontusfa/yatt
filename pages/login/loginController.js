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
function _getLogin(req, res){
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
    return function(err, user){
        if(_.isNull(err) && _.isObject(user)) {
            req.session.user = user;
            res.redirect(req.query.redirect || '/');
        }
        else{
            req.session.user = null;
            res.send(err.message);
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
    app.get('/login', _getLogin);
    app.post('/login', _postLogin);

    return app.config.site.ranks.PUBLIC_ONLY;
}

module.exports.setup = setup;
