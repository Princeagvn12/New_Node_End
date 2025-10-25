const Joi = require('joi');

const createDepartmentSchema = Joi.object({
  name: Joi.string().required().messages({
    'any.required': 'Le nom du département est requis'
  }),
  description: Joi.string().optional(),
  mainTeacher: Joi.string().hex().length(24).optional().messages({
    'string.hex': 'ID du formateur principal invalide'
  })
});

const updateDepartmentSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  mainTeacher: Joi.string().hex().length(24).optional()
});

module.exports = {
  createDepartmentSchema,
  updateDepartmentSchema
};