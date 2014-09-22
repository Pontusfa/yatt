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
 * Registers a new user.
 * @param user all relevant info about the user
 */
var  RegisterUser = function(user) {
    this._user = user;
    return this;
};

RegisterUser.prototype.registerCallbacks = function(callbacks) {
    this._callbacks = callbacks;
    return this;
};

RegisterUser.prototype.addUser = function() {
    this._checkRequirements();
    return this;
};

RegisterUser.prototype._checkRequirements = function() {
    var user = this._user,
        errorCallback = this._callbacks.errorCallback;

    if(!_.isString(user.username) || !_.isString(user.password)) {
        errorCallback({type: 'error', message: 'noUserPass'});
    }

    else if(!_.isEqual(user.vow, 'on')) {
        errorCallback({type:'error', message: 'noVow'});
    }

    else if(!_.isString(user.email)) {
        errorCallback({type:'error', message: 'noEmail'});
    }

    else if(!_.isEqual(user.password, user.passwordAgain)) {
        errorCallback({type:'error', message: 'passMissmatch'});
    }

    else if(!usernameRegex.test(user.username)) {
        errorCallback({type:'error', message: 'userFail'});
    }

    else if(user.password.length < passwordLength.min ||  user.password.length > passwordLength.max) {
        errorCallback({type:'error', message: 'passLengthFail'});
    }

    else {
        this._checkUniques();
    }
};

/**
 * Makes sure neither username nor email is already in use.
 * Could be done at insert time since they're unique in db
 *
 */
RegisterUser.prototype._checkUniques = (function() {
    var sort = {},
        offset = 0,
        limit = 1,
        wantedFields = {username: 1, email: 1};

    return function() {
        var criteria = {$or: [{username: this._user.username}, {email: this._user.email}]};

        queries.getDocuments(
            criteria, queries.USERMODEL, sort, offset,limit, wantedFields,
            this._checkUniquesCallback.bind(this)
        );
    };
}());

/**
 * @private
 */
RegisterUser.prototype._checkUniquesCallback = function(err, foundUser) {
    var errorCallback = this._callbacks.errorCallback,
        user = this._user;

    if(_.isObject(err)) {
        errorCallback({type: 'error', message: 'databaseFail'});
    }
    else if(_.isObject(foundUser)) {
        if(_.isEqual(foundUser.username, user.username)) {
            errorCallback({type: 'error', message: 'userTaken'});
        }
        else if(_.isEqual(foundUser.email, user.email)) {
            errorCallback({type: 'error', message: 'emailTaken'});
        }
    }
    else {
        queries.addUser(user, this._addUserCallback.bind(this));
    }
};

/**
 * @private
 */
RegisterUser.prototype._addUserCallback = function(err) {
    if(_.isObject(err)) {
        this._callbacks.errorCallback({type:'error', message: 'databaseFail'});
    }
    else {
        modifyUser.updatePasskey(this._user, this._callbacks.successCallback);
    }
};

module.exports = function(queriesObject, modifyUserObject, config) {
    usernameLength = config.site.usernameLength;
    usernameRegex = new RegExp('^[a-zA-Z][a-zA-Z0-9_-]{' +
        (usernameLength.min-1) + ',' +
        (usernameLength.max-1) + '}$');

    passwordLength = config.site.passwordLength;
    queries = queriesObject;
    modifyUser = modifyUserObject;

    module.exports = {};
    module.exports.RegisterUser = RegisterUser;

    return module.exports;
};
