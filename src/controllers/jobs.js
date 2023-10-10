const { Op } = require('sequelize');

async function getUnpaidJobs(req, res) {
    const { Job, Contract } = req.app.get('models');
    const profileId = req.profile.dataValues.id;

    // Get all contracts for profile
    const contracts = await Contract.findAll({
        where: {
            [Op.or]: [
                { ClientId: profileId },
                { ContractorId: profileId },
            ],
            [Op.and]: [{ status: 'in_progress' }],
        },
    });

    // Extract Ids from contracts
    const contractIds = contracts.map((contract) => contract.dataValues.id);

    // Get all jobs for contracts
    const jobs = await Job.findAll({
        where: {
            ContractId: contractIds,
            paid: null,
        },
    });

    if (!jobs) {
        return res.status(404).json({ message: 'No jobs found' }).end();
    }

    return res.status(200).json(jobs).end();
};

async function payJob(req, res) {
    const { Job, Contract, Profile } = req.app.get('models');
    const profileId = req.profile.dataValues.id;

    // Get job
    const job = await Job.findOne({
        where: {
            id: req.params.job_id,
        },
    })

    // Check if job exists
    if (!job) {
        return res.status(404).json({ message: 'Job not found' }).end();
    }

    // Get contract
    const contractId = job.dataValues.ContractId;

    const contract = await Contract.findOne({
        where: {
            id: contractId,
        },
    });

    // Check if cprofile id is client in this contract
    if (contract.dataValues.ClientId !== profileId) {
        return res.status(401).json({ message: 'Profile is not client in this contract' }).end();
    }

    // Check if contract is in progress
    if (contract.dataValues.status !== 'in_progress') {
        return res.status(400).json({ message: 'Contract is not in progress' }).end();
    }

    // Check if job is paid
    if (job.dataValues.paid == 1) {
        return res.status(400).json({ message: 'Job already paid' }).end();
    }

    // Get client profile and balance
    const clientProfile = await Profile.findOne({
        where: {
            id: profileId,
        },
    });

    const clientBalance = clientProfile.dataValues.balance;
    const jobPrice = job.dataValues.price;

    // Check if client has enough money
    if (clientBalance < jobPrice) {
        return res.status(400).json({ message: 'Client does not have enough money' }).end();
    }

    // Transfer funds
    const contractorId = contract.dataValues.ContractorId;

    const contractorProfile = await Profile.findOne({
        where: {
            id: contractorId,
        },
    });

    contractorProfile.balance += jobPrice;
    clientProfile.balance -= jobPrice;
    contractorProfile.save();
    clientProfile.save();

    // Update job
    job.paid = 1;
    job.paymentDate = Date.now();
    job.save();

    // Update contract if there is no other job
    const jobsLeft = await Job.findAll({
        where: {
            ContractId: contractId,
        },
    });

    if (jobsLeft.length == 0) {
        contract.status = 'terminated';
        contract.save();
    }

    return res.status(200).json({
        message: 'Job paid',
        contractorBalance: contractorProfile.balance,
        clientBalance: clientProfile.balance
    }).end();


}

module.exports = {
    getUnpaidJobs,
    payJob
};