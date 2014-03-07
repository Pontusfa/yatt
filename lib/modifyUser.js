/**
 * Various functions to update a user's details.
 * @author Pontus Falk
 */

var queries = null,
    _ = require('underscore'),
    passkeyMaxAttempts = 1000;

/**
 * Updates the user's passkey that identifies the user on the tracker.
 * Will return an error if a unique passkey can't be assigned.
 * @param user object that identifies the user, contains at least user.username
 * @param callback function(err, result) handling the update
 */
function updatePasskey(user, callback){
    _updatePasskeyHelper(user, passkeyMaxAttempts, callback);
}

/**
 * hides the maximum attempts behind the curtains.
 * @private
 */
function _updatePasskeyHelper(user, attempts, callback){
	var crypto = require('crypto'),
        newPasskey = crypto.randomBytes(32).toString('base64').replace(/\W/g, '');
    if(attempts > 0){
        queries.getDocument({'passkey': newPasskey}, 'user', {username: 1},
            _updatePasskeyCallback(user, newPasskey, attempts, callback));
    }
    else{
        callback(new Error('Error: Couldn\'t create a new passkey.'), false);
    }
}

/**
 * Updates the stored user's passkey if a unique key can be found.
 * @private
 */
function _updatePasskeyCallback(user, newPasskey, attempts, callback){
    return function(err, foundUser) {
        if(_.isNull(foundUser)){
            queries.updateDocument({username: user.username}, 'user', {passkey: newPasskey}, callback);
        }
        else{ // a user with that passkey exists, try another
            _updatePasskeyHelper(user, --attempts, callback);
        }
    };
}

module.exports = function(app){
	queries = app.queries;

	module.exports = {};
	module.exports.updatePasskey = updatePasskey;
	return module.exports;
};
