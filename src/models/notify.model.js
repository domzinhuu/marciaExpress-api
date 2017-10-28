import mongoose from 'mongoose'
const Schema = mongoose.Schema

let NotifySchema = new Schema({

    user: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    message: { type: String, required: true },
    registeredAt: { type: Date, default: new Date() },
    read: { type: Boolean, default: false }
})

export default mongoose.model('Notify', NotifySchema)