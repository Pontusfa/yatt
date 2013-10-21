/**
 * Gives an instance for the winston logger with sane settings.
 * @author Pontus Falk
 * @version 0.0.1
 */
//TODO add wrapper methods to logger object to allow a more implementation agnostic logging.
// (Like wiring logger methods to console outputs.)

var winston = require('winston'),
    fs = require('fs'),
    config = require('./config').conf,
    path = require('path'),
    logPath = path.join(__dirname, config.uses.logFile),
    logger = null;

/**
 * Creates a logger using the winston implementation.
 * @private
 */
function _initWinston(){
    if(!fs.existsSync(logPath)){
        fs.openSync(logPath, 'w');
    }

    logger = new (winston.Logger)({
        transports: [
            new (winston.transports.File)({ filename: logPath })
        ]
    });

    if(config.uses.logToConsole){
        logger.add(winston.transports.Console, {colorize: true});
    }
}

/**
 * Initializes a logger if one is provided from the config and
 * is supported in this file.
 * If everything else fails, logger fall backs to console output.
 * @private
 */
function _initLogger(){
    if(config.uses.logger && config.uses.logger === 'winston'){
        _initWinston();
    }
    else{
        // Do your own personalized logger here. Using stdout if nothing else.
        // App assumes info, warn and error methods for logging. Please comply.
        logger = {};
        logger.info = console.log;
        logger.warn = console.warn;
        logger.error = console.error;
        logger.warn('No logger found, falling back to console');
    }

    if(logger){
        logger.info('Logger setup.');
    }
    else{
        console.log('Couldn\'t setup a logger. Check your configuration.');
        setTimeout(function(){process.exit(1);}, 10);
    }
}


// Get us a logger, logger!
_initLogger();
module.exports.logger = logger;