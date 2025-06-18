const express = require('express');
const router = express.Router();
const SignUpController = require('../Controllers/SignUpController');
const SignInController = require('../Controllers/SignInController');

router.post('/sign-up', SignUpController.signup);
router.post('/sign-in', SignInController.signin);
router.get('/users', SignUpController.getUsers);

module.exports = router;