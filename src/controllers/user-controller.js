import _ from 'lodash';
import slugify from 'slugify'
import { Router } from 'express';
import User from '../models/user-model';
import Response from '../utils/response';
import passport from 'passport';

import { accessTokenGeneration, respond, authenticate, verifyIfUserIsAdmin, validateToken } from '../middleware/auth';

export default ({ config, db }) => {
    let api = Router();


    //POST ADD /api/users/
    api.post('', (req, res) => {

        let response = new Response();
        let data = req.body;

        req.assert('completeName', 'Informe o nome do usuario').notEmpty();
        req.assert('cellphone', 'Informe um numero').notEmpty();
        req.assert('username', 'informe um nome de usuario ').notEmpty();
        req.assert('password', 'informe uma senha').notEmpty();
        req.assert('completeName', 'Informe o nome completo').matches(/[A-Za-z]\w\s[A-Za-z]/g);

        req.getValidationResult().then(result => {

            if (!result.isEmpty()) {
                response.messages = _.map(result.array(), (value) => value.msg);
                response.data = null;
                response.error = 'validationErrors';
                res.status(400).json(response);
                return;
            }

            let user = new User(data);
            user.slug = slugify(user.completeName, '_')
            User.register(user, data.password, (err, createdUser) => {
                if (err) {
                    response.data = null;
                    response.error = err;
                    if (err.name === 'UserExistsError')
                        response.messages.push('Já existe alguem com o mesmo nome de usuario cadastrado.');
                    else {
                        response.messages.push('Ocorreu alguns problemas.');
                    }

                    res.status(500).json(response);
                    return;
                }

                response.data = createdUser;
                response.messages.push('Usuario cadastrado com sucesso');
                response.error = null;
                res.status(200).json(response);
            })
        });

    });

    //POST LOGIN /api/users/login
    api.post('/login', verifyIfUserIsAdmin,
        passport.authenticate('local', { session: false, scope: [] }), accessTokenGeneration, respond);

    //GET ALL /api/users/
  
    api.get('', validateToken, authenticate, (req, res) => {
        const query = req.query.query || ''
        const active = req.query.active

        let response = new Response();
        let criteria = [
            { isAdmin: false },
            { completeName: { $regex: query, $options: 'i' } }
        ]

        if (active != undefined) {
            criteria.push({ active: active })
        }

        User.find({ $and: criteria }, (err, users) => {
            if (err) {
                response.data = null;
                response.messages.push('Ouve errors internos');
                response.err = err;
                res.status(500).json(response);
                return;

            }

            response.data = users;
            response.messages.push('Usuarios carregados');
            response.err = null;

            res.status(200).json(response);
        });
    });

    //GET ONE /api/users/:id
    api.get('/:id', validateToken, authenticate, (req, res) => {
        const id = req.params.id
        let jsonResponse = new Response()

        User.findById(id, (err, result) => {
            if (err) {
                jsonResponse.data = null
                jsonResponse.messages.push('Ouve erro interno')
                jsonResponse.error = err
                res.status(500).json(jsonResponse)
                return
            }

            jsonResponse.data = result
            jsonResponse.messages.push('Usuario Carregado')
            jsonResponse.error = null

            res.status(200).json(jsonResponse)
        })
    })

    api.get('/best/users',validateToken,authenticate,(req,res)=>{

        User.find({}).select('completeName spendTotal').sort('-spendTotal completeName').limit(3).exec((err,result)=>{
            if (err) {
                res.status(500).json({msg:'Ouve um erro na sua Query',error:err})
                return;
            }

            res.status(200).json(result)
        })
    })

    //PUT EDIT /api/users/
    api.put('', validateToken, authenticate, (req, res) => {
        let jsonResponse = new Response();
        let data = req.body;
        let userId = data._id;


        req.assert('completeName', 'Informe o nome do usuario').notEmpty();
        req.assert('cellphone', 'Informe um numero').notEmpty();
        req.assert('completeName', 'Informe o nome completo').matches(/[A-Za-z]\w\s[A-Za-z]/g);

        req.getValidationResult().then(result => {

            if (!result.isEmpty()) {
                jsonResponse.messages = _.map(result.array(), (value) => value.msg);
                jsonResponse.data = null;
                jsonResponse.error = 'validationErrors';
                res.status(400).json(jsonResponse);
                return;
            }

            // segurança para não permitir injeção de dados..
            let updateValues = {
                completeName: data.completeName,
                cellphone: data.cellphone,
                username: data.username
            }

            User.findByIdAndUpdate(userId, updateValues, { new: true, upsert: false, runValidators: true }, (err, updated) => {

                if (err) {
                    jsonResponse.data = null;
                    reponse.error = err;
                    jsonResponse.messages.push('Ouve alguns problemas internos');

                    res.status(500).json(jsonResponse);
                    return;
                }

                jsonResponse.data = updated;
                jsonResponse.messages.push('Usuario atualizado com sucesso');
                jsonResponse.error = null;
                res.status(200).json(jsonResponse);
            });
        });
    });


    //PUT CHANGE STATUS /api/users/status/:id
    api.put('/status/:id', validateToken, authenticate, (req, res) => {
        let jsonResponse = new Response();
        let userId = req.params.id;

        User.findById(userId, (err, user) => {
            if (err) {
                jsonResponse.data = null
                jsonResponse.messages.push('Ouve errors internos')
                jsonResponse.error = err
                res.status(500).json(jsonResponse)
                return;
            }

            user.set({ active: !user.active })
            user.save((err, updatedUser) => {
                if (err) {
                    jsonResponse.data = null
                    jsonResponse.messages.push('Ouve errors internos')
                    jsonResponse.error = err
                    res.status(500).json(jsonResponse)
                    return;
                }

                jsonResponse.data = {}
                jsonResponse.messages.push(`Status atualizado de ${!updatedUser.active ? 'Ativo' : 'Inativo'} para ${updatedUser.active ? 'Ativo' : 'Inativo'} `)
                jsonResponse.error = null
                res.status(200).json(jsonResponse)
            })
        })
    })
    //DELETE /api/users/:id
    api.delete('/:id', validateToken, verifyIfUserIsAdmin, authenticate, (req, res) => {

        let jsonResponse = new Response();
        let deleteUserId = req.params.id;


        User.findByIdAndUpdate(deleteUserId, { active: false }, (err) => {
            if (err) {
                jsonResponse.data = null;
                jsonResponse.messages.push('Ouve errors internos');
                jsonResponse.error = err;
                res.status(500).json(jsonResponse);
                return;
            }

            jsonResponse.data = null;
            jsonResponse.messages.push('Usuario deletado com sucesso');
            jsonResponse.error = null;
            res.status(200).json(jsonResponse);
        });
    });

    return api;
}