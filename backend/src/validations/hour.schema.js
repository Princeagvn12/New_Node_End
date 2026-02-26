const Joi = require('joi');

const createHourSchema = Joi.object({
  course: Joi.string().hex().length(24).required().messages({
    'any.required': 'Le cours est requis',
    'string.hex': 'ID du cours invalide'
  }),
  date: Joi.date().iso().required().messages({
    'any.required': 'La date est requise',
    'date.base': 'Date invalide'
  }),
  hours: Joi.number().positive().required().messages({
    'any.required': "Le nombre d'heures est requis",
    'number.base': "Le nombre d'heures doit être un nombre",
    'number.positive': "Le nombre d'heures doit être positif"
  }),
  description: Joi.string().allow('', null).optional()
});

const updateHourSchema = Joi.object({
  date: Joi.date().iso().optional().messages({
    'date.base': 'Date invalide'
  }),
  hours: Joi.number().positive().optional().messages({
    'number.base': "Le nombre d'heures doit être un nombre",
    'number.positive': "Le nombre d'heures doit être positif"
  }),
  description: Joi.string().allow('', null).optional()
});

module.exports = {
  createHourSchema,
  updateHourSchema
};