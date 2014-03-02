/**
 * Handling all queries to the persistence layer.
 * @author Pontus Falk
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
function createHash(user, salt, callback){
    var crypto = require('crypto'),
		iterations = 10000,
        keylength = 1024;
    user.salt = salt || crypto.randomBytes(64).toString('base64');
    crypto.pbkdf2(user.password, user.salt, iterations, keylength,
        function(err, hash){
            user.password = hash.toString();
            callback(err);
    });
}

/**
 * Gets the db document for the wanted document.
 * @param criteria the specifics of the document that is searched for
 * @param model String declaring what model to search in
 * @param wantedFields an object with keys wanted to be returned, using {'key': 1, ...}
 * @param callback function(err, foundDocument) to handle the results of the search.
 */
function getDocument(criteria, model, wantedFields, callback){
    models[model]
        .findOne(criteria)
        .select(wantedFields)
        .lean()
        .exec(callback);
}

/**
 * Inserts the user into db.
 * @param user the specifics of the user to be inserted, at least user.username, user.password required
 * @param callback function(err, result) to handle the result of a succesful or failed insertion.
 */
function addUser(user, callback){
    var salt = null; //to signal we want a new salt for this user
    createHash(user, salt, _addUserCallback(user, callback));  //create a hash for the password
}

function _addUserCallback(user, callback){
    return function(err){
        if(err){
            callback(err, false);
        }
        else{
            models.user.create(user,
                function(err, savedUser){
                    callback(err, _.isObject(savedUser));
                });
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
    models[model].findOneAndUpdate(user, updates, null, callback);
}

/**
 * Adds a torrent file to the database.
 * @param torrent an object representing a torrent file
 * @param callback function(err, result) to handle success of the addition
 */
function addTorrent(torrent, callback){
    models.torrent.create(torrent, function(err, savedTorrent){
        callback(err, _.isObject(savedTorrent));
    });
}

module.exports = function(){
	var db = require('./db');

	models = db.models;

	module.exports = {};
	module.exports.createHash = createHash;
	module.exports.getDocument = getDocument;
	module.exports.addUser = addUser;
	module.exports.updateDocument = updateDocument;
	module.exports.addTorrent = addTorrent;
	module.exports.TORRENTMODEL = 'torrent';
	module.exports.USERMODEL = 'user';
	return module.exports;
};