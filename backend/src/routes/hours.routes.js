const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createHourSchema, updateHourSchema } = require('../validations/hour.schema');
const hourController = require('../controllers/hour.controller');

// All hour routes require authentication
router.use(auth);

router.get('/me', hourController.getMyHours);

// Formateur routes
router.post('/', validate(createHourSchema), hourController.createHourEntry);
router.patch('/:id', validate(updateHourSchema), hourController.updateHourEntry);
router.delete('/:id', hourController.deleteHourEntry);

module.exports = router;