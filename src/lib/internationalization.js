/**
 *  Installs all present languages  in the process.cwd()/languages/ directory
 */
var languages = null,
    _ = require('underscore');

/**
 * Attaches the language object needed for the template at the
 * requested page. Fallbacks to site's default language choice.
 * @param app
 */
function installLanguages(app){
    _parseLanguages(app);

    app.use(function(req,res, next){
        req.session.language = req.session.language || app.config.site.defaultLanguage;
        res.locals.language = req.session.language;

        if(_.isObject(languages[res.locals.language])){
            res.locals.lang = languages[res.locals.language][req.path.slice(1)]; //remove prefix /
            next();
        }
        else{
            req.session.language = app.config.site.defaultLanguage;
            res.send('<h1>No language support yet :('); //TODO: well...
        }
    });

    app.use(_createNavbarList(app.config.site.navbarOrder));
    app.use(_createAlert);

    app.logger.info('Internationalization setup.');

}

/**
 * Goes through all languages found in the directory and parse them
 * into JSON for use in the templates.
 * @param app
 * @private
 */
function _parseLanguages(app){
    var fs = require('fs'),
        languagesPath =  process.cwd() + '/languages/',
        languagesFiles = null;

    try{
        languagesFiles = fs.readdirSync(languagesPath);
    }
    catch(err){
        app.logger.warn(err.message  + '. Fix language directory. Exiting.');
        process.exit(1);
    }
    
    languagesFiles =  _.filter(languagesFiles, function(obj){
        return  _.isString(obj) &&
            obj.length >= 6  &&
            _.isEqual(obj.slice(-5), '.json');
    });
    
    languages = {};
    
    languagesFiles.forEach(function(language){
        try{
            languages[language.substring(0,2)] = //only interested in 'en', 'se' etc
                JSON.parse(fs.readFileSync(languagesPath + '/' + language, 'utf8'));
            }
        catch(err){
            app.logger.warn(err.message + '. Language ' + language + ' not installed');
        }
    });
}

/**
 * Pairs  user's allowed pages with their corresponding translation to form the navbar list.
 * //TODO: precalculate!
 * @private
 */
function _createNavbarList(navbarOrder){
    return function(req, res, next){
        var bar = {middle: [], right: []},
            allowedPages = req.session.user.allowedPages,
            currentPage = req.path;

        _.forEach(navbarOrder,function(pages, side){
            _.forEach(pages, function(page){
                if(_.contains(allowedPages,page)){
                    var pageTitle = languages[req.session.language][page].title,
                        location = currentPage === page ? 'location' : ''; 
                    bar[side].push({link:page, title: pageTitle, active: location}); //used later to signal we're here
                }
            });
        });
        res.locals.navbarList = bar;
        next();
    };
}

/**
 * Relay alerts between different pages.
 * @private
 */
function _createAlert(req, res, next){
    if(_.isObject(req.session.alert)){
        var alert = req.session.alert;
        res.locals[alert.type] =
            languages[req.session.language][alert.type][alert.message];
        req.session.alert = null;
    }

    next();
}

/**
 * A page may request additional language field as it feels needed.
 * @param field
 */
function getAdditionalLanguageField(field){
    var result = {};

    _.forEach(languages, function(language, languageName){
        result[languageName] = language[field];
    });
    return result;
}

module.exports.installLanguages = installLanguages;
module.exports.getAdditionalLanguageField = getAdditionalLanguageField;
