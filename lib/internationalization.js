/**
 *  Installs all present languages  in the process.cwd()/languages/ directory
 */
var languages = null,
_ = require('underscore');

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
            obj.length >= 3  &&
            _.isEqual(obj.slice(-3), '.js');
    });
    
    languages = {};
    
    languagesFiles.forEach(function(language){
        try{
            languages[language.substring(0,2)] = //only interested in 'en', 'se' etc
                JSON.parse(fs.readFileSync(languagesPath + '/' + language, 'utf8'));
            }
        catch(err){
            if(err){
                app.logger.warn(err.message + '. Language ' + language + ' not installed');
            }
        }       
    });
}

/**
 * Used to relay alerts between different pages.
 * Successful registration at /login is a prime example.
 */
function _createAlert(session, locals){
    if(_.isObject(session.alert)){
        locals[session.alert.type] = session.alert.message;
        session.alert = null;
    }
}

/**
 * Pairs  user's allowed pages with their corresponding translation to form the navbar list.
 * TODO: factor out?
 */
function _createNavbarList(allowedPages, navbarOrder, languagesObject, currentPage){
    var bar = {middle: [], right: []};  

    _.forEach(navbarOrder,function(pages, side){
        _.forEach(pages, function(page){
            if(_.contains(allowedPages,page)){
                var pageTitle = languagesObject[page.slice(1)].title,
                    location = currentPage === page ? 'location' : '';
                bar[side].push({link:page, title: pageTitle, active: location});
            }
        });
    });
    
    return bar;
}

/**
 * Attaches the language object needed for the template at the
 * requested page. Fallbacks to site's default language choice.
 * @param app
 */
function installLanguages(app){
    _parseLanguages(app);
    
    app.use(function(req,res, next){
        req.session = req.session ||  {};
        req.session.language = req.session.language || app.config.site.defaultLanguage;
        res.locals = res.locals || {};
        res.locals.language = req.session.language;
        
        if(_.isObject(languages[res.locals.language])){
            res.locals.lang = languages[res.locals.language][req.path.slice(1)]; //remove prefix /
            res.locals.navbarList = _createNavbarList(req.session.user.allowedPages,
                                                      app.config.site.navbarOrder,
                                                      languages[res.locals.language],
                                                     req.path);
            _createAlert(req.session, res.locals);
            
            next();
        }
        else{
            req.session.language = app.config.site.defaultLanguage;
            res.send('<h1>No language support yet :(');
        }
    });
}

module.exports = installLanguages;
