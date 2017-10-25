'use strict';

var _App = require('./App');

var _App2 = _interopRequireDefault(_App);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// start server....
_App2.default.server.listen(_config2.default.port);
console.log('Iniciado na port ' + _config2.default.port);
//# sourceMappingURL=index.js.map