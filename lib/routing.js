 /**
 * Setting up routes using all the controllers found in ../controllers/
 * Requires module.exports.setup in all controller files that sets up the wanted routes.
 * @author Pontus Falk
 */

/**
 * A function to inject to each controller to easily compile jade templates at startup.
 */

var languages = null,
    _ = require('underscore'),
    pagesRank = null;

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
            return function(locals, language){
                var newLocals = {pretty: app.settings.pretty};
                locals = locals || {};
                // TODO: why won't the old locals work? some fn in it screwing
                Object.keys(locals).forEach(function(key){
                    if(locals.hasOwnProperty(key)){
                        newLocals[key] = locals[key];
                    }
                });
                newLocals.language = language,
                newLocals.lang = languages[language][templateName];
                if(_.isEmpty(newLocals.lang)){
                    return '<html><p>No translation in ' + language  + '!</p></html>';
                }
                else{
                    return jade.renderFile(fullPath, newLocals);
                }
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
            return function(locals, language){
                var newLocals = {pretty: app.settings.pretty};
                locals = locals || {};
                // TODO: why won't the old locals work? some fn in it screwing
                Object.keys(locals).forEach(function(key){
                    if(locals.hasOwnProperty(key)){
                        newLocals[key] = locals[key];
                    }
                });
                newLocals.language = language,
                newLocals.lang = languages[language][templateName];
                return compiledJade(newLocals);
            };
        };
    }
}

/**
 *  Installs all present languages  in the process.cwd()/languages/ directory
 */
function _installLanguages(app){
    var fs = require('fs'),
        languagesPath =  process.cwd() + '/languages/',
        languagesFiles = null;

    try{
        languagesFiles = fs.readdirSync(languagesPath);
    }
    catch(err){
        if(err){
            app.logger.warn(err.message  + '. Fix language directory. Exiting.');
            process.exit(1);
        }
    }
    
    languages = {};
    
    languagesFiles.forEach(function(language){
        try{
            languages[language.substring(0,2)] = //only interested in 'en', 'se' etc
                JSON.parse(fs.readFileSync(languagesPath + '/' + language, 'utf8'));
            }
        catch(err){
            if(err){
                app.logger.warn(err.message + 'Language ' + language + ' not installed');
            }
        }       
    });
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

    _installLanguages(app);
    
    try{
        pages = fs.readdirSync(pagesPath);
    }
    catch(err){
        app.logger.error(err + '. Exiting.');
        process.exit(1);
    }

    pagesRank = {'/': app.config.site.ranks.ANY}; // A good start. :)
    
    pages.forEach(function (currentPagePath){
        var pageRank = null;
        try {
            controller = require(pagesPath + currentPagePath +
                                 '/' + currentPagePath + 'Controller');
            pageRank = controller.setup(
                app,
                _compileTemplate(app, currentPagePath), languages);
            if(_.isNumber(pageRank)){
                pagesRank['/' + currentPagePath] = pageRank;//solves the verifier req.path
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
    module.exports.pagesRank = pagesRank;
    
    return module.exports;
};
