/**
 * Handles a user's logout.
 * @author Pontus Falk
 * @version 0.0.1
 */

/**
 * a simple setter and redirect
 * @private
 */
function _logout(req, res){
    req.session.loggedIn = false;
    res.redirect('/');
}

/**
 * Setups routing for /logout.
 * @param app the app to route
 */
function setup(app){
    app.get('/logout', _logout);
    app.post('/logout', _logout);
    return true;
}

module.exports.setup = setup;