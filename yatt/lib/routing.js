 /**
 * Setting up routes using all the controllers found in ../controllers/
 * Requires module.exports.setup in all controller files that sets up the wanted routes.
 * @author Pontus Falk
 */

var _ = require('underscore'),
    pageRanks = [];

/**
 * Supplies each controller with a way to  compile jade into html.
 * The inner workings could be  made clearer. TODO
*/
function _compileTemplate(app, pagePath){
    var jade = require('jade');
    // if we're developing, it will be nice to change jade template and see its changes
    // by refreshing page w/o restarting the app
    if(app.settings.env === 'development'){
        return function(templateName){
            var fullPath = process.cwd() +
                '/' + 'pages/' + pagePath + '/' +
                templateName + '.jade';
            return function(locals){
                // TODO: why won't the old locals work? some fn in it screwing
                var newLocals = {pretty: app.settings.pretty};
                locals = locals || {};
                                
                Object.keys(locals).forEach(function(key){
                    if(locals.hasOwnProperty(key)){
                        newLocals[key] = locals[key];
                    }
                });
                return jade.renderFile(fullPath, newLocals);
            };

        };
    }
    //else we'll precompile each template to make for quicker serving requests
    else{
        return function(templateName){
            var fullPath = process.cwd() + '/' +
                'pages/' + pagePath + '/' + templateName + '.jade',
                fs = require('fs'),
                template = fs.readFileSync(fullPath),
                compiledJade = jade.compile(template);
            return function(locals){
                // TODO: why won't the old locals work? some fn in it screwing
                var newLocals = {pretty: app.settings.pretty};
                locals = locals || {};
                Object.keys(locals).forEach(function(key){
                    if(locals.hasOwnProperty(key)){
                        newLocals[key] = locals[key];
                    }
                });
                return compiledJade(newLocals);
            };
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
    
    pageRanks[app.config.site.ranks.ANY] = ['/']; // A good start. :)
    
    pages.forEach(function (currentPagePath){
        var pageRank = null;
        
        try {
            controller = require(pagesPath + currentPagePath +
                                 '/' + currentPagePath + 'Controller');
            pageRank = controller.setup(app, _compileTemplate(app, currentPagePath));
    
            if(_.isNumber(pageRank)){
                pageRanks[pageRank] = pageRanks[pageRank] || [];
                pageRanks[pageRank].push('/' + currentPagePath.toLowerCase());
                
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
    module.exports = {};
    module.exports.pageRanks = pageRanks;
    
    return module.exports;
};
