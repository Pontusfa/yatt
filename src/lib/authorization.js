var _ = require('underscore'),
    ranks = null,
    links = null,
    pageRanks = [];

/**
 * Install the middleware that authorizes the user.
 * Sets up what pages the user may visit.
 */
function  installAuthorization(app) {
    ranks = app.config.site.ranks;
    links = app.config.site.links;

    app.use(_refreshUserRank(app.queries));

    app.use(function(req, res, next) {
        var userAllowedPages;
        
        if(req.session.user.rank > ranks.ROOT) {  // Somehow too high rank
            app.logger.warn('user ' + req.session.user.username +
                ' has rank ' + req.session.user.rank);
            req.session.alert = {type: 'error', message: 'tooHighRank'};
            req.session.user.rank = ranks.PUBLIC; //better log out
        }

        userAllowedPages = pageRanks[req.session.user.rank];
        
        if(_.contains(userAllowedPages, req.path.slice(1))) //remove the leading '/'
        {
            req.session.user.allowedPages = userAllowedPages;
            
            next();
        }
        else {
            _redirectFailedVerify(req, res);
        }
    });
    app.logger.info('Authorization setup.');
}

/**
 * Continuously updates user's rank.
 * TODO: Is this really good? Possible flood attack.
 * @private
 */
function _refreshUserRank(queries) {
    var sort = null,
        limit = 1,
        offset = 0,
        wantedFields = {rank: 1};

    return function(req, res, next) {
            req.session.user = req.session.user || {username: null, rank: ranks.PUBLIC};

        if(req.session.user.rank > ranks.PUBLIC) {
            queries.getDocuments(
                {username: req.session.user.username},
                queries.USERMODEL, sort, offset, limit, wantedFields,
                function(err, foundUser) {
                    if(_.isObject(err) || !_.isObject(foundUser)) {
                        req.session.session.alert = {type: 'error', message: 'failFetchRank'};
                        req.session.user.rank = ranks.PUBLIC;
                    }
                    else {
                        req.session.user.rank = foundUser.rank;
                    }

                    next();
                });
        }
        else {
            next();
        }

    };
}

/**
 * Handle a user trying to get to a page he can't be at.
 * TODO handle 404/breach attempt better
 * @private
 */
function _redirectFailedVerify(req, res) {
    if(_.isEqual(req.session.user.rank, ranks.PUBLIC)) { // user is visiting without being logged in
        res.redirect(links.login + '?redirect=' + req.originalUrl);
    }
    else { // user is not allowed here, or page does not exist
        req.session.alert = {type:'error', message: 'noSuchPage'};
        res.redirect(links.index);
    }
}

/**
 * Installs page ranks.
 * TODO: Beautify?
 * @param newRanks an object containing all the new ranks.
 */
function setPageRanks(newRanks) {
    pageRanks = [];

    //first add each new ranks
    _.forEach(newRanks, function(val, key) {
        pageRanks[key] = pageRanks[key] || [];
        pageRanks[key].push.apply(pageRanks[key], val);
    });
    
    //then add all the lower ranked pages to the higher ranked,
    //except for PUBLIC_ONLY. So ADMIN can access USER etc
    _.forEach(ranks, function(rank) {
        pageRanks[rank] = _.flatten(_.first(pageRanks, rank + 1));
        pageRanks[rank] = _.uniq(pageRanks[rank]);

        if(rank > ranks.PUBLIC) {
            pageRanks[rank] = _.difference(pageRanks[rank], pageRanks[ranks.PUBLIC_ONLY]);
        }
    });
}

module.exports.installAuthorization = installAuthorization;
module.exports.setPageRanks = setPageRanks;
