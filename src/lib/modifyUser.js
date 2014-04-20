/**
 * Various functions to update a user's details.
 */

var queries = null,
    crypto = require('crypto'),
    sort = {},
    limit = 1,
    wantedFields = {username: 1},
    passkeyLength = 32,
    nonAlfaNumericals = /\W/g,
    _ = require('underscore');

/**
 * Updates the user's passkey that identifies the user on the tracker.
 * @param user object that identifies the user, contains at least user.username
 * @param callback function(err, result) handling the update
 */
function updatePasskey(user, callback){
    var newPasskey = crypto.randomBytes(passkeyLength).toString('base64').replace(nonAlfaNumericals, ''),
        offset = 0,
        criteria = {passkey: newPasskey};

    queries.getDocuments(criteria,
        queries.USERMODEL,
        sort,
        offset,
        limit,
        wantedFields,
        _updatePasskeyCallback(user,
            newPasskey,
            callback
        )
    );
}

/**
 * Updates the stored user's passkey if a unique key can be found.
 * @private
 */
function _updatePasskeyCallback(user, newPasskey, callback){
    return function(err, foundUser) {
        if(_.isObject(err)){
            callback(err, null);
        }
        else if(!_.isObject(foundUser)){
            queries.updateDocument({username: user.username}, queries.USERMODEL, {passkey: newPasskey}, callback);
        }
        else{ // a user with that passkey exists, try another
            updatePasskey(user, callback);
        }
    };
}

module.exports = function(app){
	queries = app.queries;

	module.exports = {};
	module.exports.updatePasskey = updatePasskey;
	return module.exports;
};
