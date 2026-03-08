const Joi = require('joi');

const createCourseSchema = Joi.object({
  title: Joi.string().required().messages({
    'any.required': 'Le nom du cours est requis'
  }),
  code: Joi.string().required().messages({
    'any.required': 'Le code du cours est requis'
  }),
  description: Joi.string().allow('', null).optional(),
  department: Joi.string().hex().length(24).required().messages({
    'any.required': 'Le département est requis',
    'string.hex': 'ID du département invalide'
  }),
  teacher: Joi.string().hex().length(24).allow('', null).optional().messages({
    'string.hex': 'ID du formateur invalide'
  }),
  students: Joi.array().items(Joi.string().hex().length(24)).optional(),
  credits: Joi.number().min(0).optional()
});

const updateCourseSchema = Joi.object({
  title: Joi.string().optional(),
  code: Joi.string().optional(),
  description: Joi.string().allow('', null).optional(),
  department: Joi.string().hex().length(24).optional().messages({
    'string.hex': 'ID du département invalide'
  }),
  teacher: Joi.string().hex().length(24).allow('', null).optional().messages({
    'string.hex': 'ID du formateur invalide'
  }),
  students: Joi.array().items(Joi.string().hex().length(24)).optional(),
  credits: Joi.number().min(0).optional()
});

module.exports = {
  createCourseSchema,
  updateCourseSchema
};