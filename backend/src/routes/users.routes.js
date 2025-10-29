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
// Get only students (admin, rh, formateur_principal)
router.get('/students', allow(['admin', 'rh', 'formateur_principal']), userController.getStudents);
// Get only teachers (exclude formateur_principal)
router.get('/teachers', allow(['admin', 'rh', 'formateur_principal']), userController.getTeachers);
router.get('/:id', allow(['admin', 'rh']), userController.getUserById);
router.post('/', allow(['admin', 'rh']), validate(createUserSchema), userController.createUser);
router.patch('/:id', allow(['admin', 'rh']), validate(updateUserSchema), userController.updateUser);
// Patch role separately
router.patch('/:id/role', allow(['admin', 'rh']), userController.patchRole);
router.patch('/:id/activate', allow(['admin', 'rh']), validate(activateUserSchema), userController.toggleUserActive);

// Password change: user himself or admin/rh can change
router.patch('/:id/password', validate(changePasswordSchema), userController.changePassword);

module.exports = router;