import _ from 'lodash';
import { Router } from 'express'
import { verifyIfUserLoggedIsAdmin, authenticate, validateToken, verifyIfUserIsAdmin } from '../middleware/auth';

import Response from '../utils/response';
import User from '../models/user-model';
import Register from '../models/register-model';

import CreditCard from '../models/credit-card';
import Notify from '../models/notify.model';

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
            let dayPlusOne = register.buyAt.getDate() + 1
            register.buyAt.setDate(dayPlusOne)

            register.save((err) => {
                if (err) {
                    jsonResponse.data = null
                    jsonResponse.messages.push('Ouve erro interno')
                    jsonResponse.error = err
                    res.status(500).json(jsonResponse);
                    return;
                }

                getFirsPaymentDate(register.creditCard, register.paymentMonth,data.payYear).then(firstDate => {
                    let paymentDate = firstDate
                    let installmentValue = register.value / register.installmentNumber
                    let installs = []
                    for (let i = 0; i < register.installmentNumber; i++) {
                        
                        let nextPaymentDate = new Date(paymentDate.getTime())

                        let installment = {}
                        installment.value = installmentValue
                        installment.paymentDate = nextPaymentDate
                        installment.paymentMonth = MONTHS[paymentDate.getMonth()]
                        installment.paymentYear = paymentDate.getFullYear()
                        installment.number = i + 1

                        installs.push(installment)
                        paymentDate.setMonth(paymentDate.getMonth() + 1)
                    }
                    
                    register.installments = installs
                    register.save((err,result) => {
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
    api.get('', validateToken, authenticate, (req, res) => {
        let jsonResponse = new Response();
        const criteria = getCriteriaParams(req)
        Register
            .find({ $and: createCriteria(criteria.month, criteria.year, criteria.cardId, criteria.userId) })
            .populate({ path: 'user', select: 'completeName' })
            .populate({ path: 'creditCard', select: 'name description payday' })
            .exec((err, registers) => {
                res.status(200).json(registers)
            })

    });

    //GET ALL REGISTER OF THE USER /api/registers/user/:id
    api.get('/user/:id', validateToken, authenticate, (req, res) => {
        const userId = req.params.id;
        let month = MONTHS[new Date().getMonth()]
        let year = new Date().getFullYear()


        if(new Date().getDate() >= 25){
            if(month.toLocaleLowerCase() === 'dezembro'){
                month = MONTHS[0];
                year += 1;
            }else{
                month = MONTHS[new Date().getMonth()+1]
            }

            console.log(month,year);

        }
        const criteria = createCriteria(month, year, undefined, userId)

        Register.find({ $and: criteria }).populate({ path: 'creditCard', select: 'name description' }).exec((err, registers) => {

            if (err) {
                jsonResponse.data = null
                jsonResponse.messages.push('Ouve erro interno')
                jsonResponse.error = err
                res.status(500).json(jsonResponse)
                return
            }

            let jsonResponse = new Response()
            jsonResponse.data = getHomeDataMobile(registers, month, year);
            jsonResponse.messages.push('Registros carregados');
            jsonResponse.error = null;
            res.status(200).json(jsonResponse)

        });

    });

    api.get('/user/:id/history', validateToken, authenticate, (req, res) => {
        const userId = req.params.id
        let initDate = new Date(new Date().getFullYear(), 0, 1, 0, 0, 0);
        let lastDate = new Date()

        Register.find({ $and: [{ user: userId }, { buyAt: {$gte: initDate,$lte: lastDate} }] }
            , (err, result) => {
                
                let mapeadoErdernado = _.orderBy(_.map(result,(item)=>{
                    return {
                        buyAt:item.buyAt,
                        local:item.local,
                        product:item.productName,
                        value:item.value,
                        buyAtMonth:MONTHS[item.buyAt.getMonth()],
                        paymentMonth:item.paymentMonth
                    }
                }),['buyAt'],['asc'])

                let agrupado = _.groupBy(mapeadoErdernado,'buyAtMonth')
                res.status(200).json(_.values(agrupado))
            }

        )
    })

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

    //POST NOTIFY /api/registers/save/notify
    api.post('/save/notify', (req, res) => {
        const data = req.body
        let jsonResponse = new Response()

        let notify = new Notify(data)

        notify.save((err, saved) => {
            if (err) {
                jsonResponse.data = null
                jsonResponse.messages.push('Ouve erro interno')
                jsonResponse.error = err
                res.status(500).json(jsonResponse)
                return
            }

            jsonResponse.data = saved
            jsonResponse.messages.push('Notificação enviada com sucesso.')
            jsonResponse.error = null
            res.status(200).json(jsonResponse)
        })
    })

    //GET ALL notifitions /api/registers/notify/all
    api.get('/notify/all', validateToken, authenticate, (req, res) => {
        const dayAgo = req.query.dayAgo || 15
        const read = req.query.read || undefined
        const dateFilter = new Date()
        dateFilter.setDate(dateFilter.getDate() - dayAgo)

        let criteria = [{ registeredAt: { $gte: dateFilter } }]

        if (read != undefined) {
            criteria.push({ read: read })
        }

        Notify.find({ $and: criteria }).populate({ path: 'user', select: 'username' }).exec((err, notifies) => {
            const news = _.filter(notifies, ['read', false]).length
            notifies = _.orderBy(notifies, ['registeredAt'], ['desc'])
            res.status(200).json({ notifies, news })
        })
    })




    //PUT Notify /api/registers/notify/:id
    api.put('/notify/:id', validateToken, authenticate, (req, res) => {
        const id = req.body.id

        Notify.findById(id, (err, notify) => {
            if (err) {
                res.status(500).json({ data: null, messages: ['Ouve algum erro'], error: err })
                return
            }mês
            notify.read = !notify.read
            notify.save((err) => {
                res.status(200).json({ msg: 'Operação concluida' })
            })
        })
    })

    //PUT Notify /api/registers/notify/:id
    api.put('/notify/check/all', validateToken, authenticate, (req, res) => {


        Notify.update({ read: false }, { $set: { read: true } }, { multi: true }, (err) => {
            if (err) {
                res.status(500).json({ data: null, messages: ['Ouve algum erro'], error: err })
                return
            }

            res.status(200).json({ msg: 'Tudo atualizado' })
        })
    })


    return api;
}


function validate(req) {

    req.assert('buyAt', `O campo 'data de compra' é obrigatorio`).notEmpty()
    req.assert('value', `O campo 'preço' é obrigatorio`).notEmpty()
    req.assert('productName', `O campo 'nome do produto' é obrigatorio`).notEmpty()
    req.assert('creditCard', 'É necessario informar o cartão usado').notEmpty()
    req.assert('local', 'Informe onde realizou a compra').notEmpty()
    req.assert('paymentMonth', `O campo 'mês de pagamento' é obrigatorio`).notEmpty()
    req.assert('payYear', `O campo 'ano de pagamento' é obrigatorio`).notEmpty()

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

function getFirsPaymentDate(idCard, paymentMonth,paymentYear) {

    const startMonth = MONTHS.indexOf(paymentMonth)

    return new Promise(resolve => {
        if (idCard) {
            CreditCard.findById(idCard, (err, res) => {
                let firstPayment = new Date(paymentYear, startMonth, res.payday)
                resolve(firstPayment)
            })
        } else {
            let firstPayment = new Date(paymentYear, startMonth, 5)
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

function getHomeDataMobile(registers, month, year) {
    const byCard = _.groupBy(registers, 'creditCard.name')
    const mapValue = []

    _.forEach(byCard, (cardList) => {
        let oneCard = {
            name: `${cardList[0].creditCard.name}`,
            description:`Pagamento: ${cardList[0].creditCard.description}`
        }

        let myValues = _.map(cardList, (card) => {
            const installment = _.find(card.installments, (item) => (item.paymentMonth === month && item.paymentYear == year))
            return {
                value: installment.value,
                paymentDate: installment.paymentDate
            }
        })
        oneCard.paymentDate = myValues[0].paymentDate
        oneCard.value = _.sumBy(myValues, 'value')
        oneCard.value = oneCard.value / 100
        oneCard.id = cardList[0].creditCard._id
        mapValue.push(oneCard)
    })

    return {
        cardList: _.orderBy(mapValue, ['paymentDate'], ['asc']),
        totalPeriod: _.sumBy(mapValue, 'value')
    }
}