const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./model')
const { getProfile } = require('./middleware/getProfile')
const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)
const { Op } = require("sequelize");

/**
 * FIX ME!
 * @returns contract by id
 */
app.get('/contracts/:id', getProfile, async (req, res) => {
    const { Contract } = req.app.get('models')
    const profileId = req.profile.dataValues.id
    const { id } = req.params
    const contract = await Contract.findOne({ where: { id } })
    if (!contract
    )
        return res.status(404).end()


    if (!(contract.ClientId == profileId || contract.ContractorId == profileId)) {
        return res.status(401).json({ message: 'Profile is not part of this contract' }).end()
    }
    res.json(contract)
})


app.get('/contracts', getProfile, async (req, res) => {
    const { Contract } = req.app.get('models')
    const profileId = req.profile.dataValues.id
    const contracts = await Contract.findAll({
        where: {
            [Op.or]: [
                { ClientId: profileId },
                { ContractorId: profileId }
            ],
            [Op.and]: [
                { status: { [Op.ne]: 'terminated' } }
            ]
        }
    })

    if (!contracts)
        return res.status(404).json({ message: "No contracts found" }).end()
    res.json(contracts)

})

app.get('/jobs/unpaid', getProfile, async (req, res) => {
    const { Job, Contract } = req.app.get('models')
    const profileId = req.profile.dataValues.id

    // Get all contracts for profile
    const contracts = await Contract.findAll({
        where: {
            [Op.or]: [
                { ClientId: profileId },
                { ContractorId: profileId }
            ],
            [Op.and]: [
                { status: 'in_progress' }
            ]
        }
    })

    // Extract Ids from contracts
    const contractIds = contracts.map(contract => contract.dataValues.id)

    // Get all jobs for contracts

    const jobs = await Job.findAll({
        where: {
            ContractId: contractIds,
            paid: null
        }
    })


    if (!jobs)
        return res.status(404).json({ message: "No jobs found" }).end()
    res.json(jobs)

})



module.exports = app;
