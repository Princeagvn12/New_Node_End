const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth.middleware');
const allow = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createCourseSchema, updateCourseSchema } = require('../validations/course.schema');
const courseController = require('../controllers/course.controller');

// All course routes require authentication (controller logic relies on req.user)
router.use(auth.authenticate);

router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourseById);

// Formateur principal / admin
router.post('/', allow(['formateur_principal', 'admin']), validate(createCourseSchema), courseController.createCourse);
router.patch('/:id', allow(['formateur_principal', 'admin']), validate(updateCourseSchema), courseController.updateCourse);
router.patch('/:id/students', allow(['formateur_principal', 'admin']), courseController.updateCourseStudents);
router.delete('/:id', allow(['formateur_principal', 'admin']), courseController.deleteCourse);
module.exports = router;