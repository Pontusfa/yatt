/**
 *  Installs all present languages  in the process.cwd()/languages/ directory
 *  Homebrewn I18N because... ? 
 */
var languages = {},
    navbars = {},
    navBarOrder = {},
    _ = require('underscore');

/**
 * Attaches the language object needed for the template at the
 * requested page. Fallbacks to site's default language choice.
 * @param app
 */
function installLanguages(app) {
    _parseLanguages(app);

    app.use(function (req, res, next) {
        req.session.language = req.session.language || app.config.site.defaultLanguage;
        res.locals.language = req.session.language;

        if (_.isObject(languages[res.locals.language])) {
            res.locals.lang = languages[res.locals.language][req.path.slice(1)]; //remove prefix /
            next();
        }
        else {
            req.session.language = app.config.site.defaultLanguage;
            res.send('<h1>No language support yet :('); //TODO: well...
        }
    });

    navBarOrder = app.config.site.navbarOrder;
    app.use(_navBarList);
    app.use(_alert);

    app.logger.info('Internationalization setup.');

}

/**
 * Goes through all languages found in the directory and parse them
 * into JSON for use in the templates.
 * @param app
 * @private
 */
function _parseLanguages(app) {
    var fs = require('fs'),
        languagesPath = process.cwd() + '/languages/',
        languagesFiles = null;

    try {
        languagesFiles = fs.readdirSync(languagesPath);
    }
    catch (err) {
        app.logger.warn(err.message + '. Fix language directory. Exiting.');
        process.exit(1);
    }

    languagesFiles = _.filter(languagesFiles, function (obj) {
        return  _.isString(obj) &&
            obj.length >= 6 &&
            obj.slice(-5) === '.json';
    });

    languagesFiles.forEach(function (language) {
        try {
            languages[language.substring(0, 2)] =         //only interested in 'en', 'se' et cetera
                JSON.parse(fs.readFileSync(languagesPath + '/' + language, 'utf8'));
            navbars[language.substring(0, 2)] = navbars[language.substring(0, 2)] || {};
        }
        catch (err) {
            app.logger.warn(err.message + '. Language ' + language + ' not installed');
        }
    });
}

/**
 * Pairs  user's allowed pages with their corresponding translation to form the navbar list.
 * @private
 */
function _navBarList(req, res, next) {
    var session = req.session,
        user = session.user;

    if (!navbars[session.language] || !navbars[session.language][user.rank]) {
        _createNavbarLists(session.language, user.rank, user.allowedPages);
    }
    res.locals.navbarList = navbars[session.language][session.user.rank];

    next();
}

/**
 * @private
 */
function _createNavbarLists(language, rank, allowedPages) {
    navbars[language] = navbars[language] || [];
    navbars[language][rank] = navbars[language][rank] || {middle: [], right: []};

    _.forEach(navBarOrder, function (pages, side) {
        _.forEach(pages, function (page) {
            if (_.contains(allowedPages, page)) {
                var pageTitle = languages[language][page].title;

                navbars[language][rank][side].push({link: page, title: pageTitle});
            }
        });
    });
}

/**
 * Relay alerts between different pages.
 * @private
 */
function _alert(req, res, next) {
    if (req.session.alert) {
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
function getAdditionalLanguageField(field) {
    var result = {};

    _.forEach(languages, function (language, languageName) {
        result[languageName] = language[field];
    });
    return result;
}

module.exports.installLanguages = installLanguages;
module.exports.getAdditionalLanguageField = getAdditionalLanguageField;
