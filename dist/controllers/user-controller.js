'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _slugify = require('slugify');

var _slugify2 = _interopRequireDefault(_slugify);

var _express = require('express');

var _userModel = require('../models/user-model');

var _userModel2 = _interopRequireDefault(_userModel);

var _response = require('../utils/response');

var _response2 = _interopRequireDefault(_response);

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _auth = require('../middleware/auth');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (_ref) {
    var config = _ref.config,
        db = _ref.db;

    var api = (0, _express.Router)();

    //POST ADD /api/users/
    api.post('', function (req, res) {

        var response = new _response2.default();
        var data = req.body;

        req.assert('completeName', 'Informe o nome do usuario').notEmpty();
        req.assert('cellphone', 'Informe um numero').notEmpty();
        req.assert('username', 'informe um nome de usuario ').notEmpty();
        req.assert('password', 'informe uma senha').notEmpty();
        req.assert('completeName', 'Informe o nome completo').matches(/[A-Za-z]\w\s[A-Za-z]/g);

        req.getValidationResult().then(function (result) {

            if (!result.isEmpty()) {
                response.messages = _lodash2.default.map(result.array(), function (value) {
                    return value.msg;
                });
                response.data = null;
                response.error = 'validationErrors';
                res.status(400).json(response);
                return;
            }

            var user = new _userModel2.default(data);
            //user.slug = slugify(user.completeName,'_')
            _userModel2.default.register(user, data.password, function (err, createdUser) {
                if (err) {
                    response.data = null;
                    response.error = err;
                    if (err.name === 'UserExistsError') response.messages.push('Já existe alguem com o mesmo nome de usuario cadastrado.');else {
                        response.messages.push('Ocorreu alguns problemas.');
                    }

                    res.status(500).json(response);
                    return;
                }

                response.data = createdUser;
                response.messages.push('Usuario cadastrado com sucesso');
                response.error = null;
                res.status(200).json(response);
            });
        });
    });

    //POST LOGIN /api/users/login
    api.post('/login', _auth.verifyIfUserIsAdmin, _passport2.default.authenticate('local', { session: false, scope: [] }), _auth.accessTokenGeneration, _auth.respond);

    //GET ALL /api/users/
    api.get('', _auth.validateToken, _auth.authenticate, function (req, res) {
        var query = req.query.query || '';
        var response = new _response2.default();

        _userModel2.default.find({ $and: [{ isAdmin: false, completeName: { $regex: query, $options: 'i' } }] }, function (err, users) {
            if (err) {
                response.data = null;
                response.messages.push('Ouve errors internos');
                response.err = err;
                res.status(500).json(response);
                return;
            }

            response.data = users;
            response.messages.push('Usuarios carregados');
            response.err = null;

            res.status(200).json(response);
        });
    });

    //PUT EDIT /api/users/:id
    api.put('/:id', _auth.validateToken, _auth.authenticate, function (req, res) {
        var jsonResponse = new _response2.default();
        var userId = req.params.id;
        var data = req.body;

        (0, _auth.verifyIfUserLoggedIsAdmin)(jsonResponse, req, res, function () {

            req.assert('completeName', 'Informe o nome do usuario').notEmpty();
            req.assert('cellphone', 'Informe um numero').notEmpty();
            req.assert('completeName', 'Informe o nome completo').matches(/[A-Za-z]\w\s[A-Za-z]/g);

            req.getValidationResult().then(function (result) {

                if (!result.isEmpty()) {
                    jsonResponse.messages = _lodash2.default.map(result.array(), function (value) {
                        return value.msg;
                    });
                    jsonResponse.data = null;
                    jsonResponse.error = 'validationErrors';
                    res.status(400).json(jsonResponse);
                    return;
                }

                // segurança para não permitir injeção de dados..
                var updateValues = {
                    completeName: data.completeName,
                    cellphone: data.cellphone
                };

                _userModel2.default.findByIdAndUpdate(userId, updateValues, { new: true, upsert: false, runValidators: true }, function (err, updated) {

                    if (err) {
                        jsonResponse.data = null;
                        reponse.error = err;
                        jsonResponse.messages.push('Ouve alguns problemas internos');

                        res.status(500).json(jsonResponse);
                        return;
                    }

                    jsonResponse.data = updated;
                    jsonResponse.messages.push('Usuario atualizado com sucesso');
                    jsonResponse.error = null;
                    res.status(200).json(jsonResponse);
                });
            });
        });
    });

    //DELETE /api/users/:id
    api.delete('/:id', _auth.validateToken, _auth.authenticate, function (req, res) {

        var jsonResponse = new _response2.default();
        var deleteUserId = req.params.id;

        (0, _auth.verifyIfUserLoggedIsAdmin)(jsonResponse, req, res, function () {

            _userModel2.default.findByIdAndRemove(deleteUserId, function (err) {
                if (err) {
                    jsonResponse.data = null;
                    jsonResponse.messages.push('Ouve errors internos');
                    jsonResponse.error = err;
                    res.status(500).json(jsonResponse);
                    return;
                }

                jsonResponse.data = null;
                jsonResponse.messages.push('Usuario deletado com sucesso');
                jsonResponse.error = null;
                res.status(200).json(jsonResponse);
            });
        });
    });

    return api;
};
//# sourceMappingURL=user-controller.js.map