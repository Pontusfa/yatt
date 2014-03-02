/**
 * Setting up routes using all the controllers found in ../controllers/
 * Requires module.exports.setup in all controller files that sets up the wanted routes.
 * @author Pontus Falk
 */

/**
 * A function to inject to each controller to easily compile jade templates at startup.
 */
function _compileTemplate(app, pagePath){
    // if we're developing, it will be nice to change jade template and see its changes
    // by refreshing page w/o restarting the app
    if(app.settings.env === 'development'){
        return function(templateFile){
            var fullPath = process.cwd() + '/' + 'pages/' + pagePath + '/' + templateFile;
            return function(locals){
                var newLocals = {pretty: true};
                Object.keys(locals).forEach(function(key){
                    if(locals.hasOwnProperty(key)){
                        newLocals[key] = locals[key];
                    }
                });
                console.log(newLocals);
                return require('jade').renderFile(fullPath, newLocals);
            };

        };
    }
    //else we'll precompile each template to make for quicker serving requests
    else{
        return function(templateFile){
            var fullPath = process.cwd() + '/' + 'pages/' + pagePath + '/' + templateFile,
                fs = require('fs'),
                template = fs.readFileSync(fullPath);
            return require('jade').compile(template);
        };
    }
}


/**
 * Install controllers.
 * @param app The express app to install controllers to.
 */
function installRoutes(app){
    var pages = null,
        controller = null,
		fs = require('fs'),
        pagesPath = process.cwd() + '/pages/';

    try{
        pages = fs.readdirSync(pagesPath);
    }
    catch(err){
        app.logger.error(err + '. Exiting.');
        process.exit(1);
    }

    pages.forEach(function (currentPagePath){
        try {
            controller = require(pagesPath + currentPagePath + '/' + currentPagePath + 'Controller');

            if(controller.setup(app, _compileTemplate(app, currentPagePath))){
                app.logger.info( currentPagePath + ' routing setup.');
            }
            else{
                app.logger.warn('Couldn\'t setup route ' + currentPagePath + '.');
            }
        }
        catch (err){
            app.logger.warn('Couldn\'t setup route in ' + currentPagePath + ' (' + err + '). Ignoring.');
        }
    });
}

module.exports = function(app){
	installRoutes(app);
};
