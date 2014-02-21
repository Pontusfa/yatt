/**
 * Controls the behavior of the / and /index controllers.
 * @author Pontus Falk
 * @version 0.0.1
 */


function _getIndex(req, res){
    req.session.cnt = req.session.cnt+3 || 1;
    res.write('lo ' + req.session.cnt);
    res.end();
}

function _getRoot(req, res){
    res.redirect('/index');
}

function _postIndex(req, res){
    req.session.username = req.body.username;
    req.session.password = req.body.password;
    res.write('logged in, ' + req.session.username);
    res.end();
}

function setup(app){
    app.get('/', _getRoot);
    app.get('/index', _getIndex);
    app.post('/index', _postIndex);
    return true;
}

module.exports.setup = setup;