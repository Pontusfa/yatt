/**
 * Handling the database access
 * @author Pontus Falk
 */

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
                passkey: {type: String, index: true, default: -1},
                privilege: {type: String, default: config.site.ranks[0]},
            created: {type: Date, default: Date.now}
            }
        ),
        torrentSchema = db.Schema({
            name: {type: String, index: true},
            ident: {type: String, index: true, unique: true},
            seeders: {type: Number, index: true, default: 0},
            leechers: {type: Number, index: true, default: 0},
            meta: Object
        });

    models.user = db.model('user', UserSchema);
    models.torrent = db.model('torrent', torrentSchema);
}

// Lets get some persistence up in this here house!
_connectMongoose();

module.exports.connection = connection;
module.exports.models = models;
