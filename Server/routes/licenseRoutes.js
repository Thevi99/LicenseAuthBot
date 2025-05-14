const express = require('express');
const router = express.Router();

const LicenseController = require('../controllers/licenseController');
const CheckAdmin = require('../middleware/checkAdmin');

router.post('/generate', CheckAdmin, LicenseController.generateLicenseKey);
router.post('/activate', LicenseController.redeemLicenseKey);
router.post('/voucher', LicenseController.LicenseBuy);

module.exports = router;
