'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _slugify = require('slugify');

var _slugify2 = _interopRequireDefault(_slugify);

var _express = require('express');

var _auth = require('../middleware/auth');

var _response = require('../utils/response');

var _response2 = _interopRequireDefault(_response);

var _creditCard = require('../models/credit-card');

var _creditCard2 = _interopRequireDefault(_creditCard);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (_ref) {
    var config = _ref.config,
        db = _ref.db;

    var api = (0, _express.Router)();
    var jsonResponse = new _response2.default();

    //POST ADD /api/cards
    api.post('', _auth.authenticate, function (req, res) {
        (0, _auth.verifyIfUserLoggedIsAdmin)(jsonResponse, req, res, function () {
            var data = req.body;

            req.assert('name', 'O nome do cartão é obrigatório.').notEmpty();
            req.assert('number', 'O numero do cartão é obrigatorio').notEmpty();
            req.assert('payday', 'O vencimento é obrigatorio').notEmpty();

            req.getValidationResult().then(function (result) {
                if (!result.isEmpty()) {

                    jsonResponse.data = null;
                    jsonResponse.messages = _lodash2.default.map(result.array(), function (value) {
                        return value.msg;
                    });
                    jsonResponse.error = 'validationErrors';
                    res.status(400).json(jsonResponse);
                }

                var creditCard = new _creditCard2.default(data);
                //creditCard.slug = slugify(creditCard.name,'_')
                creditCard.save(function (error, saved) {
                    if (error) {
                        jsonResponse.data = null;
                        jsonResponse.messages.push('Ouve erro interno');
                        jsonResponse.error = err;

                        res.status(500).json(jsonResponse);
                    }

                    jsonResponse.data = saved;
                    jsonResponse.messages.push('Cartão adicionado com sucesso');
                    jsonResponse.error = null;

                    res.status(200).json(jsonResponse);
                });
            });
        });
    });

    //GET ALL /api/cards
    api.get('', _auth.authenticate, function (req, res) {

        var jsonResponse = new _response2.default();

        _creditCard2.default.find({}, function (err, cards) {
            if (err) {
                jsonResponse.data = null;
                jsonResponse.messages.push('Ouve erro interno');
                jsonResponse.error = err;
                res.status(500).json(jsonResponse);
            }

            jsonResponse.data = _lodash2.default.orderBy(cards, ['name'], ['asc']);
            jsonResponse.messages = ['Lista carregada'];
            jsonResponse.error = null;
            res.status(200).json(jsonResponse);
        });
    });

    return api;
};
//# sourceMappingURL=creditcard-controller.js.map