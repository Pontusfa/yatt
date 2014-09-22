/**
 * Directs a user's request to download a torrent file.
 */

var GetTorrentModel = null,
site = null;

function _getTorrent(req, res){
    if(req.query.id && req.query.id.length > 0){
        new Controller(req, res).
            sanitizeQuery().
            getModel().
            executeModel();
    }
    else{
        req.session.alert = {type: 'error', message: 'noSpecifiedTorrent'};
        res.redirect(site.links.index);
    }
}

function Controller(req, res){
    this._req = req;
    this._res = res;
    this._callbacks = {
        successCallback: this._successCallback.bind(this),
        errorCallback: this._errorCallback.bind(this)
    };
    this._user = req.session.user;
}

Controller.prototype.sanitizeQuery = function(){
    this._id = this._req.query.id;
    return this;
};

Controller.prototype.getModel = function(){
    this._model = new GetTorrentModel(this._id, this._user).
        registerCallbacks(this._callbacks);
    return this;
};

Controller.prototype.executeModel = function(){
    this._model.getTorrent();
    return this;
};

Controller.prototype._successCallback = function(torrent){
    var filename = (torrent.title.replace(' ', '') + '.torrent'),
    res = this._res;

    res.type('application/x-bittorrent');
    res.setHeader('Content-disposition', 'attachment; filename=' + filename);
    res.send(torrent.bencode);    
};

Controller.prototype._errorCallback = function(alert){
    this._req.session.alert = alert;
    this._res.redirect(site.links.index);
};

/**
 * Setups the app with routing for /gettorrent, dependent on site being public or private.
 * @param app the app to install routing on
 */
function setup(app){
    GetTorrentModel = require('./getTorrentModel')(app.queries, app.modifyUser);
    site = app.config.site;
    app.get(site.links.gettorrent, _getTorrent);
    
    return site.private ? site.ranks.MEMBER: site.ranks.PUBLIC;
}

module.exports.setup = setup;
