const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./model')
const { getProfile } = require('./middleware/getProfile')
const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)
const { getUnpaidJobs } = require('./controllers/jobs');
const { getContractsById, getContracts } = require('./controllers/contracts');


app.get('/contracts/:id', getProfile, async (req, res) => {
    const contract = await getContractsById(req, res)
    res.json(contract)
})


app.get('/contracts', getProfile, async (req, res) => {
    const contracts = await getContracts(req, res)
    res.json(contracts)

})

app.get('/jobs/unpaid', getProfile, async (req, res) => {
    const jobs = await getUnpaidJobs(req, res);
    res.json(jobs)
})



module.exports = app;
