/**
 *  Installs all present languages  in the process.cwd()/languages/ directory
 */
var languages = null,
        _ = require('underscore');

function _installLanguagesHelper(app){
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
                app.logger.warn(err.message + 'Language ' + language + ' not installed');
            }
        }       
    });
}

function installLanguages(app){
    _installLanguagesHelper(app);
    
    app.use(function(req,res, next){ // internationalize it!
        req.session = req.session ||  {};
        req.session.language = req.session.language || app.config.site.defaultLanguage;
        res.locals = res.locals || {};
        res.locals.language = req.session.language;
        
        if(_.isObject(languages[res.locals.language])){
            res.locals.lang = languages[res.locals.language][req.path.slice(1)]; //remove prefix /
        }
        
        if(_.isEmpty(res.locals.lang)){
            res.send('<h1>No language support yet :(');
        }
        else{
            next();
        }
    });
}

module.exports = installLanguages;
