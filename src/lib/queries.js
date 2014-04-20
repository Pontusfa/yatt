/**
 * Handling all queries to the persistence layer.
 */

var models = null,
    _ = require('underscore');

/**
 * Creates a hash of user's password and replaces password with hash.
 * @param user an object containing the user, at least user.username and user.password
 * @param salt a desired salt to be used for the hash, leave null to generate a random salt
 * @param callback function(error) to run after hash has been calculated and replaced user.password
 * @private
 */
var createHash = function(){
    var crypto = require('crypto'),
        iterations = 10000,
        bytesLength = 64,
        base = 'base64',
        keylength = 1024;

    return function(user, salt, callback){
    
        user.salt = salt || crypto.randomBytes(bytesLength).toString(base);

        crypto.pbkdf2(user.password, user.salt, iterations, keylength,
            function(err, hash){
                user.password = hash.toString();
                callback(err);
        });
    };
}();

/**
 * Gets db document(s) for the wanted document.
 * @param criteria the specifics of the document that is searched for
 * @param model String declaring what model to search in
 * @param sort field(s) to sort the query results by
 * @param offset number of documents to skip ahead
 * @param limit the number of documents to return at most
 * @param wantedFields an object with keys wanted to be returned, using {'key': 1, ...}
 * @param callback function(err, foundDocument) to handle the results of the search
 */
function getDocuments(criteria, model, sort, offset, limit, wantedFields, callback){
    models[model]
        .find(criteria)
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .select(wantedFields)
        .lean()
        .exec(function(err, result){
            if(_.isObject(result) && limit === 1){ 
                result = result[0]; //unwrap the sole result
            }
            callback(err, result);
        });
}

/**
 * Inserts the user into db.
 * @param user the specifics of the user to be inserted, at least user.username, user.password required
 * @param callback function(err, result) to handle the result of a succesful or failed insertion
 */
function addUser(user, callback){
    var salt = null; //to signal we want a new salt for this user
    
    createHash(user, salt, _addUserCallback(user, callback));
}

function _addUserCallback(user, callback){
    return function(err){
        if(err){
            callback(err, false);
        }
        else{
            models.user.create(user, callback);
        }
    };
}

/**
 * Finds *one* document and updates it's fields.
 * @param user object with relevant information to find the user, e.g. user.username
 * @param model String declaring what model to search in
 * @param updates object containing the new information to add to it's document.
 * @param callback function(err, foundUser) to handle the result
 */
function updateDocument(user, model, updates, callback){
    var options = null;

    models[model].findOneAndUpdate(user, updates, options, callback);
}

/**
 * Adds a document to the database.
 * @param document  an object representing a document suitable for the model
 * @param model the model/db collection to save the document to
 * @param callback function(err, result) to handle success of the addition
 */
function addDocument(document, model, callback){
    models[model].create(document, callback);
}

/**
 * Counts all documents in a collection.
 * @param model the collection model
 * @param criteria optional criteria for the model to count
 * @param callback a function(err, result) handling the results of the query
 */
function countCollection(criteria, model, callback){
    if(_.isFunction(model)){ // no criteria given
        model = criteria;
        criteria = {};
    }
    models[model].count(criteria, callback);
}

function removeDocument(document, model, callback){
    models[model].findOneAndRemove(document, callback);
}

module.exports = function(){
    models = require('./db').models;

    module.exports = {};
    module.exports.createHash = createHash;
    module.exports.getDocuments = getDocuments;
    module.exports.addUser = addUser;
    module.exports.updateDocument = updateDocument;
    module.exports.addDocument = addDocument;
    module.exports.countCollection = countCollection;
    module.exports.removeDocument = removeDocument;
    module.exports.TORRENTMODEL = 'torrent';
    module.exports.USERMODEL = 'user';
    module.exports.NEWSMODEL = 'news';
    
    return module.exports;
};
