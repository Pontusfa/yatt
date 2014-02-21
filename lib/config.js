/**
 * @author Pontus Falk
 * @version 0.0.1
 *
 *This module sets up the config object according
 *to the file specified via the config flag, or
 *fall backs to defaults.json.
 */

var fs = require('fs'),
    args = require('optimist').argv,
    configFile = args.config,
    logger = require('winston'), //temporary logger to make sure we can parse the config files properly.
    defaultsFile = './defaultConfig.json',
    _ = require('underscore'),
    configuration = {};

/**
 * Reads the file and parses its JSON content.
 * @returns conf An object with zero or more settings.
 * @private
 */
function _parseConfigFile(filePath) {
    var conf = {};
    if (!_.isString(filePath) || !fs.existsSync(filePath)) {
        logger.warn('Couldn\'t find config file %s', filePath);
        return conf;
    }

    try {
        conf = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    catch (err) {
        logger.warn('Couldn\'t parse config file %s', filePath);
        return {};
    }

    return conf;
}

/**
 * Constructs the config object, exits if no configs can be found.
 * @returns conf The complete config object
 * @private
 */
function _constructConfig() {
    if (configFile) {
        _.extend(configuration, _parseConfigFile(configFile));
    }
    if (defaultsFile) {
        _.extend(configuration, _parseConfigFile(defaultsFile));
    }

    if (!_.isObject(configuration)){
        logger.error('Couldn\'t create a config object. Exiting.');
        _.defer(function () {
            process.exit(1);
        });
    }
}

// Configure me!
_constructConfig();
module.exports = configuration;