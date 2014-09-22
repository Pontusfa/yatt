var site = null,
    template = null,
    TorrentsModel = null,
    torrentCategories = null,
    sortWhiteList = ['title', 'seeders', 'leechers', 'size', 'created'],
    queryWhiteList = ['title', 'tags', 'categories', 'deadtorrents'],
    _ = require('underscore');

/**
 * @private
 */
function _getTorrents(req, res) {
    new Controller(req, res).
        sanitizeQuery().
        getModel().
        executeModel();
}

/**
 *
 * @param req
 * @param res
 * @constructor
 */
function Controller(req, res) {
    this._req = req;
    this._res = res;
    this._modelCallbacks = {
        getTorrents: this._getTorrentsCallback.bind(this),
        getPages: this._buildPagesCallback.bind(this)
    };
}

/**
 * Saves only the whitelisted query keywords
 */
Controller.prototype.sanitizeQuery = (function() {
    var orderWhiteList = ['asc', 'desc'],
        nonAlfaNumericals = /[^\w|\s]/g;

    return function () {
        var newQuery = {},
            query = this._req.query,
            criteria = _.pick(query, queryWhiteList);

        newQuery.sort = _.contains(sortWhiteList, query.sort) ?
            query.sort :
            null;

        newQuery.order = _.contains(orderWhiteList, query.order) ?
            query.order :
            null;

        //creates the object defining previous/next step for pager
        newQuery.offset = parseInt(query.offset);
        if(!_.isFinite(newQuery.offset) || newQuery.offset < 0) {
            newQuery.offset = 0;
        }

        if(!_.isEmpty(criteria.title)) { //remove any regex shenanigans
            criteria.title = criteria.title.replace(nonAlfaNumericals, '');
        }
        newQuery.criteria = criteria;
        this._query = newQuery;

        return this;
    };
}());

/**
 *
 */
Controller.prototype.getModel = function() {
    this._model = new TorrentsModel(this._query).
        registerCallbacks(this._modelCallbacks);

    return this;
};

/**
 *
 */
Controller.prototype.executeModel = function() {
    this._model.
        trimCriteria().
        buildCriteria().
        buildSort().
        getTorrents();

    return this;
};

//TODO: different callbacks, success/fail
/**
 * Transforms the model's returned data into format suitable for the view.
 * @private
 */
Controller.prototype._getTorrentsCallback = function(alert, result) {
    if(_.isObject(alert)) {
        this._req.session.alert = alert;
        this._res.redirect(site.links.torrents);
    }
    else {
        this._foundTorrents = result;
        this._model.getPages();
    }
};

/**
 * @private
 */
Controller.prototype._buildPagesCallback = function(alert, result) {
    if(_.isObject(alert)) {
        this._req.session.alert = alert;
        this._res.redirect(site.links.torrents);
    }
    else {
        this._buildLinks(result).
            _buildLocals().
            _res.send(template(this._res.locals));
    }
};

/**
 * @private
 */
Controller.prototype._buildLinks = function(offsets) {
    var searchString = '?',
        query = this._query,
        links = {};

    //sort part
    _.forEach(query.criteria, function(value, key) {
        searchString = searchString + key + '=' + value + '&';
    });

    _.forEach(sortWhiteList, function(value) {
        links[value] = searchString + 'sort=' + value;
    });

    if(!_.isEmpty(query.sort)) {
        links[query.sort] += '&order=' + _getSortOrder(query.order);
    }

    //offset part
    if(_.isNumber(offsets.previous)) {
        links.previous = {
            link: searchString + 'offset=' + offsets.previous,
            class: null
        };
    }
    else {
        links.previous = {
            link: null,
            class: 'disabled'
        };
    }

    if(_.isNumber(offsets.next)) {
        links.next = {
            link: searchString + 'offset=' + offsets.next,
            class: null
        };
    }
    else {
        links.next = {
            link: null,
            class: 'disabled'
        };
    }
    this._links = links;

    return this;
};

/**
 * @private
 */
function _getSortOrder(order) {
    return (_.isEqual(order, 'desc')) ?
        'asc' :
        'desc';
}

/**
 *
 */
Controller.prototype._buildLocals = function() {
    var locals = this._res.locals;

    locals.query = this._query;
    locals.site = site;
    locals.lang.categories = torrentCategories[this._req.session.language];
    locals.links = this._links;
    locals.torrents = this._foundTorrents;

    return this;
};

/**
 * Sets up the routing for torrents listing
 * @param app the app to setup
 * @param jadeCompiler provide a compiler for jade templates
 * @returns {boolean}
 */
function setup(app, jadeCompiler) {
    site = app.config.site;
    template = jadeCompiler('torrents');
    TorrentsModel = require('./torrentsModel')(app.queries);
    torrentCategories = require('../../lib/internationalization')
        .getAdditionalLanguageField('torrentCategories');

    app.get(site.links.torrents, _getTorrents);

    return site.private ?
        site.ranks.MEMBER:
        site.ranks.PUBLIC;
}

module.exports.setup = setup;
