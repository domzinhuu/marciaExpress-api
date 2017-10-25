import mongoose from 'mongoose'
const Schema = mongoose.Schema

require('mongoose-currency').loadType(mongoose)
const Currency = mongoose.Types.Currency

let CreditCardSchema = new Schema({
    slug: { type: String },
    name: { type: String, required: true },
    number: { type: String, required: true },
    payday: { type: Number, required: true },
    limit: { type: Currency },
    actualLimit: { type: Currency },
    active: { type: Boolean, default: true },
    used: { type: Number, default: 0 }
})

export default mongoose.model('CreditCard', CreditCardSchema)