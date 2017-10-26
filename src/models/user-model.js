import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';

require('mongoose-currency').loadType(mongoose);
const Currency = mongoose.Types.Currency;

let Schema = mongoose.Schema;

let UserSchema = new Schema({
    slug: { type: String },
    active: { type: Boolean, default: true },
    completeName: { type: String, required: true },
    cellphone: { type: String, required: true },
    username: { type: String, required: true },
    profileImg: { type: String },
    spendTotal: { type: Currency, default: 0 },
    isAdmin: { type: Boolean, default: false }
});

UserSchema.plugin(passportLocalMongoose, {
    usernameField: 'username',
    passwordField: 'password',
    usernameLowerCase: true
});
export default mongoose.model('User', UserSchema);

