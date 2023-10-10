
const { sequelize } = require('../model')
const { Op } = require('sequelize');

function validateFormat(date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(date);
}

function validateDate(startDate, endDate, res) {
    let response = 'OK';
    if (!startDate || !endDate) {
        response = 'start and end date are required'
        // return res.status(400)
        // .json({ message: "start and end date are required" })
    }

    if (!validateFormat(startDate) || !validateFormat(endDate)) {
        response = 'start and end date should be in format yyyy-mm-dd'
        // return res.status(400)
        // .json({ message: "start and end date should be in format yyyy-mm-dd" })
    }

    return response;


}



async function getBestProfession(req, res) {
    const startDate = req.query.start;
    const endDate = req.query.end;

    const validationResponse = validateDate(startDate, endDate, res)
    if (validationResponse !== 'OK') {
        return res.status(400).json({ message: validationResponse })
    }
    // if (!startDate || !endDate) {
    //     return res.status(400)
    //         .json({ message: "start and end date are required" })
    // }

    // if (!validateFormat(startDate) || !validateFormat(endDate)) {
    //     return res.status(400)
    //         .json({ message: "start and end date should be in format yyyy-mm-dd" })
    // }




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
            .json({ message: "No professions found in that range" })
    }

    const response = {
        "profession": result[0][0].profession,
        "earnings": result[0][0].totalEarnings
    }


    res.status(200).json(response)
}


async function getBestClients(req, res) {
    const startDate = req.query.start;
    const endDate = req.query.end;

    if (!startDate || !endDate) {
        return res.status(400)
            .json({ message: "start and end date are required" })
    }

    if (!validateFormat(startDate) || !validateFormat(endDate)) {
        return res.status(400)
            .json({ message: "start and end date should be in format yyyy-mm-dd" })
    }


    // I know there is a way to do this with sequelize 
    // but i found it easier and shorter to do it in this way
    const query = await sequelize.query(`
    SELECT p.id, p.firstName || ' ' || p.lastName as fullName, SUM(j.price) as totalPaid
    FROM Profiles p
        JOIN Contracts c ON p.id = c.ClientId
        JOIN Jobs j ON c.id = j.ContractId
            WHERE j.paid = true
                AND j.paymentDate >= '${startDate}' 
                AND j.paymentDate <= '${endDate}' 
    GROUP BY p.firstName, p.lastName
    ORDER BY totalPaid DESC
    LIMIT 2
    `)

    if (!query[0].length) {
        return res.status(404)
            .json({ message: "No clients found in that range" })
    }

    const result = query[0].map(client => {
        return {
            "id": client.id,
            "fullName": client.fullName,
            "paid": client.totalPaid
        }
    })

    return res.status(200).json(result);
}

module.exports = {
    getBestProfession,
    getBestClients
}