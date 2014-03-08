/**
 * Determine if a user has provided correct credentials for the site.
 * @author Pontus Falk
 */

var queries = null,
    returnFields = {username: 1, password: 1, salt: 1, rank: 1, passkey: 1, active: 1, banned: 1},
    _ = require('underscore');

/**
 * Finds the user with user.username, creates hash for user.password and sends result to _validateUserCallback
 * @private
 */
function _validateUser(user, callback){
    queries.getDocument({username: user.username}, queries.USERMODEL, returnFields,
        function(err, foundUser){
            if(_.isObject(err)){
                callback(err);
            }
            else if(_.isNull(foundUser)){
                callback({type: 'error', message: 'wrongUserPass'});
            }
            else{
                queries.createHash(user, foundUser.salt, _validateUserCallback(user, foundUser, callback));

            }
        });
}

/**
 * Receives the user trying to login and the user stored in db with matching usernames.
 * Compares the two hashes for the passwords and callbacks
 * @private
 */
function _validateUserCallback(user, foundUser, callback){
    return function(){
        if(!_.isEqual(user.password, foundUser.password)){
            callback({type: 'error', message: 'wrongUserPass'});
        }
        
        else if(foundUser.banned){
            callback({type: 'error', message: 'banned'});
        }
        
        else if(!foundUser.active){
            callback({type: 'error', message: 'notActive'});
        }
        
        else if(_.isEqual(user.password, foundUser.password)){
            callback(null, foundUser);
        }
    };
}

/**
 * Ensures that the user's password matches the one stored in the db.
 * @param user the user info, at least user.username and user.password must be present.
 * @param callback function(error, user) to handle the validation results.
 */
function verify(user, callback){
    if(_.isEmpty(user.username) || _.isEmpty(user.password)){
        callback({type: 'error', message: 'noUserPass'});
    }
    else{
        _validateUser(user, callback);
    }
}

module.exports.verify = function(queriesObject){
    queries = queriesObject;
    return verify;
};
