/**
 * Gives an instance for the winston logger with sane settings.
 */

var winston = require('winston'),
    logger = null;

/**
 * Initializes a Winston logger.
 */
function _initLogger(config){
    var _ = require('underscore');
    _initWinston(config);

    if(_.isObject(logger)){
        logger.info('Logger setup.');
    }
    else{
        console.log('Couldn\'t setup a logger. Check your configuration.');
        process.exit(1);
    }
}


/**
 * @private
 */
function _initWinston(config) {
	var fs = require('fs'),
		path = require('path'),
		logPath = path.join(process.cwd() + '/' + config.setters.logFile);

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

module.exports = function(app){
	_initLogger(app.config);
	module.exports = logger;
	return logger;
};
