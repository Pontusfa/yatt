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
            setTimeout(function () {
                process.exit(1);
            }, 10);
        }

    controllers.forEach(function (controllerFile) {
        try {
            controller = require(controllersPath + controllerFile);
            success = controller.setup(app);

            if (success) {
                logger.info( controllerFile + ' routing setup.');
            }
            else {
                logger.warn('Couldn\'t setup route ' + controllerFile + '.');
            }
        }
        catch (err) {
            logger.warn('Couldn\'t setup route, ' + err + '. Ignoring.');
        }
    });
}

module.exports.installRoutes = installRoutes;