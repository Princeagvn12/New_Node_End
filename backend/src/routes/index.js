const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./users.routes');
const departmentRoutes = require('./departments.routes');
const courseRoutes = require('./courses.routes');
const hourRoutes = require('./hours.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/courses', courseRoutes);
router.use('/hours', hourRoutes);

module.exports = router;