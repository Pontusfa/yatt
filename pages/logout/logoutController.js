/**
 * Handles a user's logout.
 */

/**
 * a simple setter and redirect
 * @private
 */
function _getLogout(req, res){
    req.session.user = null;
    req.session.destroy();
    res.redirect('/');
}

/**
 * Setups routing for /logout.
 * @param app the app to route
 */
function setup(app){
    app.get('/logout', _getLogout);
    return app.config.site.ranks.MEMBER;
}

module.exports.setup = setup;
