const Joi = require('joi');

const createCourseSchema = Joi.object({
  title: Joi.string().required().messages({
    'any.required': 'Le nom du cours est requis'
  }),
  description: Joi.string().optional(),
  department: Joi.string().hex().length(24).required().messages({
    'any.required': 'Le département est requis',
    'string.hex': 'ID du département invalide'
  }),
  teacher: Joi.string().hex().length(24).required().messages({
    'any.required': 'Le formateur est requis',
    'string.hex': 'ID du formateur invalide'
  })
});

const updateCourseSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  department: Joi.string().hex().length(24).optional().messages({
    'string.hex': 'ID du département invalide'
  }),
  teacher: Joi.string().hex().length(24).optional().messages({
    'string.hex': 'ID du formateur invalide'
  })
});

module.exports = {
  createCourseSchema,
  updateCourseSchema
};