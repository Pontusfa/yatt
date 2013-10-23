/**
 * Installs middleware, routes and configures the app object.
 * Due to importance of the config object, all code is done
 * synchronized. Hopefully in a timely fashion. Hopefully.
 * @author Pontus Falk
 * @version 0.0.1
 */

var express = require('express'),
    path = require('path'),
    app = express(),
    serv = null,
    config = require('./config').conf,
    logger = require('./logger').logger;

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

    process.on('SIGTERM', tearDown); // Perhaps the user finds this app dull? :/
    process.on('SIGINT', tearDown);  // Imma let you finish, I just gotta interrupt you and SMOKE YO A$$
    app.tearDown = tearDown;        // Or perhaps the user screwed up the settings/routes/db?
    logger.info('App setup.');
}

/**
 * Populates the app object with various important settings needed
 * to properly survive in this inferno that is node.js.
 * @private
 */
function _initSetters() {
    // Using sane values if config is being naughty.
    app.set('port', config.setters.port || 8080);
    app.set('view engine', config.setters['view engine'] || 'jade');
    app.set('views', config.setters.views || 'views/');
    app.set('env', config.setters.env || 'development');
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
    app.use(express.bodyParser({KeepExtensions: true, uploadDir: config.uses.tmpDir}));    //Before router.
    _initSession();   // Before router.
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
 * Informs the app object where to find static files such as scripts, stylesheets and images.
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
        app.use(express.static(path.join(__dirname, '../' + config.uses.static+'/html/'))); //escape from lib/
        app.use(express.static(path.join(__dirname, '../' + config.uses.static))); //escape from lib/
    }
    logger.info('Statics setup.');
}

/**
 * Route the user to where we want him. Or her.
 * @private
 */
function _initRoutes() {
    require('./routes').installRoutes(app);
    logger.info('Routes setup.');
}

/**
 * Setups how we want to keep track of our users to verify their identity.
 * NSA ID verification middleware would be a huge improvement.
 * @private
 */
function _initSession() {
    app.use(express.cookieParser(config.uses.cookieSecret));   // We need cookieParser installed for sessions.
    if(config.uses.sessionType === 'cookieSession') {
        app.use(express.cookieSession());
    }
    else if (config.uses.sessionType === 'session') {
        if (config.uses.sessionStore) {
            //TODO: Setup a proper store for sessions
            logger.warn('Session store not configured, using MemoryStore(bad).');
        }
        app.use(express.session());
    }

    if (config.uses.csrf) {
        app.use(express.csrf()); //   add req.csrfToken() to any POST/PUT/DELETE form for csrf protection.
        app.use(function(req, res, next){
            req.locals = req.locals || {};
           req.locals.csrfToken = req.csrfToken();
            next();
        });
    }
    logger.info('Session setup.');
}

/**
 * User don't want the app any more, wrap it up boys.
 * @private
 */
function tearDown() {
    logger.info('Terminate/interrupt/exit received, shutting down.');
    require('./db').connection.close();
    logger.info('Database shutdown.');
    serv.close();
    logger.info('Server shutdown.');
    logger.info('404, bye.');
    setTimeout(function () {
        process.exit(0); //This will only hurt for a second... Or rather 0 ms to be precise.
    }, 10);

}

function startup() {
    _initApp();
    serv = app.listen(app.get('port'), function () {
        logger.info('listening on port ' + app.get('port'));
    });
}

module.exports = exports = startup;
