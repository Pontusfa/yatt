/**
 * Determine if a user has provided correct credentials for the site.
 * @author Pontus Falk
 * @version 0.0.1
 */

var queries = require('./queries'),
    logger = require('../lib/logger').logger;

function _validateUser(user, callback){
    queries.getUser(user,
        function(err, foundUser){
            if(err) {
                callback(err, false);
            }
            else if(foundUser === null){
                callback(new Error('no such user'), false);
            }
            else{
                queries.createHash(user, foundUser.salt, _validateUserCallback(user, foundUser, callback));
            }
        });
}

function _validateUserCallback(user, foundUser, callback){
    return function(){
        if(user.password === foundUser.password){
            callback(null, true);
        }
        else{
            callback(new Error('wrong password'), false);
        }
    };
}

/**
 * Ensures that the user's password matches the one stored in the db.
 * @param user the user info, at least user.username and user.password must be present.
 * @param callback function(error, result) to handle the validation results.
 */
function verify(user, callback){
    if(user.username === null || user.pasword === null){
        callback(new Error('No username/password.'), false);
    }
    else{
        _validateUser(user, callback);
    }
}

module.exports = verify;