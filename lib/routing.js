/**
 * Setting up routes using all the controllers found in ../controllers/
 * Requires module.exports.setup in all controller files that sets up the wanted routes.
 * @author Pontus Falk
 */

var fs = require('fs'),
    logger = require('./logger'),
    path = require('path'),
    _ = require('underscore'),
    success = false,
    controllersPath = path.join(__dirname, '../controllers/'),
    controllers = [],
    controller = null;

/**
 * Install controllers.
 * @param app The express app to install controllers to.
 */
function installRoutes(app){
    try{
        controllers = fs.readdirSync(controllersPath);
    }
    catch(err){
            logger.error(err + '. Exiting.');
            _.defer(function () {
                process.exit(1);
            });
        }

    controllers.forEach(function (controllerFile){
        try {
            controller = require(controllersPath + controllerFile);
            success = controller.setup(app);

            if(success){
                logger.info( controllerFile + ' routing setup.');
            }
            else{
                logger.warn('Couldn\'t setup route ' + controllerFile + '.');
            }
        }
        catch (err){
            logger.warn('Couldn\'t setup route in ' + controllerFile + ' (' + err + '). Ignoring.');
        }
    });
}

module.exports = installRoutes;