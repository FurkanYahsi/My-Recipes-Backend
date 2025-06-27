const express = require('express');
const router = express.Router();
const SignUpController = require('../Controllers/SignUpController');
const SignInController = require('../Controllers/SignInController');
const LogoutController = require('../Controllers/LogoutController');
const authenticateToken = require('../middlewares/authMiddleware');

router.post('/sign-up', SignUpController.signup);
router.post('/sign-in', SignInController.signin);

// If the user signed in
router.post('/logout', authenticateToken, LogoutController.logout);

// router.get('/users', authenticateToken, SignUpController.getUsers);
router.get('/users', SignUpController.getUsers);
router.get('/check-auth', authenticateToken, (req, res) => {
  res.status(200).json({ authenticated: true });
});


module.exports = router;