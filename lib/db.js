/**
 * Abstraction of database connection to allow for plugging in
 * various databases.
 * @author Pontus Falk
 * @version 0.0.1
 */
//TODO add wrapper methods to connection object to make it db implementation agnostic.

var logger = require('./logger'),
    config = require('./config'),
    _ = require('underscore'),
    db = null,
    connection = null,
    models = {},
    uri = null,
    options = null,
    connectionConfig = config.uses.db;

/**
 * sets up a connection to the mongoDB specified in the config object.
 * @private
 */
function _connectMongoose() {
    uri = connectionConfig.host + ':' + connectionConfig.port + '/' + connectionConfig.database;
    options = {
        user: connectionConfig.user,
        pass: connectionConfig.pass,
        server: {
            poolSize: connectionConfig.pool
        }
    };

    db = require('mongoose');
    connection = db.connect(uri, options).connection;
    connection.once('connected', function () {
        logger.info('Database connected.');
        _initModels();
    });

    //TODO better error handling. Retry before exiting?
    connection.on('error', function (err) {
        logger.error('Error with the database connection( ' + err + ' ). Exiting.');
        _.defer(function () {
            process.exit(1);
        });
    });
}

/**
 * Sets up the database's models needed to store relevant data for the app.
 * @private
 */
function _initModels(){
    var UserSchema = db.Schema({
            username: {type: String, index: true, unique: true},
            password: String,
            salt: String,
            mail: String,
            passkey: {type: String, index: true},
            privilege: {type: String, default: config.site.rank[0]},
            created: {type: Date, default: Date.now}
        }
    );

    models.user = db.model('user', UserSchema);
}

// Lets get some persistence up in this here house!
_connectMongoose();

module.exports.connection = connection;
module.exports.models = models;
