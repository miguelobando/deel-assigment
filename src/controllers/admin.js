
const { sequelize } = require('../model')

function validateDate(date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(date);
}


async function getBestProfession(req, res) {
    const startDate = req.query.start;
    const endDate = req.query.end;

    if (!startDate || !endDate) {
        return res.status(400)
            .json({ message: "start and end date are required" })
    }

    if (!validateDate(startDate) || !validateDate(endDate)) {
        return res.status(400)
            .json({ message: "start and end date should be in format yyyy-mm-dd" })
    }




    // I know there is a way to do this with sequelize 
    // but i found it easier and shorter to do it in this way
    const result = await sequelize.query(`
    SELECT p.profession, SUM(j.price) AS totalEarnings
    FROM profiles p
    JOIN contracts c ON p.id = c.ContractorId 
    JOIN jobs j ON c.id = j.ContractId
    WHERE j.paymentDate BETWEEN strftime('%d-%m-%Y',${startDate}) 
    AND strftime('%d-%m-%Y',${endDate})
    GROUP BY p.profession
    ORDER BY totalEarnings DESC
    LIMIT 1`, { raw: true })


    if (!result[0].length) {
        return res.status(404)
            .json({ message: "No jobs found in that range" })
    }

    const response = {
        "profession": result[0][0].profession,
        "earnings": result[0][0].totalEarnings
    }


    res.status(200).json(response)
}


module.exports = {
    getBestProfession
}