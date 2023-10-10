const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./model')
const { getProfile } = require('./middleware/getProfile')
const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)
const { getUnpaidJobs, payJob } = require('./controllers/jobs');
const { getContractsById, getContracts } = require('./controllers/contracts');
const { addBalance } = require('./controllers/balances');

app.get('/contracts/:id', getProfile, async (req, res) => {
    return await getContractsById(req, res)
})


app.get('/contracts', getProfile, async (req, res) => {
    return await getContracts(req, res)
})

app.get('/jobs/unpaid', getProfile, async (req, res) => {
    return await getUnpaidJobs(req, res);
})

app.post('/jobs/:job_id/pay', getProfile, async (req, res) => {
    return await payJob(req, res)
})

app.post('/balances/deposit/:userId', async (req, res) => {
    return await addBalance(req, res)
})


module.exports = app;
