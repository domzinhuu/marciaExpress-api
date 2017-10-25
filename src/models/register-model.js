import mongoose from 'mongoose';
const Schema = mongoose.Schema;

require('mongoose-currency').loadType(mongoose);
const Currency = mongoose.Types.Currency;

let RegisterSchema = new Schema({

    user: { type: Schema.Types.ObjectId, ref: 'User' },
    creditCard:{type:Schema.Types.ObjectId, ref:'CreditCard'},
    registeredAt: { type: Date, default: new Date() },
    productName: { type: String, required: true },
    paymentMonth: { type: String, required: true },
    local:{type:String,required:true},
    buyAt: { type: Date, required: true },    
    value: { type: Currency, required: true },
    installmentNumber:{type:Number,required:true},
    installments:[{
        number:{type:Number,required:true},
        value: { type: Currency, required: true },
        paymentMonth:{type:String,require:true},
        paymentYear:{type:Number,require:true},
        paymentDate: { type: Date, required: true },
        pg:{type:Boolean,default:false}
    }],
    
    
});

export default mongoose.model('Register', RegisterSchema);