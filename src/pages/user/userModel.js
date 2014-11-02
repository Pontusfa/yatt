var _ = require('underscore'),
    ranks = null,
    queries = null;

function GetUserModel(soughtUser, userRank){
    this._soughtUser = soughtUser;
    this._userRank = userRank;

    return this;
}

GetUserModel.prototype.registerCallbacks = function(callbacks){
    this._callbacks = callbacks;

    return this;
};

GetUserModel.prototype.execute = function(){
    var sort = null,
        offset = 0,
        limit = 1;

    if(_.isEmpty(this._soughtUser)){
        this._callbacks.errorCallback({type: 'error', message: 'noID'});
        return this;
    }

    this._createWantedFields();

    queries.getDocuments(
        {username: this._soughtUser},
        queries.USERMODEL,
        sort,
        offset,
        limit,
        this._wantedFields,
        this._queryCallback.bind(this));

};

/**
 * Determines what information a user with rank this._userRank can access about this._soughtUser
 * @private
 */
GetUserModel.prototype._createWantedFields = function(){
    var wantedFields = {};

    //Nota bene: this is a correct fallthrough-switch.
    switch(this._userRank){
        case ranks.ROOT:
        case ranks.ADMINISTRATOR:
        case ranks.ADMIN:
            wantedFields.notes = 1;
            wantedFields.email = 1; // jshint ignore:line
        case ranks.UPLOADER:
        case ranks.MEMBER:
            wantedFields.username = 1;
            wantedFields.active = 1;
            wantedFields.online = 1;
            wantedFields.banned = 1;
            wantedFields.rank = 1;
            wantedFields.created = 1;
            wantedFields.uploaded = 1;
            wantedFields.downloaded = 1;
    }

    this._wantedFields = wantedFields;
    return this;
};

GetUserModel.prototype._queryCallback = function(err, result){
    var callbacks = this._callbacks;
    if(_.isObject(err)) {
        callbacks.errorCallback({type: 'error', message: 'failedSearch'});
    }
    else if(_.isEmpty(result)) {
        callbacks.errorCallback({type: 'error', message: 'noSuchUser'});
    }
    else{
        result.created = new Date(result.created).toLocaleDateString();
        result.downloaded = bytesToSize(result.downloaded);
        result.uploaded = bytesToSize(result.uploaded);
        result = _.extend(result, canBeModerated(this._userRank, result.rank, result.banned));
        result.canBeModerated =
            result.canBePromoted ||
            result.canBeDemoted ||
            result.canBeBanned ||
            result.canBeUnbanned;

        result.rank = _.invert(ranks)[result.rank].toLowerCase(); // get rank string from rank int

        callbacks.successCallback(result);
    }
};

function ModifyUserModel(query, user) {
    this._user = user;
    this._soughtUser = query.id;
    this._query = query;
    return this;
}

ModifyUserModel.prototype.registerCallbacks = function(callbacks) {
    this._callbacks = callbacks;
    return this;
};

ModifyUserModel.prototype.execute = function() {
    var sort = null,
        offset = 0,
        limit = 1,
        wantedFields = {};

    queries.getDocuments(
        {username: this._soughtUser},
        queries.USERMODEL,
        sort,
        offset,
        limit,
        wantedFields,
        this._findUserCallback.bind(this));
};

ModifyUserModel.prototype._findUserCallback = function(err, result) {
    var update = null,
        query = this._query;

    if(_.isObject(err)) {
        this._callbacks.errorCallback({type: 'error', message: 'failedSearch'});
        return;
    }
    else if(_.isEmpty(result)){
        this._callbacks.errorCallback({type: 'error', message: 'noSuchUser'});
        return;
    }

    result = _.extend(result, canBeModerated(this._user.rank, result.rank, result.banned));

    if(query.ban === '1' && result.canBeBanned){
        update = {$set: {banned: true}};
    }
    else if(query.unban === '1' && result.canBeUnbanned){
        update = {$set: {banned: false}};
    }
    else if(query.promote === '1' && result.canBePromoted){
        update = {$inc: {rank: 1}};
    }
    else if(query.demote === '1' && result.canBeDemoted){
        update = {$inc: {rank: -1}};
    }
    else{
        this._callbacks.errorCallback({type: 'error', message: 'notAllowed'});
        return;
    }

    queries.updateDocument(queries.USERMODEL, {username: result.username}, update, this._updateUserCallback.bind(this));
};

ModifyUserModel.prototype._updateUserCallback = function(err, result) {
    if(_.isObject(err)) {
        this._callbacks.errorCallback({type: 'error', message: 'failedSearch'});
    }
    else if(_.isEmpty(result)){
        this._callbacks.errorCallback({type: 'error', message: 'noSuchUser'});
    }
    else {
        this._callbacks.successCallback({type: 'success', message: 'userModified'});
    }
};

/**
 * Calculates correct prefix size.
 * Thanks to http://stackoverflow.com/a/18650828/1131050
 * @private
 */
function bytesToSize(byte) {
    var k = 1024,
        bytes = parseInt(byte),
        sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB'],
        i = null,
        result = null;

    if (bytes === 0 || _.isNaN(bytes)) {
        result = '0 B';
    }
    else {
        i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)), 10);
        result = (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
    }
    return result;
}

function canBeModerated(modifierRank, modifieeRank, banned) {
    var result = {};

    result.canBeBanned = modifierRank >= ranks.MODERATOR && modifierRank > modifieeRank && !banned;
    result.canBeUnbanned = modifierRank >= ranks.MODERATOR && modifierRank > modifieeRank && banned;
    result.canBeModified = result.canBeBanned;
    // - 1 to only allow to promote to one rank below yourself. No admin promoting other to admin for example.
    result.canBePromoted = modifierRank >= ranks.MODERATOR &&
        modifierRank - 1 > modifieeRank &&
        modifieeRank < ranks.ROOT;
    result.canBeDemoted = modifierRank >= ranks.MODERATOR &&
        modifierRank > modifieeRank &&
        modifieeRank > ranks.MEMBER; //disallow member demotion. Prefer ban.

    return result;
}

module.exports = function(queriesObject, ranksList){
    queries = queriesObject;
    ranks = ranksList;

    module.exports = {
        GetUserModel: GetUserModel,
        ModifyUserModel: ModifyUserModel
    };
    return module.exports;
};