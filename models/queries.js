/**
 * Handling all queries to the persistence layer.
 * @author Pontus Falk
 * @version 0.0.1
 */

var models = require('../lib/db').models,
    crypto = require('crypto');

/**
 * Creates a hash of user's password and replaces password with hash.
 * @param user an object containing the user, at least user.username and user.password
 * @param salt a desired salt to be used for the hash, leave null to generate a random salt.
 * @param callback function(error) to run after hash has been calculated and replaced user.password.
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

function getUser(user, callback){
    models.user
        .findOne({username: user.username})
        .lean()
        .exec(callback);
}

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
            models.user.create(user,  //save the new user
                function(err, savedUser){  //return success to controller
                    callback(err, (typeof savedUser === 'object')); //if user save was successful, it will be sent back
                });
        }
    };
}

module.exports.removeUser = function(user, callback){

};

module.exports.editUser = function(user, callback){

};

module.exports.createHash = createHash;
module.exports.getUser = getUser;
module.exports.addUser = addUser;