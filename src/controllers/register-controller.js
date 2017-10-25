import _ from 'lodash';
import { Router } from 'express'
import { verifyIfUserLoggedIsAdmin, authenticate, validateToken, verifyIfUserIsAdmin } from '../middleware/auth';

import Response from '../utils/response';
import User from '../models/user-model';
import Register from '../models/register-model';

import CreditCard from '../models/credit-card';

import { MONTHS } from '../utils/variables'

export default ({ config, db }) => {
    let api = Router();

    //POST ADD /api/registers
    api.post('', validateToken, verifyIfUserIsAdmin, authenticate, (req, res) => {

        let jsonResponse = new Response();
        let data = req.body;
        validate(req).then(result => {

            if (result.hasError) {
                jsonResponse.data = null;
                jsonResponse.messages = result.errors;
                jsonResponse.error = 'validationError';
                res.status(400).json(jsonResponse);
                return;

            }

            let register = new Register(data);

            register.save((err) => {
                if (err) {
                    jsonResponse.data = null
                    jsonResponse.messages.push('Ouve erro interno')
                    jsonResponse.error = err
                    res.status(500).json(jsonResponse);
                    return;
                }

                getFirsPaymentDate(register.creditCard, register.paymentMonth).then(firstDate => {
                    let paymentDate = firstDate
                    let installmentValue = register.value / register.installmentNumber

                    for (let i = 0; i < register.installmentNumber; i++) {

                        let nextPaymentDate = new Date(paymentDate.getTime())

                        let installment = {}
                        installment.value = installmentValue
                        installment.paymentDate = nextPaymentDate
                        installment.paymentMonth = MONTHS[paymentDate.getMonth()]
                        installment.paymentYear = paymentDate.getFullYear()
                        installment.number = i + 1
                        register.installments.push(installment)

                        paymentDate.setMonth(paymentDate.getMonth() + 1)
                    }
                    register.save(() => {
                        jsonResponse.data = register;
                        jsonResponse.messages.push('Registro adicionado com sucesso');
                        jsonResponse.error = null;

                        User.findById(register.user, (err, userFound) => {
                            userFound.spendTotal += register.value

                            userFound.save(err => {

                                CreditCard.findById(register.creditCard, (err, cardFound) => {
                                    cardFound.used += 1
                                    cardFound.save()
                                    res.status(200).json(jsonResponse);
                                })
                            })
                        })

                    });
                })

            })
        })

    })

    //GET ALL REGISTER FOR A USER /api/registers/my
    api.get('', validateToken, verifyIfUserIsAdmin, authenticate, (req, res) => {
        let jsonResponse = new Response();
        const criteria = getCriteriaParams(req)

        Register
            .find({ $and: createCriteria(criteria.month, criteria.year, criteria.cardId, criteria.userId) })
            .populate({ path: 'user', select: 'completeName' })
            .populate({ path: 'creditCard', select: 'name' })
            .exec((err, registers) => {
                res.status(200).json(registers)
            })

    });

    //GET ALL REGISTER OF THE USER /api/registers/user/:id
    api.get('/user/:id', validateToken, authenticate, (req, res) => {

        let forUserId = req.params.id;
        let jsonResponse = new Response();

        User.findById(req.user.id, (err, userAuthenticated) => {
            if (err) {
                jsonResponse.data = null;
                jsonResponse.messages.push('Ouve erro interno');
                jsonResponse.error = err;
                res.status(500).json(jsonResponse);
                return;
            }

            if (userAuthenticated.isAdmin) {
                findRegisterOf(forUserId, jsonResponse).then((response) => {
                    if (response.error) {
                        res.status(500).json(response);
                        return;
                    }

                    res.status(200).json(response);
                });

            } else {
                jsonResponse.data = null;
                jsonResponse.messages.push('Apenas administradores podem usar esse recurso.');
                jsonResponse.error = 'userNotAdmin';

                res.status(403).json(jsonResponse);
            }

        });

    });

    //PUT EDIT REGISTER /api/registers/:id
    api.put('/:id', validateToken, authenticate, (req, res) => {
        let data = req.body;
        let jsonResponse = new Response();

        verifyIfUserLoggedIsAdmin(jsonResponse, req, res, () => {
            validate(req).then(response => {
                if (response.hasError) {
                    res.status(500).json(response);
                    return;
                }

                Register.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true, upsert: false },
                    (err, updated) => {
                        if (err) {
                            jsonResponse.data = null;
                            jsonResponse.messages.push('Ouve erro interno')
                            jsonResponse.error = err;
                            res.status(500).json(jsonResponse);
                            return;
                        }
                        jsonResponse.data = updated;
                        jsonResponse.messages.push('Registro atualizado com sucesso')
                        jsonResponse.error = null;

                        res.status(200).json(jsonResponse);

                    });

            })
        });
    });

    //DELETE REGISTER /api/registers
    api.delete('/:id', validateToken, authenticate, (req, res) => {

        let jsonResponse = new Response();

        verifyIfUserLoggedIsAdmin(jsonResponse, req, res, () => {
            Register.findByIdAndRemove(req.params.id, (err, register) => {
                if (err) {
                    jsonResponse.data = null;
                    jsonResponse.messages.push('Ouve error interno');
                    jsonResponse.error = err;
                    res.status(500).json(jsonResponse);
                }

                User.findById(register.user, (err, userFound) => {
                    userFound.spendTotal -= register.value

                    userFound.save(err => {
                        console.log(register)
                        CreditCard.findById(register.creditCard, (err, cardFound) => {
                            cardFound.used -= 1

                            cardFound.save()

                            jsonResponse.data = register;
                            jsonResponse.messages.push('Registro removido com sucesso');
                            jsonResponse.error = null;
                            res.status(200).json(jsonResponse);
                        })
                    })
                })
            });
        });
    });

    return api;
}


