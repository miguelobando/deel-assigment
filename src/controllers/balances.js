const { Op } = require('sequelize');


async function addBalance(req, res) {
    const { Profile, Job, Contract } = req.app.get('models');
    const userId = req.params.userId;

    // Get amount
    const amount = req.body.amount;

    if (!amount) {
        return res.status(400).json({ message: 'Amount is required' }).end();
    }

    // Get profile
    const profile = await Profile.findOne({
        where: {
            id: userId,
        },
    });

    // Check if profile exists
    if (!profile) {
        return res.status(404).json({ message: 'User not found' }).end();
    }

    // Get all contracts where user is client and are not terminated
    const contracts = await Contract.findAll({
        where: {
            [Op.and]: [
                { ClientId: userId },
                { status: { [Op.ne]: 'terminated' } },
            ],
        },
    });

    // Extract Ids from contracts
    const contractIds = contracts.map((contract) => contract.dataValues.id);
    // Get all jobs for contracts
    const jobsToPay = await Job.findAll({
        where: {
            ContractId: contractIds,
            paid: { [Op.ne]: 1 },
        },
    });


    // Calculate the amount to pay
    let totalAmount = 0;
    if (jobsToPay) {
        jobsToPay.forEach((job) => {
            totalAmount += job.dataValues.price;
        });
    }

    // Calculate 25% of the amount to pay
    const maxAmountToDeposit = totalAmount * 0.25;

    // Check if amount is greater than 25% of the amount to pay
    if (amount > maxAmountToDeposit) {
        return res.status(400).json({
            message: 'Amount is too high',
            limit: maxAmountToDeposit,
        }).end();
    }

    // Update balance
    profile.dataValues.balance += amount;
    await profile.save();
    return res.status(200).json({
        message: 'Balance updated',
        balance: profile.dataValues.balance,
    }).end();


}

module.exports = {
    addBalance
}