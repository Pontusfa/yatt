/**
 * Handling the database access
 * @author Pontus Falk
 */

var connection = null,
    models = {};

/**
 * sets up a connection to the mongoDB specified in the config object.
 * @private
 */
function _connectMongoose(config, logger) {
    var connectionConfig = config.uses.db,
        uri = connectionConfig.host + ':' + connectionConfig.port + '/' + connectionConfig.database,
        options = {
            user: connectionConfig.user,
            pass: connectionConfig.pass,
            server: {
                poolSize: connectionConfig.pool
            }
        },
        db = require('mongoose');

    connection = db.connect(uri, options).connection;
    connection.once('connected', function () {
        logger.info('Database connected.');
        _initModels(config, db);
    });

    //TODO better error handling. Retry before exiting?
    connection.on('error', function (err) {
        logger.error('Error with the database connection( ' + err + ' ). Exiting.');
        process.exit(1);
    });
}

/**
 * Sets up the database's models needed to store relevant data for the app.
 * TODO: adjust no. indices?
 * @private
 */
function _initModels(config, db){
    var UserSchema = db.Schema({
            username: {type: String, index: true, unique: true},
            password: String,
            salt: String,
            email: {type: String,unique: true},
            active: {type: Boolean, default: true}, //TODO: false + send mail
            banned: {type: Boolean, default: false},
            passkey: {type: String, index: true, default: -1},
            rank: {type: Number, default: config.site.ranks.MEMBER},
            created: {type: Date, default: Date.now},
            downloaded: {type: Number, default: 0},
            uploaded: {type: Number, default: 0}
        }),

        torrentSchema = db.Schema({
            title: {type: String, index: true},
            description: String,
            tags: {type: [String], index: true},
            category: {type: String, index: true},
            infoLink: String,
            created: {type: Date, default: Date.now()},
            seeders: {type: Number, index: true, default: 0},
            leechers: {type: Number, index: true, default: 0},
            uploader: String,
            size: String,
            meta: Object
        }),

        requestSchema = db.Schema({
            title: {type: String, index: true},
            infoLink: String,
            created: {type: Date, index: true, default: Date.now()},
            requester: String
        }),

        newsSchema = db.Schema({
            title: String,
            text: String,
            created: {type: Date, default: Date.now}
        });



    models.user = db.model('user', UserSchema);
    models.torrent = db.model('torrent', torrentSchema);
    models.news = db.model('news', newsSchema);
    models.request = db.model('request', requestSchema);
}


module.exports = function(app){
    var logger = app.logger,
        config = app.config,
        connection = null;

    _connectMongoose(config, logger);
    logger.info('Database connection setup.');

    module.exports = {};
    module.exports.connection = connection;
    module.exports.models = models;
    return module.exports;
};
