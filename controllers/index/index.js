/**
 * Controls the behavior of the / and /index routes.
 * @author Pontus Falk
 * @version 0.0.1
 */

function get(req, res){
    res.write("aha!");
    res.end();
}

module.exports.get = get;