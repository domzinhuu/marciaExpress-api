'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _expressValidator = require('express-validator');

var _expressValidator2 = _interopRequireDefault(_expressValidator);

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _userModel = require('./models/user-model');

var _userModel2 = _interopRequireDefault(_userModel);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _routes = require('./routes');

var _routes2 = _interopRequireDefault(_routes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// create server
var app = (0, _express2.default)();
app.server = _http2.default.createServer(app);

// middlewars
app.use(_bodyParser2.default.urlencoded({ extended: true }));
app.use(_bodyParser2.default.json({ limit: _config2.default.bodyLimit }));
app.use((0, _expressValidator2.default)());

app.use(function (req, res, next) {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', true);

    next();
});

// passport configs
app.use(_passport2.default.initialize());

_passport2.default.use(_userModel2.default.createStrategy());
_passport2.default.serializeUser(_userModel2.default.serializeUser());
_passport2.default.deserializeUser(_userModel2.default.deserializeUser());

// routes
app.use('/api', _routes2.default);

exports.default = app;
//# sourceMappingURL=App.js.map