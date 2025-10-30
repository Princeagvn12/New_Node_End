const express = require('express');
const router = express.Router();


const auth = require('../middlewares/auth.middleware');
const allowRoles = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createHourSchema, updateHourSchema } = require('../validations/hour.schema');
const hourController = require('../controllers/hour.controller');

// All hour routes require authentication
router.use(auth.authenticate);

// Anyone authenticated can list their hours
router.get('/me', hourController.getMyHours);

// Only admin, rh, formateur_principal, formateur can create
router.post('/', allowRoles(['admin', 'rh', 'formateur_principal', 'formateur']), validate(createHourSchema), hourController.createHourEntry);

// Update: only admin/rh/formateurs (formateurs limited by controller to own entries)
router.patch('/:id', allowRoles(['admin', 'rh', 'formateur_principal', 'formateur']), validate(updateHourSchema), hourController.updateHourEntry);

// Delete: only admin/rh/formateurs
router.delete('/:id', allowRoles(['admin', 'rh', 'formateur_principal', 'formateur']), hourController.deleteHourEntry);

module.exports = router;