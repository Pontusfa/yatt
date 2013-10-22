/**
 * Controls the behavior of the / and /index routes.
 * @author Pontus Falk
 * @version 0.0.1
 */

function _getIndex(req, res){
    res.write('token: )' + req.locals.csrfToken);
    res.end();
}

function _getRoot(req, res){
    res.redirect('/index');
}

function setup(app){
    app.get('/', _getRoot);
    app.get('/index', _getIndex);
    return true;
}

module.exports.setup = setup;