var Model = null,
    ranks = null;

function _user(req, res) {
    
}

function Controller(req, res) {
    this._req = res;
    this._res = res;
}

/**
 * Routes the user path.
 * @param app the app to install routes to.
 * @param jadeCompiler a function compiling jade templates
 */
function setup(app, jadeCompiler) {
    var site = app.config.site;
    
    //TorrentModel = require('./userModel')();

    template = jadeCompiler('user');
    ranks = site.ranks;
    links = site.links;

    app.get(links.user, _user);
    app.post(links.user, _user);

    return app.config.site.ranks.UPLOADER;
}

module.exports.setup = setup;