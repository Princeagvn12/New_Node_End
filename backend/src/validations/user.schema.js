const Joi = require('joi');

const createUserSchema = Joi.object({
  name: Joi.string().required().messages({
    'any.required': 'Le nom est requis'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email invalide',
    'any.required': 'Email est requis'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
    'any.required': 'Mot de passe requis'
  }),
  role: Joi.string().valid('admin', 'rh', 'formateur_principal', 'formateur', 'etudiant').required(),
  department: Joi.string().hex().length(24).optional(),
  isActive: Joi.boolean().default(true)
});

const updateUserSchema = Joi.object({
  name: Joi.string().optional(),
  role: Joi.string().valid('admin', 'rh', 'formateur_principal', 'formateur', 'etudiant').optional(),
  department: Joi.string().hex().length(24).optional(),
  isActive: Joi.boolean().optional()
});

const activateUserSchema = Joi.object({
  isActive: Joi.boolean().required()
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  activateUserSchema
};