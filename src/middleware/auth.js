import jwt from 'jsonwebtoken';
import expresJwt from 'express-jwt';
import Response from '../utils/response';
import User from '../models/user-model';
import * as env from '../.env'

const TOKEN_TIME = '2h';
const SECRET = env.secretKey;

let authenticate = expresJwt({ secret: SECRET });

let accessTokenGeneration = (req, res, next) => {
    req.token = req.token || {};
    req.token = jwt.sign({ id: req.user.id }, SECRET, { expiresIn: TOKEN_TIME });

    next();
}

let respond = (req, res) => {
    let response = new Response();
    response.data = {id:req.user.id,completeName: req.user.completeName, accessToken: req.token }
    response.messages.push('usuario autenticado');
    response.error = null;

    res.status(200).json(response);
}

let verifyIfUserLoggedIsAdmin = (jsonResponse, req, res, callback) => {

    User.findById(req.user.id, (err, user) => {
        if (err) {
            jsonResponse.messages.push('Ouve errors internos na verificação de usuario logado como admin');
            jsonResponse.data = null;
            jsonResponse.error = 'AdminUsernotFound';
            res.status(500).json(jsonResponse);
            return;
        }

        if (!user.isAdmin) {
            jsonResponse.messages.push('Apenas administradores podem realizar esta operação');
            jsonResponse.data = null;
            jsonResponse.error = 'UserNotAdmin';
            res.status(403).json(jsonResponse);
            return;
        }

        callback();
    });
}

let verifyIfUserIsAdmin = (req, res, next) => {
    const jsonResponse = new Response();
    const userId = req.user ? req.user.id : null;
    const username = req.body.username || null;

    if(req.method === "OPTIONS"){
        next();
    }
    if (userId && !username) {
        User.findById(req.user.id, (err, user) => {
            if (err) {
                jsonResponse.messages.push('Ouve errors internos na verificação de usuario logado como admin');
                jsonResponse.data = null;
                jsonResponse.error = 'AdminUsernotFound';
                res.status(500).json(jsonResponse);
                return;
            }
            
            if (!user.isAdmin) {
                jsonResponse.messages.push('Apenas administradores podem realizar esta operação');
                jsonResponse.data = null;
                jsonResponse.error = 'UserNotAdmin';
                res.status(403).json(jsonResponse);
                return;
            }

            next();
        });
    } else if (username && !userId) {
        User.findOne({ username:username }, (err, user) => {
            if (err) {
                jsonResponse.messages.push('Ouve errors internos na verificação de usuario logado como admin');
                jsonResponse.data = null;
                jsonResponse.error = 'AdminUsernotFound';
                res.status(500).json(jsonResponse);
                return;
            }

            if (!user.isAdmin) {
                jsonResponse.messages.push('Apenas administradores podem realizar esta operação');
                jsonResponse.data = null;
                jsonResponse.error = 'UserNotAdmin';
                res.status(403).json(jsonResponse);
                return;
            }

            next();
        });
    }else{
        next();
    }
}

let validateToken = (req, res, next) => {
    let response = new Response();

    if (req.method === "OPTIONS") {
        next()
    } else {
        const bearerToken = req.headers['authorization']

        if (!bearerToken) {
            response.messages.push('O Token não foi enviado');
            response.error = 'noTokenProvider'

            return res.status(401).json(response)
        }

        const token = bearerToken.replace('Bearer ', '');

        jwt.verify(token, SECRET, (err) => {
            if (err) {
                response.messages.push('O Token expirado ou invalido');
                response.error = err
                return res.status(403).json(response)
            }

            next()
        })
    }

}

module.exports = {
    authenticate,
    accessTokenGeneration,
    respond,
    verifyIfUserLoggedIsAdmin,
    verifyIfUserIsAdmin,
    validateToken
}