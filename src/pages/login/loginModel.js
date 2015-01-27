/**
 * Determine if a user has provided correct credentials for the site.
 */

var queries = null,
    _ = require('underscore');

/**
 * Ensures that the user's password matches the one stored in the db.
 * @param user the user info, at least user.username and user.password must be present.
 */
function Verifier(user) {
    this._user = user;
    return this;
}

Verifier.prototype.registerCallbacks = function (callbacks) {
    this._callbacks = callbacks;
    return this;
};

/**
 * Finds the user with user.username, creates hash for
 * user.password and sends result to _validateUserCallback
 * @private
 */
Verifier.prototype.validateUser = (function () {
    var returnFields = {username: 1,
            password: 1,
            salt: 1,
            rank: 1,
            passkey: 1,
            active: 1,
            banned: 1},
        sort = {},
        limit = 1,
        offset = 0;

    return function () {
        var user = this._user,
            criteria = {username: user.username};

        if (_.isEmpty(user.username) || _.isEmpty(user.password)) {
            this._callbacks.errorCallback({type: 'error', message: 'noUserPass'});
        }
        else {
            queries.getDocuments(criteria,
                queries.USERMODEL,
                sort,
                offset,
                limit,
                returnFields,
                this._validateUserHelper.bind(this));
        }
    };
}());

/**
 * @private
 */
Verifier.prototype._validateUserHelper = function (err, foundUser) {
    if (_.isObject(err)) {
        this._callbacks.errorCallback({type: 'error', message: 'databaseFail'});
    }
    else if (_.isObject(foundUser)) {
        this._foundUser = foundUser;
        queries.createHash(this._user,
            foundUser.salt,
            this._validateUserCallback.bind(this));
    }
    else {
        this._callbacks.errorCallback({type: 'error', message: 'wrongUserPass'});
    }
};

/**
 * Receives the user trying to login and the user stored in db with matching usernames.
 * Compares the two hashes for the passwords and callbacks
 * @private
 */
Verifier.prototype._validateUserCallback = function () {
    var user = this._user,
        foundUser = this._foundUser,
        callbacks = this._callbacks;

    if (!_.isEqual(user.password, foundUser.password)) {
        callbacks.errorCallback({type: 'error', message: 'wrongUserPass'});
    }
    else if (foundUser.banned) {
        callbacks.errorCallback({type: 'error', message: 'banned'});
    }
    else if (!foundUser.active) {
        callbacks.errorCallback({type: 'error', message: 'notActive'});
    }
    else if (_.isEqual(user.password, foundUser.password)) {
        callbacks.successCallback(foundUser);
    }
};

module.exports = function (queriesObject) {
    queries = queriesObject;
    module.exports.Verifier = Verifier;
    return module.exports;
};
