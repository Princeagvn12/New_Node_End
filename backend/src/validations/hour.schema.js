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
  startTime: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
    'any.required': 'L\'heure de début est requise',
    'string.pattern.base': 'Format d\'heure invalide (HH:MM)'
  }),
  endTime: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
    'any.required': 'L\'heure de fin est requise',
    'string.pattern.base': 'Format d\'heure invalide (HH:MM)'
  }),
  type: Joi.string().valid('CM', 'TD', 'TP').required().messages({
    'any.required': 'Le type de cours est requis',
    'any.only': 'Type de cours invalide (CM, TD, TP)'
  }),
  comments: Joi.string().optional()
});

const updateHourSchema = Joi.object({
  date: Joi.date().iso().optional().messages({
    'date.base': 'Date invalide'
  }),
  startTime: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().messages({
    'string.pattern.base': 'Format d\'heure invalide (HH:MM)'
  }),
  endTime: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().messages({
    'string.pattern.base': 'Format d\'heure invalide (HH:MM)'
  }),
  type: Joi.string().valid('CM', 'TD', 'TP').optional().messages({
    'any.only': 'Type de cours invalide (CM, TD, TP)'
  }),
  comments: Joi.string().optional()
});

module.exports = {
  createHourSchema,
  updateHourSchema
};