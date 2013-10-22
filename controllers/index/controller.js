/**
 * Controls the behavior of the / and /index routes.
 * @author Pontus Falk
 * @version 0.0.1
 */

function _get(req, res){
    res.write("aha!");
    res.end();
}

function setup(app){
    //TODO redirect / to /index
    app.get('/index', _get);
    return true;
}

module.exports.setup = setup;