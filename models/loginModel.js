/**
 * Determine if a user has provided correct credentials for the site.
 * @author Pontus Falk
 */

var queries = require('./queries'),
    _ = require('underscore');

/**
 * Finds the user with user.username, creates hash for user.password and sends result to _validateUserCallback
 * @private
 */
function _validateUser(user, callback){
    queries.getDocument({username: user.username}, queries.USERMODEL, {username: 1, password: 1, salt: 1, passkey: 1},
        function(err, foundUser){
            if(err) {
                callback(err, false);
            }
            else if(_.isNull(foundUser)){
                callback(new Error('Error: wrong username/password'), false);
            }
            else{
                queries.createHash(user, foundUser.salt, _validateUserCallback(user, foundUser, callback));

            }
        });
}

/**
 * Receives the user trying to login and the user stored in db with matching usernames.
 * Compares the two hashes for the passwords and callback with the
 * @private
 */
function _validateUserCallback(user, foundUser, callback){
    return function(){
        if(_.isEqual(user.password, foundUser.password)){
            callback(null, true, foundUser.passkey);
        }
        else{
            callback(new Error('Error: wrong username/password'), false);
        }
    };
}

/**
 * Ensures that the user's password matches the one stored in the db.
 * @param user the user info, at least user.username and user.password must be present.
 * @param callback function(error, result) to handle the validation results.
 */
function verify(user, callback){
    if(_.isEmpty(user.username) || _.isEmpty(user.password)){
        callback(new Error('Error: no username or password given.'), false);
    }
    else{
        _validateUser(user, callback);
    }
}

module.exports = verify;