const express = require('express');
const router = express.Router();

const UserController = require('../controllers/userController');
const CheckAdmin = require('../middleware/checkAdmin');

router.post('/getScript', CheckAdmin, UserController.getScriptLicense);
router.post('/resethwid', CheckAdmin, UserController.resetIdentifier);
router.post('/resetcooldown', CheckAdmin, UserController.resetcooldownUser);
router.post('/authenticate', UserController.authenticateUser);

module.exports = router;
