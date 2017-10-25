'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _express = require('express');

var _auth = require('../middleware/auth');

var _response = require('../utils/response');

var _response2 = _interopRequireDefault(_response);

var _userModel = require('../models/user-model');

var _userModel2 = _interopRequireDefault(_userModel);

var _registerModel = require('../models/register-model');

var _registerModel2 = _interopRequireDefault(_registerModel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (_ref) {
    var config = _ref.config,
        db = _ref.db;

    var api = (0, _express.Router)();

    //POST ADD /api/registers
    api.post('', _auth.authenticate, function (req, res) {

        var jsonResponse = new _response2.default();
        var data = req.body;

        validate(req).then(function (result) {

            if (result.hasError) {
                jsonResponse.data = null;
                jsonResponse.messages = result.errors;
                jsonResponse.error = 'validationError';
                res.status(400).json(jsonResponse);
                return;
            }

            _userModel2.default.findById(req.user.id, function (err, userAuthenticated) {
                if (err) {
                    jsonResponse.data = null;
                    jsonResponse.messages.push('Ouve erro interno');
                    jsonResponse.error = err;
                    res.status(500).json(jsonResponse);
                    return;
                }

                var register = new _registerModel2.default(data);
                register.user = userAuthenticated._id;

                register.save(function (err, saved) {
                    if (err) {
                        jsonResponse.data = null;
                        jsonResponse.messages.push('Ouve erro interno');
                        jsonResponse.error = err;
                        res.status(500).json(jsonResponse);
                        return;
                    }

                    jsonResponse.data = saved;
                    jsonResponse.messages.push('Registro adicionado com sucesso');
                    jsonResponse.error = null;
                    res.status(200).json(jsonResponse);
                });
            });
        });
    });

    //GET ALL REGISTER FOR A USER /api/registers/my
    api.get('/my', _auth.authenticate, function (req, res) {
        var jsonResponse = new _response2.default();

        findRegisterOf(req.user.id, jsonResponse).then(function (response) {
            if (response.error) {
                res.status(500).json(response);
                return;
            }

            res.status(200).json(response);
        });
    });

    //GET ALL REGISTER OF THE USER /api/registers/user/:id
    api.get('/user/:id', _auth.authenticate, function (req, res) {

        var forUserId = req.params.id;
        var jsonResponse = new _response2.default();

        _userModel2.default.findById(req.user.id, function (err, userAuthenticated) {
            if (err) {
                jsonResponse.data = null;
                jsonResponse.messages.push('Ouve erro interno');
                jsonResponse.error = err;
                res.status(500).json(jsonResponse);
                return;
            }

            if (userAuthenticated.isAdmin) {
                findRegisterOf(forUserId, jsonResponse).then(function (response) {
                    if (response.error) {
                        res.status(500).json(response);
                        return;
                    }

                    res.status(200).json(response);
                });
            } else {
                jsonResponse.data = null;
                jsonResponse.messages.push('Apenas administradores podem usar esse recurso.');
                jsonResponse.error = 'userNotAdmin';

                res.status(403).json(jsonResponse);
            }
        });
    });

    //PUT EDIT REGISTER /api/registers/:id
    api.put('/:id', _auth.authenticate, function (req, res) {
        var data = req.body;
        var jsonResponse = new _response2.default();

        (0, _auth.verifyIfUserLoggedIsAdmin)(jsonResponse, req, res, function () {
            validate(req).then(function (response) {
                if (response.hasError) {
                    res.status(500).json(response);
                    return;
                }

                _registerModel2.default.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true, upsert: false }, function (err, updated) {
                    if (err) {
                        jsonResponse.data = null;
                        jsonResponse.messages.push('Ouve erro interno');
                        jsonResponse.error = err;
                        res.status(500).json(jsonResponse);
                        return;
                    }
                    jsonResponse.data = updated;
                    jsonResponse.messages.push('Registro atualizado com sucesso');
                    jsonResponse.error = null;

                    res.status(200).json(jsonResponse);
                });
            });
        });
    });

    //DELETE REGISTER /api/registers
    api.delete('/:id', _auth.authenticate, function (req, res) {

        var jsonResponse = new _response2.default();

        (0, _auth.verifyIfUserLoggedIsAdmin)(jsonResponse, req, res, function () {
            _registerModel2.default.findByIdAndRemove(req.params.id, function (err, result) {
                if (err) {
                    jsonResponse.data = null;
                    jsonResponse.messages.push('Ouve error interno');
                    jsonResponse.error = err;
                    res.status(500).json(jsonResponse);
                }

                jsonResponse.data = result;
                jsonResponse.messages.push('Registro removido com sucesso');
                jsonResponse.error = null;

                res.status(200).json(jsonResponse);
            });
        });
    });

    //PUT NEED EDIT REGISTER /api/registers/neededit/:id
    api.put('/neededit/:id', _auth.authenticate, function (req, res) {

        var jsonResponse = new _response2.default();

        _registerModel2.default.findById(req.params.id, function (err, register) {
            if (err) {
                jsonResponse.data = null;
                jsonResponse.messages.push('Ouve erro interno');
                jsonResponse.error = err;
                res.status(500).json(jsonResponse);
            }

            register.needEdit = !register.needEdit;

            _registerModel2.default.update({ _id: register._id }, register, { runValidators: true, new: true, upsert: false }, function (err, updated) {

                if (err) {
                    jsonResponse.data = null;
                    jsonResponse.messages.push('Ouve erro interno');
                    jsonResponse.error = err;
                    res.status(500).json(jsonResponse);
                }

                jsonResponse.data = updated;
                jsonResponse.messages.push('Registro marcado para edição');
                jsonResponse.error = null;

                res.status(200).json(jsonResponse);
            });
        });
    });

    //GET ALL NEED EDIT REGISTE /api/registesrs/neededit
    api.get('/neededit', _auth.authenticate, function (req, res) {
        var jsonResponse = new _response2.default();

        (0, _auth.verifyIfUserLoggedIsAdmin)(jsonResponse, req, res, function () {
            _registerModel2.default.find({ needEdit: true }, function (err, result) {
                if (err) {
                    jsonResponse.data = null;
                    jsonResponse.messages.push('Ouve erro interno');
                    jsonResponse.error = err;
                    res.status(500).json(jsonResponse);
                    return;
                }

                jsonResponse.data = result;
                jsonResponse.messages.push('Registros carregados..');
                jsonResponse.error = null;

                res.status(200).json(jsonResponse);
            });
        });
    });

    return api;
};

