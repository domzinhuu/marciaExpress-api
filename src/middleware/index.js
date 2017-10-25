import { Router } from 'express';
import userController from '../controllers/user-controller';
import registerController from '../controllers/register-controller';
import creditCardController from '../controllers/creditcard-controller';

export default ({ config, db }) => {
    let api = Router();
   
    api.use('/users', userController({ config, db }))
    api.use('/registers', registerController({ config, db }))
    api.use('/cards', creditCardController({ config, db }))

    return api;
}