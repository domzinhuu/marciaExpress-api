import express from 'express';
import config from '../config';
import middleware from '../middleware'
import initializeDb from '../db'

let router = express();

initializeDb(db => {
    router.use(middleware({ config, db }));
})

export default router;