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
 * @private
 */
function _initModels(config, db){
    var UserSchema = db.Schema({
        username: {type: String, index: true, unique: true},
        password: String,
        salt: String,
        email: {type: String,unique: true},
        active: {type: Boolean, default: true},
        banned: {type: Boolean, default: false},
        passkey: {type: String, index: true, default: -1},
        registrationToken: String,
        rank: {type: String, default: config.site.ranks.MEMBER},
        created: {type: Date, default: Date.now}
    }),
    
        torrentSchema = db.Schema({
            name: {type: String, index: true},
            ident: {type: String, index: true, unique: true},
            seeders: {type: Number, index: true, default: 0},
            leechers: {type: Number, index: true, default: 0},
            meta: Object
        }),

        newsSchema = db.Schema({
            title: String,
            text: String,
            created: {type: Date, default: Date.now}
        });


    
    models.user = db.model('user', UserSchema);
    models.torrent = db.model('torrent', torrentSchema);
    models.news = db.model('news', newsSchema);
}

/**
 *
 * @param app
 */
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