function validate(req) {

    req.assert('buyAt', `O campo 'data de compra' é obrigatorio`).notEmpty()
    req.assert('value', `O campo 'preço' é obrigatorio`).notEmpty()
    req.assert('productName', `O campo 'nome do produto' é obrigatorio`).notEmpty()
    req.assert('creditCard', 'É necessario informar o cartão usado').notEmpty()
    req.assert('local', 'Informe onde realizou a compra').notEmpty()
    req.assert('paymentMonth', `O campo 'mês de pagamento' é obrigatorio`).notEmpty()


    return new Promise((resolve) => {

        req.getValidationResult().then((result) => {
            resolve({ hasError: !result.isEmpty(), errors: _.map(result.array(), error => error.msg) });
        });
    })
}

function findRegisterOf(id, jsonResponse) {

    return new Promise(resolve => {
        Register.find({ user: id }, (err, registers) => {

            jsonResponse.data = registers;
            jsonResponse.messages.push('Registros carregados');
            jsonResponse.error = null;

            if (err) {
                jsonResponse.data = null;
                jsonResponse.messages = [];
                jsonResponse.messages.push('Ouve erro interno');
                jsonResponse.error = err;
            }


            resolve(jsonResponse)

        });
    });
}

function createCriteria(month, year, card, user) {

    let criteria = [{ "installments": { $elemMatch: { paymentMonth: month, paymentYear: year } } }]

    if (card != undefined) {
        const queryCard = {
            creditCard: card
        }
        criteria.push(queryCard)
    }

    if (user != undefined) {
        const queryUser = {
            user: user
        }

        criteria.push(queryUser)
    }

    return criteria
}

function getFirsPaymentDate(idCard, paymentMonth) {

    const actualYear = new Date().getFullYear()
    const startMonth = MONTHS.indexOf(paymentMonth)

    return new Promise(resolve => {
        if (idCard) {
            CreditCard.findById(idCard, (err, res) => {
                let firstPayment = new Date(actualYear, startMonth, res.payday)
                resolve(firstPayment)
            })
        } else {
            let firstPayment = new Date(actualYear, startMonth, 5)
            resolve(firstPayment)
        }

    })
}

function getCriteriaParams(req) {
    const month = req.query.month || MONTHS[new Date().getMonth()]
    const year = req.query.year || 2017
    const cardId = req.query.card
    const userId = req.query.user

    return {
        month,
        year,
        cardId,
        userId
    }
}