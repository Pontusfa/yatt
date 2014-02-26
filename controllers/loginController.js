/**
 * Handling a user logging in.
 * @author Pontus Falk
 * @version 0.0.1
 */

var verifyUser = require('../models/loginModel');

/**
 * @private
 */
function _getLogin(req, res){
    res.render('login', {
        pets : 'a'
    });
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
    return function(err, result, passkey){
        if(result) {
            req.session.username = req.body.username;
            req.session.loggedIn = true;
            req.session.passkey = passkey;
            res.redirect(req.query.redirect || '/');
        }
        else{
            req.session.loggedIn = false;
            req.session.username = null;
            req.session.passkey = null;
            res.write(err.message);
            res.end();
        }
    };
}

/**
 * Sets up the routing for login
 * @param app the app to setup
 * @returns {boolean} signals the success of routing
 */
function setup(app){
    app.get('/login', _getLogin);
    app.post('/login', _postLogin);
    return true;
}

module.exports.setup = setup;