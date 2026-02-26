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
router.get('/me', allowRoles(['formateur_principal', 'formateur', 'etudiant']), hourController.getMyHours);

// Only formateur_principal and formateur can create hours (RH / admin removed)
router.post('/', allowRoles(['formateur_principal', 'formateur']), validate(createHourSchema), hourController.createHourEntry);

// Update: only formateur_principal and formateur (controller still checks ownership)
router.patch('/:id', allowRoles(['formateur_principal', 'formateur']), validate(updateHourSchema), hourController.updateHourEntry);

// Delete: only formateur_principal and formateur
router.delete('/:id', allowRoles(['formateur_principal', 'formateur']), hourController.deleteHourEntry);

module.exports = router;