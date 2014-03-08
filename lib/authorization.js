var _ = require('underscore'),
    ranks = null,
    pageRanks = [];

/**
 * Install the middleware that verifies the user is logged in to be enabled to view restricted pages.
 * Only installed if app.config.site.private is set to true
 */
function  initRankVerifier(app) {
    ranks = app.config.site.ranks;
    app.use(function(req, res, next){
        var userAllowedPages = [];
        
        req.session.user  =  req.session.user || {};
        req.session.user.rank = req.session.user.rank || ranks.ANY;
        res.locals = res.locals || {};
        userAllowedPages = pageRanks[req.session.user.rank];
        if(_.isEqual(req.session.user.rank, ranks.ANY) &&
               _.contains(pageRanks[ranks.PUBLIC_ONLY], req.path)){
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

function _redirectFailedVerify(req, res){
    if(_.isEqual(req.session.user.rank, ranks.ANY)){ // user is visiting without logging in
        res.redirect('/login?redirect=' + req.originalUrl);
    }
    else{ // user is not allowed here, or page does not exist
        res.send('This isn\'t where you parked your yacht, silly');
        // //TODO handle 404/breach attempt better
    }
}

/**
 * Injects new ranks into the pre-existing ones.
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
    //except if those pages are only intended for logged out user.
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

module.exports.initRankVerifier = initRankVerifier;
module.exports.updatePageRanks = updatePageRanks;
