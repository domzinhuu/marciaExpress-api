'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Schema = _mongoose2.default.Schema;

var CreditCardSchema = new Schema({
    slug: { type: String },
    name: { type: String, required: true },
    number: { type: Number, required: true },
    payday: { type: Number, required: true },
    limit: { type: Number },
    actualLimit: { type: Number }
});

exports.default = _mongoose2.default.model('CreditCard', CreditCardSchema);
//# sourceMappingURL=credit-card.js.map