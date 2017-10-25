'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Schema = _mongoose2.default.Schema;

require('mongoose-currency').loadType(_mongoose2.default);
var Currency = _mongoose2.default.Types.Currency;

var RegisterSchema = new Schema({

    user: { type: Schema.Types.ObjectId, ref: 'User' },
    registeredAt: { type: Date, default: new Date() },
    buyAt: { type: Date, required: true },
    local: { type: String, required: true },
    price: { type: Currency, required: true },
    creditCard: { type: Schema.Types.ObjectId, ref: 'CreditCard' },
    productName: { type: String, required: true },
    paymentMonth: { type: String, required: true },
    pg: { type: Boolean, default: false }
});

exports.default = _mongoose2.default.model('Register', RegisterSchema);
//# sourceMappingURL=register-model.js.map