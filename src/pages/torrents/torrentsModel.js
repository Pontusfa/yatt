var _ = require('underscore'),
queries = null,
limit = 5; //torrents per page

function Model(query){
    this._query = query;
    this._offset = query.offset;
    this._sortBy = {};
    this._criteria = {};
    this._callbacks = {};
}

Model.prototype.registerCallbacks = function(callbacks){
    this._callbacks = callbacks;
    return this;
};

/**
 *
 */
Model.prototype.trimCriteria = function(){
    var tmp = null,
    criteria = this._query.criteria,
    trimmedCriteria = {};

    _.forEach(criteria, function(value, key){ //value is string or array
        tmp = value;
        if(_.isString(tmp)){
            tmp = tmp.trim().
                split(' ');
        } 
        _.forEach(tmp, function(value, index){
            tmp[index] = value.trim();
            if(_.isEmpty(tmp[index])){
                tmp.splice(index, 1);
            }
        });
        
        if(!_.isEmpty(tmp)){
            trimmedCriteria[key] = tmp;
        }
    });
    this._criteria = trimmedCriteria;
    return this;
};

/**
 *
 */
Model.prototype.buildSort = (function(){
    var desc = 1,
    asc = -1;

    return function(){
        var field = this._query.sort || 'created'; //sort by created date by default

        this._sortBy[field] = _.isEqual(this._query.order,'desc') ? desc : asc; //asc by default
        return this;
    };
}());

/**
 * Builds the query criteria to match all query requests
 */
Model.prototype.buildCriteria = function(){
    var newCriteria = [{seeders: {$gt: 0}}], //Show only living torrents by default
    criteria = this._criteria,
    categories = null;

    if(!_.isEmpty(criteria)){
        if(_.isObject(criteria.tags)){
            newCriteria.push({tags: {$all: criteria.tags}}); //all tags present
        }
        if(_.isObject(criteria.title)){
            _.forEach(criteria.title, function(value){
                newCriteria.push({title: {$regex: new RegExp(value, 'i')}}); //all individual words present
            });
        }
        if(_.isObject(criteria.categories)){ // *any* category chosen must be present
            categories = {$or: []};

            _.forEach(criteria.categories, function(category){
                categories.$or.push({category: category});
            });

            newCriteria.push(categories);
        }
        if(_.isEqual(criteria.deadtorrents, ['1'])){
            newCriteria[0] = {}; //removes constraint to only show living torrents
        }
    }
    this._criteria = {$and: newCriteria};
    return this;
};

/**
 * Creates a list of torrents with their relevant information.
 */
Model.prototype.getTorrents = (function(){
    var wantedFields = {title: 1, category: 1, seeders: 1,
                        leechers: 1, tags: 1, size: 1, created: 1, uploader: 1};

    return function(){
        queries.getDocuments(
            this._criteria,
            queries.TORRENTMODEL,
            this._sortBy,
            this._offset,
            limit,
            wantedFields,
            this._getTorrentsCallback.bind(this));
        return this;
    };
}());

/**
 * @private
 */
Model.prototype._getTorrentsCallback = (function(){
    var oneHour = 1000*60*60;

    return function(err, result){
        var alert = null,
        date = null,
        torrents = null;

        if(_.isObject(err)){
            alert = {type: 'error', message: 'failedSearch'};
        }
        else{
            torrents = result;
            date = new Date();

            _.forEach(torrents, function(torrent){
                if(date - torrent.created < oneHour){
                    torrent.new = true;
                }
                torrent.created = new Date(torrent.created).toLocaleDateString();
            });
        }
        this._callbacks.getTorrents(alert, torrents);
    };
}());

/**
 * Determines if there are any torrents before the offset.
 * and/or after the offset + limit
 */
Model.prototype.getPages = function(){
    var offset = this._offset,
    callback = this._callbacks.getPages;

    queries.countCollection(this._criteria, queries.TORRENTMODEL, function(err, count){
        var result = {},
        alert = null;

        if(_.isObject(err)){
            alert = {type: 'error', message: 'databaseFail'};
        }
        else{
            if(offset === 0){ //we're at beginning, no previous
                result.previous = null;
            }
            else{
                result.previous = (offset-limit) > 0 ?
                    offset-limit :
                    0;
            }

            if(offset >= count-limit){
                result.next = null;
            }
            else{
                result.next = offset+limit < count ?
                    offset+limit :
                    count-limit;
            }
        }
        callback(alert, result);
    });
    return this;
};

module.exports = function(queriesObj){
    queries = queriesObj;
    module.exports = Model;
    return module.exports;
};
