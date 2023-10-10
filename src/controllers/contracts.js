const { Op } = require("sequelize");


async function getContractsById(req, res) {
    const { Contract } = req.app.get('models')
    const profileId = req.profile.dataValues.id
    const { id } = req.params
    console.log("hola")
    const contract = await Contract.findOne({ where: { id } })
    if (!contract
    )
        return res.status(404).end()


    if (!(contract.ClientId == profileId || contract.ContractorId == profileId)) {
        return res.status(401).json({ message: 'Profile is not part of this contract' }).end()
    }
    console.log(contract)
    return contract
}
async function getContracts(req, res) {
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

    return contracts
}

module.exports = {
    getContractsById,
    getContracts
}