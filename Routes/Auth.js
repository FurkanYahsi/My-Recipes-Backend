const express = require('express');
const router = express.Router();
const SignUpController = require('../Controllers/SignUpController');
const SignInController = require('../Controllers/SignInController');
const LogoutController = require('../Controllers/LogoutController');
const RoleController = require('../Controllers/RoleController');
const authenticateToken = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');

router.post('/sign-up', SignUpController.signup);
router.post('/sign-in', SignInController.signin);

// If the user signed in
router.post('/logout', authenticateToken, LogoutController.logout);

router.post('/change-role', authenticateToken, authorize('admin'), RoleController.changeUserRole);
router.get('/check-auth', authenticateToken, RoleController.checkAuth);
router.get('/users', authenticateToken, authorize('admin'), RoleController.getAllUsers);
router.get('/is-admin', authenticateToken, RoleController.isUserAdmin);
router.get('/is-editor', authenticateToken, RoleController.isUserEditor);


module.exports = router;