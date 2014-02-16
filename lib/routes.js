/**
 * Setting up routes using all the controllers found in ../controllers/
 * Requires controller.js script in each folder.
 * Requires module.exports.setup in all controller files that sets up the wanted routes.
 * @author Pontus Falk
 * @version 0.0.1
 */
var fs = require('fs'),
    logger = require('./logger').logger,
    path = require('path'),
    routePaths = [],
    success = false,
    controllersPath = path.join(__dirname, '../controllers/'),   //the path to controllers folder, relative routes.js.
    controllerFile = 'controller',   //the name of the controller script in each folder in controllersPath, no ext.
    controller = null;

/**
 * Install routes.
 * @param app The express app to install routes to.
 */
function installRoutes(app){
    try{
        routePaths = fs.readdirSync(controllersPath);
    }
    catch(err){
            logger.error(err + '. Exiting.');
            setTimeout(function () {
                process.exit(1);
            }, 10);
        }

    logger.info('');
    routePaths.forEach(function (path) {
        try {
            controller = require(controllersPath + path + '/' + controllerFile);
            success = controller.setup(app);

            if (success) {
                logger.info( path + ' routing setup');
            }
            else {
                logger.warn('Couldn\'t setup route ' + path);
            }
        }
        catch (err) {
            logger.warn(err + '. Ignoring.');
        }
    });

    logger.info('');
}

module.exports.installRoutes = installRoutes;