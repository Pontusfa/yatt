/**
 * Handling the register system.
 * @author Pontus Falk
 */

var registerModel = require('../models/registerModel'),
    _ = require('underscore'),
    logger = require('../lib/logger');

/**
 * @private
 */
function _getRegister(req, res){
    if(req.session.loggedIn){
        res.redirect('/');
    }
    else{
        res.render('register');
    }
}

/**
 * @private
 */
function _postRegister(req, res){
    if(req.session.loggedIn){
        res.redirect('/');
    }
    else{
        registerModel.registerUser(req.body, _postRegisterCallback(req, res));
    }
}

/**
 * @private
 */
function _postRegisterCallback(req, res){
    return function(err, result){
        if(_.isObject(err) || !result){
            logger.info(err.message);
            res.write('couldn\'t register at this time. Please try again later.');
            res.end();
        }
        else{
            res.redirect(req.query.redirect || '/');
            res.end();
        }
    };
}

/**
 * Sets up the routing for registering
 * @param app the app to setup
 * @returns {boolean}
 */
function setup(app){
    app.get('/register', _getRegister);
    app.post('/register', _postRegister);
    return true;
}

module.exports.setup = setup;