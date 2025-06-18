const express = require('express');
const router = express.Router();
const SignUpController = require('../Controllers/SignUpController');

router.post('/signup', SignUpController.signup);
router.get('/users', SignUpController.getUsers);

module.exports = router;