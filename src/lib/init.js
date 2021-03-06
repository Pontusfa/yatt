/**
 * Installs middleware, routes and configures the app object.
 */

var express = require('express'),
    app = express(),
    _ = require('underscore'),
    Busboy = require('busboy'),
    server = null,
    httpsServer = null;

/**
 * Calling all the needed init functions in the desired order
 * to properly setup the app object.
 * @private
 */
function _initApp() {
    app.config = require('./config')();
    app.logger = require('./logger')(app);
    require('./db')(app);
    app.queries = require('./queries')();
    app.modifyUser = require('./modifyUser')(app);

    _initSettings();
    _initMiddleware();
    _initRoutes();

    process.on('SIGTERM', _tearDown);
    process.on('SIGINT', _tearDown);

    app.logger.info('App setup.');
}

/**
 * Populates the app object with various important settings needed.
 * @private
 */
function _initSettings() {
    // Using sane values if config is being naughty.
    app.use(express.static(process.cwd() + '/public/'));
    app.set('port', app.config.setters.port || 8080);
    app.set('https port', app.config.setters['https port'] || 8443);
    app.set('env', app.config.setters.env || 'development');
    app.set('pretty', app.config.setters.pretty || 'true');
    app.logger.info('Settings setup.');
}

/**
 * Initializing all the middleware we want every request to the app
 * to pass through before finally arriving at a route handler.
 * @private
 */
function _initMiddleware() {

    app.use(express.compress()); //TODO: research compression
    app.use(app.config.site.favicon || express.favicon());
    app.use(express.urlencoded()); //TODO: Why?
    app.use(express.json());

    _initHttps();
    _initParseMultiForm();
    _initSession();

    app.use(function (req, res, next) {
        res.locals = res.locals || {};
        res.locals.url = req.originalUrl;  // used in templating, action=url
        res.locals.path = req.path.slice(1); //used for css fetching in dev environments

        next();
    });

    _initCsrfProtection();
    require('helmet')(app);
    require('./authorization').installAuthorization(app);
    require('./internationalization').installLanguages(app);

    app.use(app.router);

    //TODO proper error handling.
    if (_.isEqual(app.get('env'), 'development')) {
        app.use(express.errorHandler());
    }
    else {
        app.use(function (err, req, res) {
            res.send(err.message + ', how awkward.');
        });
    }
    app.logger.info('Middleware setup.');
}

/**
 * Create a https server if app.config.uses.https is set to true.
 * If app.config.uses['https only'] is true, a middleware is installed to redirect all
 * http request to its https counter-part.
 * @private
 */
function _initHttps() {
    if (!app.config.uses.https) {
        return;
    }

    var fs = require('fs'),
        https = require('https'),
        privateKey = null,
        certificate = null,
        credentials = null;

    try {
        privateKey =
            fs.readFileSync(app.config.setters.certPath + 'server.key', 'utf8');
        certificate =
            fs.readFileSync(app.config.setters.certPath + 'server.crt', 'utf8');
        credentials = {key: privateKey, cert: certificate};

        httpsServer =
            https.createServer(credentials, app).listen(app.get('https port'));
    }
    catch (err) {
        if (err) {
            app.logger.error(err + '. No https. Exiting.');
            process.exit(1);
        }
    }

    if (app.config.uses['https only']) {
        app.use(function (req, res, next) {
            if (_.isEqual(req.protocol, 'http')) {
                res.redirect('https://' + req.host + ':' + (app.get('https port')) + req.originalUrl);
            }
            else {
                next();
            }
        });
    }
}

/**
 * Parses a multiform post to put file into req.body.file and fields to req.body.fieldName.
 * TODO: Set a max limit to file size, or a user can fill up the memory.
 * @private
 */
