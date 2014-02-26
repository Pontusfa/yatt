/**
 * Directs a user's request to download a torrent file.
 * @author Pontus Falk
 */

var getTorrentModel = require('../models/getTorrentModel'),
    config = require('../lib/config'),
    modifyUserModel = require('../models/modifyUserModel'),
    _ = require('underscore');

/**
 * @private
 */
function _getTorrent(req, res){
    if(_.isString(req.query.id) && req.query.id.length > 0){
        getTorrentModel({id: req.query.id, passkey: req.session.passkey}, _getTorrentCallback(res));
    }
    else{
        res.end();
    }
}

/**
 * Ensures session has an associated passkey, then moving on to the usual route.
 * @private
 */
function _getTorrentPrivate(req, res){
    req.session.passkey = null;
    if(!_.isString(req.session.passkey)){
        modifyUserModel.updatePasskey({username: req.session.username},
            function(err, result){

                if(_.isObject(err)){
                    res.end(err.message);
                }
                else if(!result){
                    res.end('kunde int!');
                }
                else{
                    _getTorrent(req, res);
                }
            }
        );
    }
    else{
        _getTorrent(req, res);
    }
}

/**
 * @private
 */
function _getTorrentCallback(res){
    return function(err, result){
        if(_.isNull(err) && _.isObject(result)){
            res.type('application/x-bittorrent');
            res.setHeader('Content-disposition', 'attachment; filename=' + result.name);
            res.end(result.bencode);
        }
        else{
            res.end(err.message);
        }
    };
}

/**
 * Setups the app with routing for /gettorrent, dependent on site being public or private.
 * @param app the app to install routing on
 */
function setup(app){
    if(config.site.private){
        app.get('/gettorrent', _getTorrentPrivate);
    }
    else{
        app.get('/gettorrent', _getTorrent);
    }
    return true;
}

module.exports.setup = setup;

