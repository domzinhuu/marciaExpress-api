'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _express = require('express');

var _userController = require('../controllers/user-controller');

var _userController2 = _interopRequireDefault(_userController);

var _registerController = require('../controllers/register-controller');

var _registerController2 = _interopRequireDefault(_registerController);

var _creditcardController = require('../controllers/creditcard-controller');

var _creditcardController2 = _interopRequireDefault(_creditcardController);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (_ref) {
    var config = _ref.config,
        db = _ref.db;

    var api = (0, _express.Router)();

    api.use('/users', (0, _userController2.default)({ config: config, db: db }));
    api.use('/registers', (0, _registerController2.default)({ config: config, db: db }));
    api.use('/cards', (0, _creditcardController2.default)({ config: config, db: db }));

    return api;
};
//# sourceMappingURL=index.js.map