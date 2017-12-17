import _ from 'lodash'
import { Router } from 'express'
import { username, password } from '../config';

const nodemailer = require('nodemailer');

export default ({ config, db }) => {

    let api = Router()

    api.post('/sendmail', (req, res) => {
        const body = req.body;

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: username,
                pass: password
            }
        });

        transporter.sendMail(body, (error, info) => {

            if (error) {
                res.status(400).json({ error })
                return;
            }

            res.status(200).json({ info })

        });
    })

    return api;
};