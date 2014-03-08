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
 * @private
 */
function _checkRequirements(user, callback) {
    if(!_.isString(user.username) || !_.isString(user.password)){
        callback({type: 'error', message: 'noUserPass'});
    }

    else if(!_.isEqual(user.vow, 'on')){
        callback({type:'error', message: 'noVow'});
    }
    
    else if(!_.isEqual(user.password, user.passwordAgain)){
        callback({type:'error', message: 'passMissmatch'});
    }
    
    else if(!usernameRegex.test(user.username)){
         callback({type:'error', message: 'userFail'});
    }

    else if(user.password.length < passwordLength.min ||  user.password.length > passwordLength.max){
        callback({type:'error', message: 'passwordFail'});
    }

    else{
        _checkUniques(user, callback);
    }
}

/**
 * @private
 */
function _checkUniques(user, callback){
    var limit = 1;
    
    queries.getDocument(
        {$or: [{username: user.username}, {email: user.email}]},
        queries.USERMODEL, limit,
        {username: 1, email: 1},
        _checkUniquesCallback(user, callback)
    );
}

/**
 * @private
 */
function _checkUniquesCallback(user, callback){
    return function(err, foundUser){
        if(_.isObject(err)){
            callback({type: 'error', message: err.message});
        }
        else if(_.isObject(foundUser)){
            if(_.isEqual(foundUser.username, user.username)){
                callback({type: 'error', message: 'userTaken'});
            }
            else if(_.isEqual(foundUser.email, user.email)){
                    callback({type: 'error', message: 'emailTaken'});
            }
        }
        else{
            callback(null);
        }
    };
}

/**
 * @private
 */
function _registerCallback(user, callback){
    return function(err, result){
        if(_.isObject(result)){
            modifyUser.updatePasskey(user, callback);
        }
        else{
            callback({type:'error', message: 'generic'});
            
        }
    };
}

/**
 * Registers a new user.
 * @param user all relevant info about the user
 * @param callback function(err, result) where result is a boolean representing successful registration.
 */
function registerUser(user, callback){
    _checkRequirements(user, function(error){
        if(_.isObject(error)){
            callback(error);
        }
        else{
            queries.addUser(user, _registerCallback(user, callback));
        }
    });
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
