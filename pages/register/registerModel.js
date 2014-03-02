/**
 * Registering a new unique user.
 * @author Pontus Falk
 */

var queries = null,
    modifyUser = null,
    usernameLength = null,
    usernameRegex = null,
    passwordLength = null,
    _ = require('underscore');


        /**
 * Register a new user with unique username. Fails if username is already taken.
 * @param user all relevant info about the user
 * @param callback function(err, result) where result is a boolean representing successful registration.
 */
function registerUser(user, callback){
    if(!_.isString(user.username) || !_.isString(user.password)){
        callback(new Error('no pass/username'), false);
    }

    else if(!usernameRegex.test(user.username)){
        callback(new Error('regex fail'), false);
    }

    else if(user.password.length < passwordLength.min ||  user.password.length > passwordLength.max){
        callback(new Error('password length'), false);
    }

    else{
        queries.addUser(user, function(err, result){
            if(result){
                modifyUser.updatePasskey(user, callback);
            }
            else{
                callback(err, result);
            }
        });
    }
}

module.exports = function(queriesObject, modifyUserObject, config){
    usernameLength = config.site.usernameLength;
    usernameRegex = new RegExp('^[a-zA-Z][a-zA-Z0-9_-]{' +
		(usernameLength.min-1) + ',' +
		(usernameLength.max-1) + '}$');

    passwordLength = config.site.passwordLength;
    queries = queriesObject;
    modifyUser = modifyUserObject;

	module.exports = {};
    module.exports.registerUser = registerUser;
    return module.exports;
};