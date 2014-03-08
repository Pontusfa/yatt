/**
 * Controls the behavior of the / and /index controllers.
 * @author Pontus Falk
 */

var template = null,
    _ = require('underscore'),
    config = null;

 /**
 * @private
 */
function _getIndex(){
    var model = require('./indexModel'),
        site = {name: config.site.name};
    
    return function(req, res){
        res.locals.site = site;
        
        model.buildIndex(_getIndexCallback(req, res));
    };
}

function _getIndexCallback(req, res){

    return function(alert, result){
        if(_.isObject(alert)){
            res.locals[alert.type] = alert.message;
        }
        res.locals.index = result;
        res.send(template(res.locals));
    };
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
    template = jadeCompiler('index');
    config = app.config;
    app.get('/index', _getIndex());
    app.get('/', _getRoot);

    if(app.config.site.private){
        return app.config.site.ranks.MEMBER;
    }
    else{
        return app.config.site.ranks.ANY;
    }
}

module.exports.setup = setup;
































































