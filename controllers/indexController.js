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
 * @private
 */
function _postIndex(req, res){
    req.session.username = req.body.username;
    req.session.password = req.body.password;
    res.write('logged in, ' + req.session.username);
    res.end();
}

/**
 * Handles routing for / and /index
 * @param app the app to install routing to
 * @returns {boolean} successful routing
 */
function setup(app){
    app.get('/', _getRoot);
    app.get('/index', _getIndex);
    app.post('/index', _postIndex);
    return true;
}

module.exports.setup = setup;