const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const {authenticate} = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { loginSchema } = require('../validations/auth.schema');
const { requestPasswordReset, resetPasswordWithCode } = require('../controllers/auth.controller');

/**
 * Auth routes configuration
 * Public routes don't require authentication
 * Protected routes require valid access token
 */


// ...existing code...
// ...existing code...



// Public routes - no authentication required
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
// router.post('/forgot', authController.forgotPassword);
// router.post('/reset', authController.resetPassword);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPasswordWithCode);

// Protected routes - require authentication
router.use(authenticate);
router.post('/logout', authController.logout);
router.get('/me', authController.me);

module.exports = router;