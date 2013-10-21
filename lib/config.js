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
    path = require('path'),
    logger = require('winston'), //temporary logger to make sure we can parse the config files properly.
    defaultsFile = './defaultConfig.json',
    configuration = {};

/**
 * Reads the file and parses its JSON content.
 * @returns conf An object with zero or more settings.
 * @private
 */
function _parseConfigFile(filePath){
    var conf = null;
    if(!filePath || !fs.existsSync(filePath)){
        logger.warn('Couldn\'t find config file %s', filePath);
        return {};
    }

    try{
        conf = JSON.parse(fs.readFileSync(filePath));
    }
    catch(err){
        logger.warn('Couldn\'t parse config file %s', filePath);
        return {};
    }

    return conf;
}

/**
 * Populates obj1 with all properties in obj2 that isn't in obj1.
 * @param obj1 An object to be augmented.
 * @param obj2 An object to use to augment obj1.
 * @private
 */
function _augmentObjects(obj1, obj2){
    for(var i in obj2){
        if(obj2.hasOwnProperty(i) && !obj1.hasOwnProperty(i)){
            obj1[i] = obj2[i];
        }
    }
}

/**
 * Constructs the config object, exits if no configs can be found.
 * @returns conf The complete config object
 * @private
 */
function _constructConfig(){
    if(configFile){
        _augmentObjects(configuration, _parseConfigFile(configFile));
    }
    if(defaultsFile){
        _augmentObjects(configuration, _parseConfigFile(defaultsFile));
    }
    // Gotta catch 'em all!
    if(configuration === null ||
        configuration === undefined ||
        typeof configuration !== "object" ||
        configuration.length === 0){

            logger.error('Couldn\'t create a config object. Exiting.');
            setTimeout(function(){process.exit(1);}, 10);
    }
}

// Configure me!
_constructConfig();
module.exports.conf = configuration;
