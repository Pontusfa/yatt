/**
 * Installs middleware, routes and configures the app object.
 * @author Pontus Falk
 */

var express = require('express'),
    Redis = require('connect-redis')(express),
    app = express(),
    path = require('path'),
    Busboy = require('busboy'),
    _ = require('underscore'),
    fs = require('fs'),
    serv = null,
    config = require('./config'),
    logger = require('./logger'),
    https = require('https'),
    helmet = require('helmet'),
    httpsServer = null;

/**
 * Calling all the needed init functions in the desired order
 * to properly setup the app object.
 * @private
 */
function _initApp() {
    require('./db');
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
    app.set('view engine', config.uses['view engine'] || 'jade');
    app.set('views', config.setters.views || 'views/');
    app.set('env', config.setters.env || 'development');
    app.locals.pretty = _.isEqual(app.get('env'), 'development');
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
    app.use(express.urlencoded());
    app.use(express.json());

    _initHttps();

    app.use(function(req, res, next){
        res.locals = res.locals || {};
        res.locals.url = req.originalUrl;  // used in templating action=url
        next();
    });

    app.use(_parseMultiForm);

    _initSession();
    _initCsrfProtection();
    helmet.defaults(app);
    _initLoginVerifier();
    app.use(app.router);

    //TODO proper error handling.
    if (_.isEqual(app.get('env'), 'development')){
        app.use(express.errorHandler());
    }
    else{
        app.use(function(err, req, res, next){
           res.end(err.message + ', how awkward.');
        });
    }
    logger.info('Middleware setup.');
}

/**
 * Informs the app where to find static files such as scripts, stylesheets and images.
 * @private
 */
function _initStatics() {
    if (_.isEqual(config.uses['stylesheet engine'], 'stylus')){
        app.use(require('stylus').middleware(path.join(__dirname, config.setters.static)));
    }
    else{
        logger.info('No css preprocessor configured, using plain css.');
    }
    if(config.setters.static){
        app.use(express.static(path.join(__dirname, '../' + config.setters.static)));
    }
    logger.info('Statics setup.');
}

/**
 * Route the user to where we want him.
 * @private
 */
function _initRoutes() {
    require('./routing')(app);
    logger.info('All routing setup.');
}

/**
 * Setup how we want to keep track of our users to verify their identity.
 * @private
 */
function _initSession() {
    var cookieSettings = {},
        redisStore = new Redis(config.uses.redis);

    app.use(express.cookieParser(config.setters.cookieSecret));   // We need cookieParser installed for sessions.

    cookieSettings.httpOnly = true;
    cookieSettings.secure = config.uses['https only'];

    app.use(express.session({
        proxy: config.uses.proxy,
        cookie: cookieSettings,
        store: redisStore
    }));
    logger.info('Session setup.');
}

/**
 *  Setups csrf checking, enables locals.csrf that must be attached to all forms.
 * @private
 */
function _initCsrfProtection(){
    app.use(express.csrf());

    app.use(function(req, res, next){
        res.locals = res.locals || {};
        res.locals.token = req.csrfToken();
        res.locals.csrf = ' <input name="_csrf" type="hidden" value="' + res.locals.token + '" />';
        next();
    });
}

/**
 * Install the middleware that verifies the user is logged in to be enabled to view restricted pages.
 * Only installed if config.site.private is set to true.
 * @private
 */
function _initLoginVerifier() {
    if(config.site.private){
        app.use(function(req, res, next){
            if(req.session.loggedIn){
                next();
            }
            else if(_.contains(config.site.publicPaths, req.path)){
                next();
            }
            else{
                res.redirect('/login?redirect=' + req.originalUrl);
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
    if(config.uses.https){
        var privateKey  = fs.readFileSync(config.setters.certPath + 'server.key', 'utf8'),
            certificate = fs.readFileSync(config.setters.certPath + 'server.crt', 'utf8'),
            credentials = {key: privateKey, cert: certificate};

        httpsServer = https.createServer(credentials, app);
        app.set('https port', config.setters['https port'] || 8443);

        if(config.uses['https only']){
            app.use(function(req, res, next){
               if(_.isEqual(req.protocol, 'http')){
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
 * Parses a multiform post to put file into req.body.file and fields to req.body.fieldName
 * @private
 */
function _parseMultiForm(req, res, next){
    var busboy = new Busboy({immediate: true, headers: req.headers});

    if(req.is('multipart/form-data')){
        req.body = req.body || {};
        req.file = req.file || {};
        req.file.receivedData = 0;
        req.file.data = new Buffer(parseInt(req.headers['content-length'])); //not all content is file, slice it after

        busboy.on('file', function(fieldName, file, fileName){
            req.file.name = fileName;

            file.on('data', function(data){
                data.copy(req.file.data, req.file.receivedData);
                req.file.receivedData += data.length;
            });
        });

        busboy.on('field', function(fieldName, value){
            req.body[fieldName] = value;
        });

        busboy.on('finish', function(){
            req.file.data = req.file.data.slice(0, req.file.receivedData);
            next();
        });
        req.pipe(busboy);
    }
    else{
        next();
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
    if(!_.isNull(httpsServer)){
        //httpsServer.close();
        logger.info('HTTPS server shutdown.');
    }
    logger.info('Bye.');
    _.defer(function () {
        process.exit(0);
    });

}

/**
 * Initializes and starts the app.
 */
function startup() {
    _initApp();

    serv = app.listen(app.get('port'), function () {
        logger.info('listening for HTTP on port ' + app.get('port') + '.');
    });

    if(config.uses.https){
        httpsServer.listen(app.get('https port'), function () {
            logger.info('listening for HTTPS on port ' + app.get('https port') + '.');
        });
    }
}

module.exports = startup;