function _initParseMultiForm() {
    app.use(function (req, res, next) {
        var busboy = null;

        if (req.is('multipart/form-data')) {
            busboy = new Busboy({immediate: true, headers: req.headers});
            req.body = req.body || {};
            req.file = req.file || {};
            req.file.receivedData = 0;
            req.file.data = new Buffer(parseInt(req.headers['content-length'])); //not all content is file, slice after

            busboy.on('file', function (fieldName, file, fileName) {
                req.file.name = fileName;

                file.on('data', function (data) {
                    data.copy(req.file.data, req.file.receivedData);
                    req.file.receivedData += data.length;
                });
            });

            busboy.on('field', function (fieldName, value) {
                req.body[fieldName] = value;
            });

            busboy.on('finish', function () {
                req.file.data = req.file.data.slice(0, req.file.receivedData);
                next();
            });
            req.pipe(busboy); //TODO: pipe = ?
        }
        else {
            next();
        }
    });
}

/**
 * Setup how we want to keep track of our users to verify their identity.
 * @private
 */
function _initSession() {
    var cookieSettings = {
            httpOnly: true,
            signed: true,
            secure: app.config.uses['https only'],
            maxAge: false
        },
        MongoStore = require('connect-mongo')(express),
        connectionConfig = app.config.uses.db,
        mongoUri = 'mongodb://' +
            connectionConfig.user + ':' +
            connectionConfig.pass + '@' +
            connectionConfig.host + ':' +
            connectionConfig.port + '/' +
            connectionConfig.database + '/sessions',
        mongoStore = new MongoStore({url: mongoUri, auto_reconnect: true}); // jshint ignore:line

    app.use(express.session({
        proxy: app.config.uses.proxy,
        cookie: cookieSettings,
        secret: app.config.setters.cookieSecret,
        store: mongoStore
    }));

    // If the request is from a logged in user, mark him as online.
    app.use(function(req, res, next){
        if(req.session && req.session.user && req.session.user.username) {
            app.queries.updateDocument(
                {username: req.session.user.username},
                app.queries.ONLINEMODEL,
                {createdAt: Date.now()},
                next);
        }
        else {
            next();
        }
    });

    app.logger.info('Session setup.');
}

/**
 *  Setups csrf checking, enables locals.csrf that must be attached to all forms.
 *  TODO: Possible to automate more? Need to do it every request?
 * @private
 */
function _initCsrfProtection() {
    app.use(express.csrf());

    app.use(function (req, res, next) {
        res.locals = res.locals || {};
        res.locals.token = req.csrfToken();
        res.locals.csrf = ' <input name="_csrf" type="hidden" value="' + res.locals.token + '" />';
        next();
    });
}

/**
 * Route the user to where we want him.
 * @private
 */
function _initRoutes() {
    var pageRanks = require('./routing')(app);
    require('./authorization').setPageRanks(pageRanks);
    app.logger.info('All routing setup.');
}

/**
 * Called when user sends sigint/sigterm, or the app is failing such that recovery is impossible.
 * @private
 */
function _tearDown() {
    app.logger.info('Terminate/interrupt/exit received, shutting down.');

    if (!_.isNull(require('./db').connection)) {
        require('./db').connection.close();
        app.logger.info('Database connection shutdown.');
    }

    if (!_.isNull(server)) {
        server.close();
        server = null;
        app.logger.info('HTTP Server shutdown.');
    }

    if (!_.isNull(httpsServer)) {
        httpsServer.close();
        httpsServer = null;
        app.logger.info('HTTPS server shutdown.');
    }

    app.logger.info('Bye.');
    process.exit(0);

}

/**
 * Initializes and starts the app.
 */
function startup() {
    _initApp();

    // TODO: 1024 backlog research
    server = app.listen(app.get('port'), 1024, function () {
        app.logger.info('listening for HTTP on port ' + app.get('port') + '.');
    });

    if (app.config.uses.https) {
        httpsServer.listen(app.get('https port'), 1024, function () {
            app.logger.info('listening for HTTPS on port ' +
                app.get('https port') + '.');
        });
    }
}

module.exports = startup;
