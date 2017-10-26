import mongoose from 'mongoose';
import config from './config'

export default cb => {
    mongoose.Promise = global.Promise;
    let db = mongoose.connect(config.mongooseUrl, {
        useMongoClient: true
    });
    cb(db)
} 