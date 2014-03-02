/**
 * Installs middleware, routes and configures the app object.
 * @author Pontus Falk
 */

var express = require('express'),
    app = express(),
    path = require('path'),
    _ = require('underscore'),
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

	_initSetters();
    _initMiddleware();
    _initStatics();
    _initRoutes();

    process.on('SIGTERM', _tearDown);
    process.on('SIGINT', _tearDown);
    app.tearDown = _tearDown;
	app.logger.info('App setup.');
}

/**
 * Populates the app object with various important settings needed
 * @private
 */
function _initSetters() {
    // Using sane values if config is being naughty.
    app.set('port', app.config.setters.port || 8080);
	app.set('https port', app.config.setters['https port'] || 8443);
    app.set('view engine', app.config.uses['view engine'] || 'jade');
    app.set('views', app.config.setters.views || 'views/');
    app.set('env', app.config.setters.env || 'development');
    app.locals.pretty = _.isEqual(app.get('env'), 'development');
    app.logger.info('Setters setup.');
}

/**
 * Initializing all the middleware we want every request to the app
 * to pass through before finally arriving at a route handler.
 * @private
 */
function _initMiddleware() {
    app.use(express.compress()); // ?
    app.use(app.config.site.favicon || express.favicon());
    app.use(app.logger);
    app.use(express.urlencoded());
    app.use(express.json());

    _initHttps();

    app.use(function(req, res, next){
        res.locals = res.locals || {};
        res.locals.url = req.originalUrl;  // used in templating, action=url
        next();
    });

    app.use(_parseMultiForm);

    _initSession();
    _initCsrfProtection();
    require('helmet').defaults(app);
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
	app.logger.info('Middleware setup.');
}

/**
 * Create a https server if app.config.uses.https is set to true.
 * If app.config.uses['https only'] is true, a middleware is installed to redirect all
 * http request to its https counter-part.
 * @private
 */
function _initHttps(){
    if(app.config.uses.https){
        var fs = require('fs'),
			https = require('https'),
            privateKey  = fs.readFileSync(app.config.setters.certPath + 'server.key', 'utf8'),
            certificate = fs.readFileSync(app.config.setters.certPath + 'server.crt', 'utf8'),
            credentials = {key: privateKey, cert: certificate};

        httpsServer = https.createServer(credentials, app).listen(app.get('https port'));

        if(app.config.uses['https only']){
            app.use(function(req, res, next){
                if(_.isEqual(req.protocol, 'http')){
                    res.redirect('https://' + req.host + ':' + (app.get('https port')) + req.originalUrl);
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
    var Busboy = require('busboy'),
        busboy = new Busboy({immediate: true, headers: req.headers});

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
 * Setup how we want to keep track of our users to verify their identity.
 * @private
 */
function _initSession() {
    var cookieSettings = {},
        Redis = require('connect-redis')(express),
        redisStore = new Redis(app.config.uses.redis);

    app.use(express.cookieParser(app.config.setters.cookieSecret));   // We need cookieParser installed for sessions.

    cookieSettings.httpOnly = true;
    cookieSettings.secure = app.config.uses['https only'];

    app.use(express.session({
        proxy: app.config.uses.proxy,
        cookie: cookieSettings,
        store: redisStore
    }));

	app.logger.info('Session setup.');
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
 * Only installed if app.config.site.private is set to true.
 * @private
 */
function _initLoginVerifier() {
    if(app.config.site.private){
        app.use(function(req, res, next){
            if(req.session.loggedIn){
                next();
            }
            else if(_.contains(app.config.site.publicPaths, req.path)){
                next();
            }
            else{
                res.redirect('/login?redirect=' + req.originalUrl);
            }
        });
		app.logger.info('Login verifier setup.');
    }
}

/**
 * Informs the app where to find static files such as scripts, stylesheets and images.
 * @private
 */
function _initStatics() {
    if (_.isEqual(app.config.uses['stylesheet engine'], 'stylus')){
        app.use(require('stylus').middleware(path.join(__dirname, app.config.setters.static)));
    }
    else{
		app.logger.info('No css preprocessor configured, using plain css.');
    }
    if(app.config.setters.static){
        app.use(express.static(path.join(__dirname, '../' + app.config.setters.static)));
    }
	app.logger.info('Statics setup.');
}

/**
 * Route the user to where we want him.
 * @private
 */
function _initRoutes() {
    require('./routing')(app);
	app.logger.info('All routing setup.');
}

/**
 * Called when user sends sigint/sigterm, or the app is failing such that recovery is impossible.
 * @private
 */
function _tearDown() {
	app.logger.info('Terminate/interrupt/exit received, shutting down.');
    require('./db').connection.close();
	app.logger.info('Database connection shutdown.');
    server.close();
	app.logger.info('HTTP Server shutdown.');
    if(!_.isNull(httpsServer)){
        httpsServer.close();
		app.logger.info('HTTPS server shutdown.');
    }
	app.logger.info('Bye.');
    _.defer(function () {
        process.exit(0);
    });

}

/**
 * Initializes and starts the app.
 */
function startup() {
    _initApp();

    server = app.listen(app.get('port'), function () {
		app.logger.info('listening for HTTP on port ' + app.get('port') + '.');
    });

    if(app.config.uses.https){
        httpsServer.listen(app.get('https port'), function () {
			app.logger.info('listening for HTTPS on port ' + app.get('https port') + '.');
        });
    }
}

module.exports = startup;