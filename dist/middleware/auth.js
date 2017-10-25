'use strict';

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _expressJwt = require('express-jwt');

var _expressJwt2 = _interopRequireDefault(_expressJwt);

var _response = require('../utils/response');

var _response2 = _interopRequireDefault(_response);

var _userModel = require('../models/user-model');

var _userModel2 = _interopRequireDefault(_userModel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var TOKEN_TIME = '2h';
var SECRET = 'M4rC1a_4p1';

var authenticate = (0, _expressJwt2.default)({ secret: SECRET });

var accessTokenGeneration = function accessTokenGeneration(req, res, next) {
    req.token = req.token || {};
    req.token = _jsonwebtoken2.default.sign({ id: req.user.id }, SECRET, { expiresIn: TOKEN_TIME });

    next();
};

var respond = function respond(req, res) {
    var response = new _response2.default();
    response.data = { id: req.user.id, completeName: req.user.completeName, accessToken: req.token };
    response.messages.push('usuario autenticado');
    response.error = null;

    res.status(200).json(response);
};

var verifyIfUserLoggedIsAdmin = function verifyIfUserLoggedIsAdmin(jsonResponse, req, res, callback) {

    _userModel2.default.findById(req.user.id, function (err, user) {
        if (err) {
            jsonResponse.messages.push('Ouve errors internos na verificação de usuario logado como admin');
            jsonResponse.data = null;
            jsonResponse.error = 'AdminUsernotFound';
            res.status(500).json(jsonResponse);
            return;
        }

        if (!user.isAdmin) {
            jsonResponse.messages.push('Apenas administradores podem realizar esta operação');
            jsonResponse.data = null;
            jsonResponse.error = 'UserNotAdmin';
            res.status(403).json(jsonResponse);
            return;
        }

        callback();
    });
};

var verifyIfUserIsAdmin = function verifyIfUserIsAdmin(req, res, next) {
    var jsonResponse = new _response2.default();
    var userId = req.user ? req.user.id : null;
    var username = req.body.username || null;

    if (req.method === "OPTIONS") {
        next();
    }
    if (userId && !username) {
        _userModel2.default.findById(req.user.id, function (err, user) {
            if (err) {
                jsonResponse.messages.push('Ouve errors internos na verificação de usuario logado como admin');
                jsonResponse.data = null;
                jsonResponse.error = 'AdminUsernotFound';
                res.status(500).json(jsonResponse);
                return;
            }

            if (!user.isAdmin) {
                jsonResponse.messages.push('Apenas administradores podem realizar esta operação');
                jsonResponse.data = null;
                jsonResponse.error = 'UserNotAdmin';
                res.status(403).json(jsonResponse);
                return;
            }

            next();
        });
    } else if (username && !userId) {
        _userModel2.default.findOne({ username: username }, function (err, user) {
            if (err) {
                jsonResponse.messages.push('Ouve errors internos na verificação de usuario logado como admin');
                jsonResponse.data = null;
                jsonResponse.error = 'AdminUsernotFound';
                res.status(500).json(jsonResponse);
                return;
            }

            if (!user.isAdmin) {
                jsonResponse.messages.push('Apenas administradores podem realizar esta operação');
                jsonResponse.data = null;
                jsonResponse.error = 'UserNotAdmin';
                res.status(403).json(jsonResponse);
                return;
            }

            next();
        });
    } else {
        next();
    }
};

var validateToken = function validateToken(req, res, next) {
    var response = new _response2.default();

    if (req.method === "OPTIONS") {
        next();
    } else {
        var bearerToken = req.headers['authorization'];

        if (!bearerToken) {
            response.messages.push('O Token não foi enviado');
            response.error = 'noTokenProvider';

            return res.status(403).json(response);
        }

        var token = bearerToken.replace('Bearer ', '');

        _jsonwebtoken2.default.verify(token, SECRET, function (err) {
            if (err) {
                response.messages.push('O Token expirado ou invalido');
                response.error = err;
                return res.status(403).json(response);
            }

            next();
        });
    }
};

module.exports = {
    authenticate: authenticate,
    accessTokenGeneration: accessTokenGeneration,
    respond: respond,
    verifyIfUserLoggedIsAdmin: verifyIfUserLoggedIsAdmin,
    verifyIfUserIsAdmin: verifyIfUserIsAdmin,
    validateToken: validateToken
};
//# sourceMappingURL=auth.js.map