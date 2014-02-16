/**
 * List and search for registered users.
 * @author Pontus Falk
 * @version 0.0.1
 */

function _get(req, res){
    res.write("ahmmma!");
    res.end();
}

function setup(app){
    app.get('/users', _get);
    return true;
}

module.exports.setup = setup;