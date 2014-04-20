/**
 * Setting up routes using all the controllers found in ../controllers/
 * Requires module.exports.setup in all controller files that sets up the wanted routes.
 */

var pageRanks = [];

/**
 * Install controllers.
 * @param app The express app to install controllers to.
 */
function installRoutes(app){
    var pages = null,
    _ = require('underscore'),
    controller = null,
    fs = require('fs'),
    jadeCompiler = require('./jadeCompiler')(app.settings.env),
    
    pagesPath = process.cwd() + '/src/pages/';
    
    try{
        pages = fs.readdirSync(pagesPath);
    }
    catch(err){
        app.logger.error(err + '. Exiting.');
        process.exit(1);
    }

    pages.forEach(function (currentPagePath){
        var pageRank = null;
        
        try {
            controller = require(pagesPath + currentPagePath +
                                 '/' + currentPagePath + 'Controller');
            pageRank = controller.setup(app, jadeCompiler(app, currentPagePath));

            if(_.isNumber(pageRank)){
                pageRanks[pageRank] = pageRanks[pageRank] || [];
                pageRanks[pageRank].push('/' + currentPagePath.toLowerCase());
                
                app.logger.info( currentPagePath + ' routing setup.');
            }
            else{
                app.logger.warn('Couldn\'t setup route ' + currentPagePath + '. No page rank given. Ignoring.');
            }
        }
        catch (err){
            app.logger.warn('Couldn\'t setup route in ' + currentPagePath + ' (' + err + '). Ignoring.');
        }
    });
}

module.exports = function(app){
    installRoutes(app);
    module.exports = {pageRanks: pageRanks};
    
    return module.exports;
};
