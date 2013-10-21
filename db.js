/**
 * Abstraction of database connection to allow for plugging in
 * various databases.
 * @author Pontus Falk
 * @version 0.0.1
 */
//TODO add wrapper methods to connection object to make it db implementation agnostic.

var logger = require('./logger').logger,
    db = null,
    connection = null,
    uri = null,
    options = null,
    DBConfig = require('./config').conf.uses.db,
    connectionConfig = DBConfig.connection;

/**
 * sets up a connection to the mongoDB specified in the config object.
 * @private
 */
function _connectMongoose(){
    uri = connectionConfig.host + ':' + connectionConfig.port + '/' + connectionConfig.database;
    options = {
        user: connectionConfig.user,
        pass: connectionConfig.pass,
        server: {
            poolSize: connectionConfig.pool
        }
    };

    db = require('mongoose');
    connection = db.createConnection(uri, options);
    connection.once('connected', function(){
        logger.info('Database connected.');
    });

    //TODO better error handling. Retry before exiting?
    connection.on('error', function(err){
        logger.error('Error with the database connection( ' + err + ' ). Exiting.');
        setTimeout(function(){process.exit(1);}, 10);
    });
}

/**
 * Connects to the db specified in the config object, if that db type
 * is supported here.
 * @private
 */
function _connectDB(){
    if(DBConfig.dbs === 'mongoose'){
        _connectMongoose();
    }
    else{
        logger.error('No support for your chosen database. Fix that. Exiting.');
        setTimeout(function(){process.exit(1);}, 10);
    }
}

// Lets get some persistence up in this here house!
_connectDB();
module.exports.connection = connection;