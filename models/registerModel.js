/**
 * Registering a new unique user.
 * @author Pontus Falk
 * @version 0.0.1
 */

var queries = require('./queries'),
    modifyUser = require('./modifyUserModel'),
    _ = require('underscore'),
    usernameLength = require('../lib/config').site.usernameLength,
    usernamePattern = '^[a-zA-Z][a-zA-Z0-9_-]{' + (usernameLength.min-1) + ',' + (usernameLength.max-1) + '}$',
    usernameRegex = new RegExp(usernamePattern),
    passwordLength = require('../lib/config').site.passwordLength;

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
        user.passkey = -1; // defaults to -1, will be updated to unique value after insertion
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

module.exports.registerUser = registerUser;