function validate(req) {

    req.assert('buyAt', 'O campo \'data de compra\' \xE9 obrigatorio').notEmpty();
    req.assert('price', 'O campo \'pre\xE7o\' \xE9 obrigatorio').notEmpty();
    req.assert('productName', 'O campo \'nome do produto\' \xE9 obrigatorio').notEmpty();
    req.assert('creditCard', 'É necessario informar o cartão usado').notEmpty();
    req.assert('local', 'Informe onde realizou a compra').notEmpty();
    req.assert('paymentMonth', 'O campo \'m\xEAs de pagamento\' \xE9 obrigatorio').notEmpty();

    return new Promise(function (resolve) {

        req.getValidationResult().then(function (result) {
            resolve({ hasError: !result.isEmpty(), errors: _lodash2.default.map(result.array(), function (error) {
                    return error.msg;
                }) });
        });
    });
}

function findRegisterOf(id, jsonResponse) {

    return new Promise(function (resolve) {
        _registerModel2.default.find({ user: id }, function (err, registers) {

            jsonResponse.data = registers;
            jsonResponse.messages.push('Registros carregados');
            jsonResponse.error = null;

            if (err) {
                jsonResponse.data = null;
                jsonResponse.messages = [];
                jsonResponse.messages.push('Ouve erro interno');
                jsonResponse.error = err;
            }

            resolve(jsonResponse);
        });
    });
}
//# sourceMappingURL=register-controller.js.map