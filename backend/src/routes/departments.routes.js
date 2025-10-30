const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth.middleware');
const allow = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createDepartmentSchema, updateDepartmentSchema } = require('../validations/department.schema');
const departmentController = require('../controllers/department.controller');

// Public routes
router.get('/', departmentController.getDepartments);
router.get('/:id', departmentController.getDepartmentById);

// Protected routes
router.use(auth.authenticate);

// Admin only
router.post('/', allow(['admin']), validate(createDepartmentSchema), departmentController.createDepartment);
router.patch('/:id', allow(['admin']), validate(updateDepartmentSchema), departmentController.updateDepartment);
router.delete('/:id', allow(['admin']), departmentController.deleteDepartment);

module.exports = router;