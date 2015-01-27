/**
 * Handles a user's logout.
 */

var links = null,
    queries = null;

/**
 * a simple setter and redirect
 * @private
 */
function _getLogout(req, res) {
    var session = req.session;

    if(session) {
        if(session.user && session.user.username) {
            queries.removeDocument({username: session.user.username}, queries.ONLINEMODEL);
        }
        session.destroy();
        req.session = null;
    }
    res.redirect(links.index);
}

/**
 * Setups routing for /logout.
 * @param app the app to route
 */
function setup(app) {
    links = app.config.site.links;
    app.get(links.logout, _getLogout);
    queries = app.queries;
    return app.config.site.ranks.MEMBER;
}

module.exports.setup = setup;
