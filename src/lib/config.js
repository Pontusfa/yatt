/**
 *This module sets up the config object according
 *to the file config.json
 */

var fs = require('fs'),
    configuration = {};

/**
 * Constructs the config object, exits if config can't be found or parsed.
 * @private
 */
function _constructConfig() {
    var configFile = './config.json',
        logger = require('winston'); //temporary logger to make sure we can parse the config files properly.

    if (!fs.existsSync(configFile)) {
        logger.error('Couldn\'t find config file %s', configFile + '. Exiting.');
        process.exit(1);
    }

    try {
        configuration = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    }
    catch(err) {
        logger.error('Couldn\'t parse config file ' + configFile + ' : ' + err.message + '. Exiting.');
        process.exit(1);
    }
}

module.exports = function() {
    _constructConfig();
    module.exports = configuration;
    return module.exports;
};
