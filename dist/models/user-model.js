'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _passportLocalMongoose = require('passport-local-mongoose');

var _passportLocalMongoose2 = _interopRequireDefault(_passportLocalMongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Schema = _mongoose2.default.Schema;

var UserSchema = new Schema({
    slug: { type: String },
    completeName: { type: String, required: true },
    cellphone: { type: String, required: true },
    username: { type: String, required: true },
    profileImg: { type: String },
    isAdmin: { type: Boolean, default: false }
});

UserSchema.plugin(_passportLocalMongoose2.default, {
    usernameField: 'username',
    passwordField: 'password',
    usernameLowerCase: true
});
exports.default = _mongoose2.default.model('User', UserSchema);
//# sourceMappingURL=user-model.js.map