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

    return jobs;
};

module.exports = {
    getUnpaidJobs,
};