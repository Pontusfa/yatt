/**
 * Directs a user's request to download a torrent file.
 * @author Pontus Falk
 */

var getTorrentModel = null,
    modifyUser = null,
    _ = require('underscore');

/**
 * Ensures session has an associated passkey, then moving on to the usual route.
 * @private
 */
function _getTorrentPrivate(req, res){
    if(!_.isString(req.session.user.passkey)){
        modifyUser.updatePasskey(
            {username: req.session.user.username},
            _updatePasskeyCallback(req, res));
    }
    else{
        _getTorrent(req, res);
    }
}

/**
 *
 * @private
 */
function _updatePasskeyCallback(req, res){
    return function(err, result){
        if(_.isObject(err) || !_.isObject(result)){
            req.session.alert = {type: 'error', message: 'generic'};
        }
        else{
            _getTorrent(req, res);
        }
    };
}

/**
 * @private
 */
function _getTorrent(req, res){
    if(_.isString(req.query.id) && req.query.id.length > 0){
        var requestInfo = {id: req.query.id, passkey: req.session.user.passkey};

        getTorrentModel(requestInfo, _getTorrentCallback(req, res));
    }
    else{
        req.session.alert = {type: 'error', message: 'noSpecifiedTorrent'};
        res.redirect('/index');
    }
}

/**
 * @private
 */
function _getTorrentCallback(req, res){
    return function(alert, torrent){
        if(!_.isObject(alert) && _.isObject(torrent)){
            var filename = (torrent.title + '.torrent').replace(' ', '');

            res.type('application/x-bittorrent');
            res.setHeader('Content-disposition', 'attachment; filename=' + filename);
            res.send(torrent.bencode);
        }
        else{
            req.session.alert = alert;
            res.redirect('/index');
        }
    };
}

/**
 * Setups the app with routing for /gettorrent, dependent on site being public or private.
 * @param app the app to install routing on
 */
function setup(app){
    modifyUser = app.modifyUser;
    getTorrentModel = require('./getTorrentModel')(app.queries);

    if(app.config.site.private){
        app.get('/gettorrent', _getTorrentPrivate);
        return app.config.site.ranks.MEMBER;

    }
    else{
        app.get('/gettorrent', _getTorrent);
        return app.config.site.ranks.PUBLIC;
    }
}

module.exports.setup = setup;
