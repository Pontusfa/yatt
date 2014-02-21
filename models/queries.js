/**
 * Handling all queries to the persistence layer.
 * @author Pontus Falk
 * @version 0.0.1
 */

var models = require('../lib/db').models,
    _ = require('underscore'),
    crypto = require('crypto');

/**
 * Creates a hash of user's password and replaces password with hash.
 * @param user an object containing the user, at least user.username and user.password
 * @param salt a desired salt to be used for the hash, leave null to generate a random salt
 * @param callback function(error) to run after hash has been calculated and replaced user.password
 * @private
 */
function createHash(user, salt, callback){
    var iterations = 10000,
        keylength = 1024;
    user.salt = salt || crypto.randomBytes(64).toString('base64');
    crypto.pbkdf2(user.password, user.salt, iterations, keylength,
        function(err, hash){
            user.password = hash.toString();
            callback(err);
    });
}

/**
 * Gets the db document for the wanted user.
 * @param criteria the specifics of the user that is searched for
 * @param model String declaring what model to search in
 * @param wantedFields an object with keys wanted to be returned, using {'key': 1, ...}
 * @param callback function(err, foundUser) to handle the results of the search.
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

module.exports.removeUser = function(user, callback){

};

/**
 * Finds *one* user and updates it's document.
 * @param user object with relevant information to find the user, e.g. user.username
 * @param model String declaring what model to search in
 * @param updates object containing the new information to add to it's document.
 * @param callback function(err, foundUser) to handle the result
 */
function updateDocument(user, model, updates, callback){
    console.log(model);
    console.log(models[model]);
    models[model].findOneAndUpdate(user, updates, null, callback);
}

module.exports.createHash = createHash;
module.exports.getDocument = getDocument;
module.exports.addUser = addUser;
module.exports.updateDocument = updateDocument;