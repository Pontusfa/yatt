/**
 * Gives an instance for the winston logger with sane settings.
 * @author Pontus Falk
 */

var winston = require('winston'),
    fs = require('fs'),
    config = require('./config'),
    _ = require('underscore'),
    path = require('path'),
    logPath = path.join(__dirname, '/../' + config.setters.logFile),
    logger = null;

/**
 * @private
 */
function _initWinston() {
    if (!fs.existsSync(logPath)) {
        fs.openSync(logPath, 'w');
    }

    logger = new (winston.Logger)({
        transports: [
            new (winston.transports.File)({ filename: logPath })
        ]
    });

    if (config.setters.logToConsole) {
        logger.add(winston.transports.Console, {colorize: true});
    }
}

/**
 * Initializes a Winston logger.
 */
function _initLogger(){
        _initWinston();

    if(_.isObject(logger)){
        logger.info('Logger setup.');
    }
    else{
        console.log('Couldn\'t setup a logger. Check your configuration.');
        _.defer(function () {
            process.exit(1);
        });
    }
}

// Get us a logger, logger!
_initLogger();
module.exports = logger;