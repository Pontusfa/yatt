/**
 * Controls the behavior of the / and /index controllers.
 * @author Pontus Falk
 */

var template = null,
    site = null,
    ranks = null,
    model = null,
    _ = require('underscore');

/**
 * @private
 */
function _getIndex(req, res){
     res.locals.site = site;

     if(!_.isEmpty(req.query)){ // user wants to perform some action
         model.handleRequestQueries(req.query,
             req.session.user,
             function(alert){
                 req.session.alert = alert;
                 res.redirect('/index');
             }
         );
     }
     else{
         model.buildIndex(_getIndexCallback(req, res));
     }
}

/**
 * @private
 */
function _getIndexCallback(req, res){
    return function(err, result){
        _.forEach(result, function(news){
            news.created = new Date(news.created).toLocaleDateString(); // transform to readable date
        });

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
 * Handles all news article postings.
 * @private
 */
function _postIndex(req, res){
    model.addNews({title: req.body.title, text: req.body.text},
        req.session.user,
        function(alert){
            req.session.alert = alert;
            res.redirect('/index');
        }
    );
}

/**
 * Handles routing for / and /index
 * @param app the app to install routing to
 * @param jadeCompiler a compiler from jade to html
 * @returns {boolean} successful routing
 */
function setup(app, jadeCompiler){
    template = jadeCompiler('index');
    site = {name: app.config.site.name};
    ranks = app.config.site.ranks;
    model = require('./indexModel')(app.config);
    app.get('/index', _getIndex);
    app.get('/', _getRoot);
    app.post('/index', _postIndex);

    if(app.config.site.private){
        return app.config.site.ranks.MEMBER;
    }
    else{
        return app.config.site.ranks.PUBLIC;
    }
}

module.exports.setup = setup;

