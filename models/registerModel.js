/**
 * Registering a new unique user.
 * @author Pontus Falk
 * @version 0.0.1
 */

var queries = require('./queries'),
    usernameLength = require('../lib/config').conf.site.usernameLength,
    usernamePattern = '^[a-zA-Z][a-zA-Z0-9_-]{' + (usernameLength.min-1) + ',' + (usernameLength.max-1) + '}$',
    usernameRegex = new RegExp(usernamePattern),
    passwordLength = require('../lib/config').conf.site.passwordLength;

/**
 * Register a new user with unique username. Fails if username is already taken.
 * @param user all relevant info about the user
 * @param callback function(err, result) where result is a boolean representing successful registration.
 * @returns {boolean}
 */
function registerUser(user, callback){
    if(!user.username || !user.password){
        callback(new Error('no pass/username'), false);
    }

    else if(usernameRegex.test(user.username) === false){
        callback(new Error('regex fail'), false);
    }

    else if(user.password.length < passwordLength.min ||  user.password.length > passwordLength.max){
        callback(new Error('password length'), false);
    }

    else{
        queries.addUser(user, callback);
    }
    return true;
}

module.exports.registerUser = registerUser;