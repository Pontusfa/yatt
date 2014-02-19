/**
 * Handling the register system.
 * @author Pontus Falk
 * @version 0.0.1
 */

var registerModel = require('../models/registerModel'),
    logger = require('../lib/logger').logger;

function _getRegister(req, res){
    res.render('register', {
    });
}

function _postRegisterCallback(res){
    return function(err, result)
    {
        if(err || result === false){
            logger.info(err.code);
            res.write('couldn\'t register at this time. Please try again later.');
            res.end();
        }
        else{
            res.write('all good in the hood');
            res.end();
        }
    };
}

function _postRegister(req, res){
    registerModel.registerUser(req.body, _postRegisterCallback(res));
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