import express from 'express';
import http from 'http';
import bodyParse from 'body-parser';
import expresValidator from 'express-validator';
import passport from 'passport'

import User from './models/user-model';
import config from './config';
import routes from './routes';

// create server
const app = express();
app.server = http.createServer(app);

// middlewars
app.use(bodyParse.urlencoded({ extended: true }));
app.use(bodyParse.json({ limit: config.bodyLimit }));
app.use(expresValidator());

app.use((req, res, next) => {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', true);

    next();
});


// passport configs
app.use(passport.initialize());

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// routes
app.use('/api', routes);

export default app;
