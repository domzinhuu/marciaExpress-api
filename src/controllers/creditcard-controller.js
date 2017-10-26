import _ from 'lodash'
import slugify from 'slugify'
import { Router } from 'express'
import { verifyIfUserLoggedIsAdmin, authenticate, verifyIfUserIsAdmin, validateToken } from '../middleware/auth'
import Response from '../utils/response'
import CreditCard from '../models/credit-card'

export default ({ config, db }) => {
    let api = Router()
    let jsonResponse = new Response()

    //POST ADD /api/cards
    api.post('', validateToken, authenticate, (req, res) => {
        let data = req.body

        req.assert('name', 'O nome do cartão é obrigatório.').notEmpty()
        req.assert('number', 'O numero do cartão é obrigatorio').notEmpty()
        req.assert('payday', 'O vencimento é obrigatorio').notEmpty()

        req.getValidationResult().then(result => {
            if (!result.isEmpty()) {

                jsonResponse.data = null
                jsonResponse.messages = _.map(result.array(), value => value.msg)
                jsonResponse.error = 'validationErrors'
                res.status(400).json(jsonResponse)
                return;
            }

            let creditCard = new CreditCard(data)

            creditCard.slug = slugify(creditCard.name, '_')

            creditCard.save((error, saved) => {

                if (error) {
                    jsonResponse.data = null
                    jsonResponse.messages.push('Ouve erro interno Entrou aqui')
                    jsonResponse.error = error
                    res.status(500).json(jsonResponse)
                    return;
                }

                jsonResponse.data = saved
                jsonResponse.messages.push('Cartão adicionado com sucesso');
                jsonResponse.error = null

                res.status(200).json(jsonResponse)
            })
        })
    })

    //PUT EDIT /api/cards
    api.put('', validateToken, authenticate, (req, res) => {
        const card = req.body
        let jsonResponse = new Response()

        CreditCard.findByIdAndUpdate(card._id, card, (err, updatedCard) => {
            if (err) {
                jsonResponse.data = null
                jsonResponse.messages.push('Ouve erro interno')
                jsonResponse.error = err
                res.status(500).json(jsonResponse)
                return;
            }

            jsonResponse.data = updatedCard
            jsonResponse.messages.push('Cartão atualizado com sucesso')
            jsonResponse.error = null
            res.status(200).json(jsonResponse)
        })
    })

    //GET ALL /api/cards
    api.get('', validateToken, authenticate, (req, res) => {
        const query = req.query.query || ''
        const active = req.query.active

        let criteria = [{ name: { $regex: query, $options: 'i' } }]

        if (active != undefined) {
            criteria.push({ active: active })
        }

        let jsonResponse = new Response()

        CreditCard.find({ $and: criteria }, (err, cards) => {
            if (err) {
                jsonResponse.data = null
                jsonResponse.messages.push('Ouve erro interno')
                jsonResponse.error = err
                res.status(500).json(jsonResponse)
            }

            jsonResponse.data = _.orderBy(cards, ['name'], ['asc'])
            jsonResponse.messages = ['Lista carregada']
            jsonResponse.error = null
            res.status(200).json(jsonResponse)
        })
    })

    //GET BEST /api/cards/best/cards
    api.get('/best/cards', validateToken, authenticate, (req, res) => {
        CreditCard.find().select('name used').sort('-used name').limit(3).exec((err, result) => {
            if (err) {
                res.status(500).json({ msg: 'error na formação da query', error: err })
                return;
            }
            res.status(200).json(result)
        })
    })

    //GET ONE /api/cards/:id
    api.get('/:id', validateToken, authenticate, (req, res) => {
        const id = req.params.id
        let jsonResponse = new Response()

        CreditCard.findById(id, (err, result) => {
            if (err) {
                jsonResponse.data = null
                jsonResponse.messages.push('Ouve erro interno')
                jsonResponse.error = err
                res.status(500).json(jsonResponse)
                return;
            }

            jsonResponse.data = result
            jsonResponse.messages.push('Cartão Carregado!')
            jsonResponse.error = null
            res.status(200).json(jsonResponse)
        })
    })

    api.put('/:id', validateToken, authenticate, (req, res) => {
        const cardId = req.params.id
        let jsonResponse = new Response()

        CreditCard.findById(cardId, (err, card) => {
            if (err) {
                jsonResponse.data = null
                jsonResponse.messages.push('Ouve erro interno')
                jsonResponse.error = err
                res.status(500).json(jsonResponse)
                return;
            }
            card.set({ active: !card.active })
            card.save((err, updated) => {
                jsonResponse.data = updated
                jsonResponse.messages.push(`Seu cartão foi ${!updated.active ? 'reativado' : 'desativado'} com sucesso.`)
                jsonResponse.error = null
                res.status(200).json(jsonResponse)
            })
        })
    })
    return api
}
