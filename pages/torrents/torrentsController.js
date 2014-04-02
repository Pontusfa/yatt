var site = null,
    template = null,
    TorrentsModel = null,
    torrentCategories = null,
    sortWhiteList = ['title', 'seeders', 'leechers', 'size', 'created'],
    queryWhiteList = ['title', 'tags', 'categories'],
    _ = require('underscore');

/**
 * Sanitizes the query request and passes it on to the model
 * to do its thing.
 * @private
 */
function _getTorrents(req, res){
    var query = _sanitizeQuery(req),
        model = new TorrentsModel(query),
        callbacks = {
            getTorrents: _getTorrentsCallback(req, res, model),
            getPages: _buildPagesCallback(req, res)
        };

    res.locals.query = query;
    res.locals.site = site;
    res.locals.lang.categories = torrentCategories[req.session.language];

    model.
        registerCallbacks(callbacks).
        trimCriteria().
        buildCriteria().
        buildSort().
        getTorrents();

}

/**
 * Saves only the whitelisted query keywords
 * @private
 */
var _sanitizeQuery = (function(){
    var orderWhiteList = ['asc', 'desc'],
        nonAlfaNumericals = /[^\w|\s]/g;

    return function (req){
        var query = {};

        query.sort = _.contains(sortWhiteList, req.query.sort) ?
            req.query.sort :
            null;

        query.order = _.contains(orderWhiteList, req.query.order) ?
            req.query.order :
            null;

        //creates the object defining previous/next step for pager
        query.offset = parseInt(req.query.offset);
        if(!_.isFinite(query.offset) || query.offset < 0){
            query.offset = 0;
        }

        query.criteria = _.pick(req.query, queryWhiteList);

        if(!_.isEmpty(query.criteria.title)){ //remove any regex shenanigans
            query.criteria.title = query.criteria.title.replace(nonAlfaNumericals, '');
        }
        return query;
    };
}());

/**
 * Transforms the model's returned data into format suitable for the view.
 * @private
 */
function _getTorrentsCallback(req, res, model){
    return function(alert, result){
        if(_.isObject(alert)){
            req.session.alert = alert;
            res.redirect('/torrents');
        }
        else{
            res.locals.torrents = result;
            model.getPages();
        }
    };
}

/**
 * @private
 */
function _buildPagesCallback(req, res){
    return function(alert, result){
        if(_.isObject(alert)){
            req.session.alert = alert;
            res.redirect('/torrents');
        }
        else{
            res.locals.links = _buildLinks(res.locals.query, result);

            res.send(template(res.locals));
        }
    };
}

/**
 * @private
 */
function _buildLinks(query, offsets){
    var searchString = '?',
        links = {};

    //sort part
    _.forEach(query.criteria, function(value, key){
        searchString = searchString + key + '=' + value.replace(' ', '+') + '&';
    });

    _.forEach(sortWhiteList, function(value){
        links[value] = searchString + 'sort=' + value;
    });

    if(!_.isEmpty(query.sort)){
        links[query.sort] += '&order=' + _getSortOrder(query.order);
    }

    //offset part
    if(_.isNumber(offsets.previous)){
        links.previous = {
            link: searchString + 'offset=' + offsets.previous,
            class: null
        };
    }
    else{
        links.previous = {
            link: null,
            class: 'disabled'
        };
    }

    if(_.isNumber(offsets.next)){
        links.next = {
            link: searchString + 'offset=' + offsets.next,
            class: null
        };
    }
    else{
        links.next = {
            link: null,
            class: 'disabled'
        };
    }
    return links;
}

/**
 * @private
 */
function _getSortOrder(order){
    return (!_.isEmpty(order) && _.isEqual(order, 'desc')) ?
        'asc' :
        'desc';
}

/**
 * Sets up the routing for torrents listing
 * @param app the app to setup
 * @param jadeCompiler provide a compiler for jade templates
 * @returns {boolean}
 */
function setup(app, jadeCompiler){
    site = {
        name: app.config.site.name,
        categories: app.config.site.categories
    };
    template = jadeCompiler('torrents');
    TorrentsModel = require('./torrentsModel');
    torrentCategories = require('../../lib/internationalization')
        .getAdditionalLanguageField('torrentCategories');

    app.get('/torrents', _getTorrents);

    if(app.config.site.private){
        return app.config.site.ranks.MEMBER;
    }
    else{
        return app.config.site.ranks.PUBLIC;
    }
}

module.exports.setup = setup;
