/**
 * Controls the behavior of the / and /index controllers.
 * @author Pontus Falk
 */


/**
 * @private
 */
function _getIndex(req, res){
    res.write('herro! try /uploadtorrent, /gettorrent, /login, /register or perhaps /logout.');
    res.end();
}

/**
 * @private
 */
function _getRoot(req, res){
    res.redirect('/index');
}


/**
 * Handles routing for / and /index
 * @param app the app to install routing to
 * @returns {boolean} successful routing
 */
function setup(app){
    app.get('/', _getRoot);
    app.get('/index', _getIndex);
    return true;
}

module.exports.setup = setup;