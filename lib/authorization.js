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
        if(req.session.user.rank > ranks.ROOT){  // Somehow too high rank
            app.logger.warn('user ' + req.session.user.username +
                            ' has rank ' + req.session.user.rank);
            req.session.user.rank = ranks.PUBLIC; //better log him out
        }

        userAllowedPages = pageRanks[req.session.user.rank];
        
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
        console.log(req.originalUrl);
        req.session.alert = {type:'error', message: 'noSuchPage'};
        res.redirect('/index');
    }
}

/**
 * Injects new ranks into any pre-existing ones.
 * @param newRanks an object containing all the new ranks.
 */
function setPageRanks(newRanks){
    pageRanks = [];
    
    _.forEach(newRanks, function(val, key){
        pageRanks[key] = pageRanks[key] || [];
        pageRanks[key].push.apply(pageRanks[key], val);
    });
    
    _.forEach(ranks, function(rank){
        pageRanks[rank] = _.flatten(_.first(pageRanks, rank+1));
        pageRanks[rank] = _.uniq(pageRanks[rank]);

        if(rank > ranks.PUBLIC){
            pageRanks[rank] = _.difference(pageRanks[rank], pageRanks[ranks.PUBLIC_ONLY]);
        }
    });
}

module.exports.installRankVerifier = installRankVerifier;
module.exports.setPageRanks =setPageRanks;
