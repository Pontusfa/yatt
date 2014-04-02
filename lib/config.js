/**
 * @author Pontus Falk
 *This module sets up the config object according
 *to the file specified via the config flag, or
 *fall backs to defaults.json.
 */

var fs = require('fs'),
    _ = require('underscore'),
    configuration = {};

/**
 * Constructs the config object, exits if no configs can be found.
 * @returns conf The complete config object
 * @private
 */
function _constructConfig(){
    var configFile = './config.json';

    if (_.isString(configFile) && !_.isEmpty(configFile)){
        _parseConfigFile(configFile);
    }
    if (!_.isObject(configuration) || _.isEmpty(configuration)){
        console.error('Couldn\'t create a config object. Exiting.');
        process.exit(1);
    }
}

/**
 * Reads the file and parses its JSON content.
 * @returns conf An object with zero or more settings.
 * @private
 */
function _parseConfigFile(filePath) {
    var logger = require('winston'); //temporary logger to make sure we can parse the config files properly.

    if (!_.isString(filePath) || !fs.existsSync(filePath)) {
        logger.warn('Couldn\'t find config file %s', filePath);
        return;
    }

    try {
        configuration = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    catch (err) {
        logger.warn('Couldn\'t parse config file %s. ' + err.message, filePath);
        configuration = {};
    }
}

// Configure me!
module.exports = function(){
	_constructConfig();
	module.exports = configuration;
	return module.exports;
};
