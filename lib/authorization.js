var _ = require('underscore'),
    ranks = null,
    pageRanks = [];

/**
 * Install the middleware that verifies the user is logged in to be enabled to view restricted pages.
 * Only installed if app.config.site.private is set to true
 */
function  installRankVerifier(app) {
    ranks = app.config.site.ranks;
    app.use(function(req, res, next){
        var userAllowedPages;

        req.session.user  =  req.session.user || {};
        req.session.user.rank = req.session.user.rank || ranks.PUBLIC;
        userAllowedPages = pageRanks[req.session.user.rank];

        // If the user isn't logged in(ranks.PUBLIC), then he can also visit sites for ranks.PUBLIC_ONLY
        if(_.isEqual(req.session.user.rank, ranks.PUBLIC) && _.contains(pageRanks[ranks.PUBLIC_ONLY], req.path)){
            userAllowedPages = _.flatten(userAllowedPages.concat(pageRanks[ranks.PUBLIC_ONLY]));
        }

        //make sure user belongs
        if(_.contains(userAllowedPages, req.path))
        {
            req.session.user.allowedPages = userAllowedPages;
            next();
        }
        else{
            _redirectFailedVerify(req, res);
        }
    });
    app.logger.info('Login verifier setup.');
}

/**
 * Handle a user trying to get to a page he can't be at.
 * TODO handle 404/breach attempt better
 * @private
 */
function _redirectFailedVerify(req, res){
    if(_.isEqual(req.session.user.rank, ranks.PUBLIC)){ // user is visiting without being logged in
        res.redirect('/login?redirect=' + req.originalUrl);
    }
    else{ // user is not allowed here, or page does not exist
        res.redirect('/');
        //res.send('This isn\'t where you parked your yacht, silly');
    }
}

/**
 * Injects new ranks into any pre-existing ones.
 * @param newRanks an object containing all the new ranks.
 */
function updatePageRanks(newRanks){
    var previousRankPages = null,
        previousRank = null;
    
    _.forEach(newRanks, function(val, key){
        pageRanks[key] = pageRanks[key] || [];
        pageRanks[key].push(val);
    });

    //Append all the lower ranking pages to the current rank's pages
    //except if those pages are only intended for logged out user.(ranks.PUBLIC_ONLY)
    //TODO: _.filter() ?
    _.forEach(pageRanks, function(list, rank){
        pageRanks[rank] = _.flatten(list); 

        if(!_.isEmpty(previousRankPages) &&
          !_.isEqual(previousRank, ranks.PUBLIC_ONLY)){
            pageRanks[rank] = _.flatten(pageRanks[rank].concat(previousRankPages));
        }

        previousRankPages = pageRanks[rank];
        previousRank = rank;
    });
}

module.exports.installRankVerifier = installRankVerifier;
module.exports.updatePageRanks = updatePageRanks;
