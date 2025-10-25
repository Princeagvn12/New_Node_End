const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth.middleware');
const allow = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
	createUserSchema,
	updateUserSchema,
	activateUserSchema,
	changePasswordSchema
} = require('../validations/user.schema');
const userController = require('../controllers/user.controller');

// All user routes require authentication
router.use(auth);

// Admin / RH routes
router.get('/', allow(['admin', 'rh']), userController.getUsers);
router.get('/:id', allow(['admin', 'rh']), userController.getUserById);
router.post('/', allow(['admin', 'rh']), validate(createUserSchema), userController.createUser);
router.patch('/:id', allow(['admin', 'rh']), validate(updateUserSchema), userController.updateUser);
router.patch('/:id/activate', allow(['admin', 'rh']), validate(activateUserSchema), userController.toggleUserActive);

// Password change: user himself or admin/rh can change
router.patch('/:id/password', validate(changePasswordSchema), userController.changePassword);

module.exports = router;