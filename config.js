/**
 * @author Pontus Falk
 * @version 0.0.1
 *
 *This module sets up the config object according
 *to the file specified via the config flag, or
 *fall backs to defaults.json.
 */


//All the required modules and variables needed to properly configure our app.
var fs = require('fs'),
    configFile = require('optimist').argv.config,
    path = require('path'),
    winston = require('winston'), //temporary logger to make sure we can parse the config files properly.
    logger = new (winston.Logger)({
        transports: [
            new (winston.transports.File)({ filename: path.join(__dirname, '/.logs/yatt.log' )})
        ]
    }),
    defaultsFile = 'defaults.json';

/**
 * Reads the file specified and parses it's JSON content.
 * @returns conf An object with zero or more settings.
 * @private
 */
function _getConfig(filePath){
    var conf = {};

    if(!fs.existsSync(filePath)){
        logger.warn('Couldn\'t find config file %s', filePath);
        return conf;
    }

    try{
        conf = JSON.parse(fs.readFileSync(filePath));
    }
    catch(err){
        logger.warn('Couldn\'t parse config file %s', filePath);
        return conf;
    }

    return conf;
}

/**
 * Populates obj1 with all properties in obj2 that isn't in obj1.
 * @param obj1 An object to be augmented.
 * @param obj2 An object to use to augment obj1.
 * @private
 */
function augmentObjects(obj1, obj2){
    for(var i in obj2){
        if(obj2.hasOwnProperty(i) && !obj1.hasOwnProperty(i.hasOwnProperty())){
            obj1.i = obj2.i;
        }
    }
}

/**
 * Constructs the config object, exits if no configs can be found.
 * @returns conf The complete config object
 * @private
 */
function _constructConfig(){
    var conf = {};

    if(configFile){
        augmentObjects(conf, _getConfig(configFile));
    }
    if(defaultsFile){
        augmentObjects(conf, _getConfig(defaultsFile));
    }

    if(Object.keys(conf).length === 0){
        logger.error('Couldn\'t create a config object. Exiting.');
        setTimeout(function(){process.exit(1);}, 10);
    }
    return conf;
}

module.exports = _constructConfig();