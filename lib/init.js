/**
 * Installs middleware, routes and configures the app object.
 * @author Pontus Falk
 * @version 0.0.1
 */

var express = require('express'),
    app = express(),
    path = require('path'),
    fs = require('fs'),
    connect = require('connect'),
    serv = null,
    config = require('./config').conf,
    logger = require('./logger').logger,
    https = require('https'),
    httpsServer = null;

/**
 * Calling all the needed init functions in the desired order
 * to properly setup the app object.
 * @private
 */
function _initApp() {
    require('./db'); // We won't need to use the db now, but it is nice to have it connected right away.
    _initSetters();
    _initMiddleware();
    _initStatics();
    _initRoutes();

    process.on('SIGTERM', _tearDown);
    process.on('SIGINT', _tearDown);
    app.tearDown = _tearDown;
    logger.info('App setup.');
}

/**
 * Populates the app object with various important settings needed
 * @private
 */
function _initSetters() {
    // Using sane values if config is being naughty.
    app.set('port', config.setters.port || 8080);
    app.set('view engine', config.setters['view engine'] || 'jade');
    app.set('views', config.setters.views || 'views/');
    app.set('env', config.setters.env || 'development');
    app.locals.pretty = true;
    logger.info('Setters setup.');
}

/**
 * Initializing all the middleware we want every request to the app
 * to pass through before finally arriving at a route handler.
 * @private
 */
function _initMiddleware() {
    app.use(config.uses.favicon || express.favicon());
    app.use(logger);
    app.use(connect.urlencoded());
    app.use(connect.json());

    _initHttps();

    app.use(function(req, res, next){
        res.locals = res.locals || {};
        res.locals.url = req.originalUrl;
        next();
    });

    _initSession();   // Before router.
    _initLoginVerifier();
    app.use(app.router);

    //errors come last
    //TODO proper error handling.
    if (app.get('env') === 'development') {
        app.use(express.errorHandler());
    }
    else {
        logger.error('No error handler is installed for production use, fix now. Exiting.)');
        setTimeout(function () {
            process.exit(1);
        }, 10);
    }
    logger.info('Middleware setup.');
}

/**
 * Informs the app where to find static files such as scripts, stylesheets and images.
 * @private
 */
function _initStatics() {
    if (config.setters['stylesheet engine'] === 'stylus') {
        app.use(require('stylus').middleware(path.join(__dirname, config.uses.static)));
    }
    else {
        logger.info('No css preprocessor configured, using plain css.');
    }
    if (config.uses.static) {
        app.use(express.static(path.join(__dirname, '../' + config.uses.static+'/html/')));
        app.use(express.static(path.join(__dirname, '../' + config.uses.static)));
    }
    logger.info('Statics setup.');
}

/**
 * Route the user to where we want him.
 * @private
 */
function _initRoutes() {
    require('./routing').installRoutes(app);
    logger.info('All routing setup.');
}

/**
 * Setup how we want to keep track of our users to verify their identity.
 * NSA ID verification middleware would be a huge improvement.
 * @private
 */
function _initSession() {
    app.use(express.cookieParser(config.uses.cookieSecret));   // We need cookieParser installed for sessions.
    if (config.uses.sessionStore) {
        //TODO: Setup a proper store for sessions
        logger.warn('Session store not configured, using MemoryStore(bad).');
    }
    app.use(express.session());

    if (config.uses.csrf) {
        app.use(express.csrf()); //   add req.csrfToken() to any POST/PUT/DELETE form for csrf protection.
        app.use(function(req, res, next){
            res.locals = res.locals || {};
            res.locals.token = req.csrfToken();
            //simplifying csrf token input in forms
            res.locals.csrf = ' <input name="_csrf" type="hidden" value="' + res.locals.token + '">';
            next();
        });
    }
    logger.info('Session setup.');
}

/**
 * Install the middleware that verifies the user is logged in to be enabled to view restricted pages.
 * Only installed if config.site.private is set to true.
 * @private
 */
function _initLoginVerifier() {
    if(config.site.private === true){
        app.use(function(req, res, next){
            if(req.session.loggedIn === 1 || config.site.whitelist.indexOf(req.path) > -1){
                next();
            }
            else{
                res.redirect('/login?redirect=' + req.path);
            }
        });
        logger.info('Login verifier setup.');
    }
}

/**
 * Create a https server if config.uses.https is set to true.
 * If config.uses['https only'] is true, a middleware is installed to redirect all
 * http request to its https counter-part.
 * @private
 */
function _initHttps(){
    if(config.uses.https === true){
        var privateKey  = fs.readFileSync('sslcert/server.key', 'utf8'),
            certificate = fs.readFileSync('sslcert/server.crt', 'utf8'),
            credentials = {key: privateKey, cert: certificate};

        httpsServer = https.createServer(credentials, app);
        app.set('https port', config.setters['https port'] || 8443);

        if(config.uses['https only'] === true){
            app.use(function(req, res, next){
               if(req.protocol === 'http'){
                   res.redirect('https://' + req.host + ':' + app.get('https port') + req.path);
               }
                else{
                   next();
               }
            });
        }
    }
}

/**
 * Called when user sends sigint/sigterm, or the app is failing such that recovery is impossible.
 * @private
 */
function _tearDown() {
    logger.info('Terminate/interrupt/exit received, shutting down.');
    require('./db').connection.close();
    logger.info('Database connection shutdown.');
    serv.close();
    logger.info('HTTP Server shutdown.');
    if(httpsServer !== null){
        httpsServer.close();
        logger.info('HTTPS server shutdown.');
    }
    logger.info('Bye.');
    setTimeout(function () {
        process.exit(0);
    }, 10);

}

/**
 * Initializes and starts the app.
 */
function startup() {
    _initApp();

    serv = app.listen(app.get('port'), function () {
        logger.info('listening on HTTP port ' + app.get('port') + '.');
    });

    if(config.uses.https === true){
        httpsServer.listen(app.get('https port'), function () {
            logger.info('listening on HTTPS port ' + app.get('https port') + '.');
        });
    }
}

module.exports = startup;