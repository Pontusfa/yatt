/**
 * Handles a user's logout.
 */

var links = {};

/**
 * a simple setter and redirect
 * @private
 */
function _getLogout(req, res) {
    req.session.user = null;
    req.session.destroy();
    res.redirect(links.index);
}

/**
 * Setups routing for /logout.
 * @param app the app to route
 */
function setup(app) {
    links = app.config.site.links;
    app.get(links.logout, _getLogout);
    return app.config.site.ranks.MEMBER;
}

module.exports.setup = setup;
