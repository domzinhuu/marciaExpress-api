import _ from 'lodash'
import jwt from 'jsonwebtoken';
import expresJwt from 'express-jwt';
import Response from '../utils/response';
import User from '../models/user-model';
import config from '../config';

const TOKEN_TIME = '2h';
const SECRET = config.secretKey;

let authenticate = expresJwt({ secret: SECRET });

let accessTokenGeneration = (req, res, next) => {
    req.token = req.token || {};
    req.token = jwt.sign({ id: req.user.id }, SECRET, { expiresIn: TOKEN_TIME });

    next();
}

let respond = (req, res) => {
    let response = new Response();
    response.data = { id: req.user.id, completeName: req.user.completeName, accessToken: req.token }
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
    const userId = req.user ? req.user.id : null;
    const username = req.body.username || null;
    const userAgent = req.headers['user-agent']
    
    if (req.method === "OPTIONS") {
        next();
    }

    // se for acesso mobile, tratar permissao
    if ((_.includes(userAgent, 'Android') || _.includes(userAgent, 'iOS')) && req.body.type && (req.body.type === 'Android' || req.body.type === 'iOS' )) {
        verifyAccessMobile(username).then((jsonResponse) => {

            if (!jsonResponse) { next(); return }
            res.status(403).json(jsonResponse)

        })
        
        // se for acesso web, tratar permissao
    } else {
        verifyAcessWeb(username, userId).then(result => {

            if (!result) { next(); return; }
            res.status(result.status).json(result.jsonResponse)
        })
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

const verifyAccessMobile = (username) => {
    return new Promise(resolve => {
        let jsonResponse = new Response()

        User.findOne({ username: username }, (err, user) => {
            if (user && user.active && !user.isAdmin) { resolve(null); return; }

            if (user && user.isAdmin) {
                jsonResponse.data = null
                jsonResponse.messages.push('Administradores devem acessar a versão web do aplicativo em: https://marciaexpress.tk')
                jsonResponse.error = 'AdminOnMobile'
                resolve(jsonResponse)
                return;
            }
            if (user && !user.active) {
                jsonResponse.data = null
                jsonResponse.messages.push('Seu acesso foi bloqueado pelo administrador, entre em contato se achar que foi um erro.')
                jsonResponse.error = 'BlockedUser'
                resolve(jsonResponse)
                return
            }

            resolve(null)
        })
    })

}

const verifyAcessWeb = (username, userId) => {
    let jsonResponse = new Response();

    return new Promise(resolve => {
        if (userId && !username) {
            User.findById(req.user.id, (err, user) => {
                if (err) {
                    jsonResponse.messages.push('Ouve errors internos na verificação de usuario logado como admin');
                    jsonResponse.data = null;
                    jsonResponse.error = 'AdminUsernotFound';
                    resolve({ jsonResponse, status: 500 })
                    return;
                }

                if (!user.isAdmin) {
                    jsonResponse.messages.push('Apenas administradores podem realizar esta operação');
                    jsonResponse.data = null;
                    jsonResponse.error = 'UserNotAdmin';
                    resolve({ jsonResponse, status: 403 })
                    return;
                }

                resolve(null)
                return
            });

        } else if (username && !userId) {
            User.findOne({ username: username }, (err, user) => {
                if (err) {
                    jsonResponse.messages.push('Ouve errors internos na verificação de usuario logado como admin');
                    jsonResponse.data = null;
                    jsonResponse.error = 'AdminUsernotFound';
                    resolve({ jsonResponse, status: 500 })
                    return;
                }

                if (!user) {
                    jsonResponse.messages.push('Nenhum usuario encontrado com as credenciais informada.');
                    jsonResponse.data = null;
                    jsonResponse.error = 'UserNotExists';
                    resolve({ jsonResponse, status: 403 })
                    return;
                }

                if (!user.isAdmin) {
                    jsonResponse.messages.push('Apenas administradores podem realizar esta operação');
                    jsonResponse.data = null;
                    jsonResponse.error = 'UserNotAdmin';
                    resolve({ jsonResponse, status: 403 })
                    return;
                }

                resolve(null)
            });
        } else {
            resolve(null)
        }
    })
}

module.exports = {
    authenticate,
    accessTokenGeneration,
    respond,
    verifyIfUserLoggedIsAdmin,
    verifyIfUserIsAdmin,
    validateToken
}