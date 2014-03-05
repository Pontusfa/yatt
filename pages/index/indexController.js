/**
 * Controls the behavior of the / and /index controllers.
 * @author Pontus Falk
 */

var template = null;

 /**
 * @private
 */
function _getIndex(req, res){
    res.send(template(req.locals, req.session.language));
}

/**
 * @private
 */
function _getRoot(req, res){
    res.redirect('/index');
}


/**
 * Handles routing for / and /index
 * @param app the app to install routing to
 * @returns {boolean} successful routing
 */
function setup(app, jadeCompiler){
    template = jadeCompiler('index.jade');
    app.get('/index', _getIndex);
    app.get('/', _getRoot);
    
    return app.config.site.ranks.MEMBER;
}

module.exports.setup = setup;
































































