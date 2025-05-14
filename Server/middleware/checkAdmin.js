const dotenv = require('dotenv');
dotenv.config();

const CheckAdmin = async (req, res, next) => {
    try {
        const keyFromQuery = req.query.adminKey;
        const keyFromHeader = req.headers['admin_key']; // ✅ check headers

        if (keyFromQuery === process.env.Admin_Key || keyFromHeader === process.env.Admin_Key) {
            next();
        } else {
            res.status(403).send('Forbidden: Invalid Admin Key');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = CheckAdmin;
