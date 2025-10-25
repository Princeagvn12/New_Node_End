/**
 * Crée une réponse HTTP standardisée
 * @param {Object} res - L'objet response Express
 * @param {number} statusCode - Code HTTP de la réponse
 * @param {string} message - Message descriptif
 * @param {Object} [data] - Données optionnelles à inclure
 * @param {string} [code] - Code d'erreur optionnel
 * @returns {Object} Réponse Express formatée
 */
function createResponse(res, statusCode, message, data = null, code = null) {
  const response = {
    success: statusCode >= 200 && statusCode < 300,
    message: message
  };

  if (data) {
    response.data = data;
  }

  if (code) {
    response.code = code;
  }

  return res.status(statusCode).json(response);
}

/**
 * Wrapper pour gérer les erreurs async/await dans les routes
 * @param {Function} fn - Handler de route asynchrone
 * @returns {Function} Middleware Express avec gestion d'erreur
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Crée une réponse d'erreur standard
 * @param {Object} res - L'objet response Express
 * @param {number} statusCode - Code HTTP d'erreur
 * @param {string} message - Message d'erreur
 * @param {string} [code] - Code d'erreur spécifique
 * @param {Object} [details] - Détails supplémentaires de l'erreur
 * @returns {Object} Réponse d'erreur formatée
 */
function createErrorResponse(res, statusCode, message, code = null, details = null) {
  const response = {
    success: false,
    message: message
  };

  if (code) {
    response.code = code;
  }

  if (details) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
}

/**
 * Crée une réponse de validation d'erreur
 * @param {Object} res - L'objet response Express
 * @param {Object[]} errors - Tableau d'erreurs de validation
 * @returns {Object} Réponse d'erreur de validation formatée
 */
function createValidationErrorResponse(res, errors) {
  return createErrorResponse(
    res,
    400,
    'Erreur de validation',
    'VALIDATION_ERROR',
    {
      errors: errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    }
  );
}

/**
 * Crée une réponse d'erreur d'authentification
 * @param {Object} res - L'objet response Express
 * @param {string} [message] - Message d'erreur personnalisé
 * @returns {Object} Réponse d'erreur d'authentification formatée
 */
function createAuthErrorResponse(res, message = 'Non authentifié') {
  return createErrorResponse(
    res,
    401,
    message,
    'AUTH_ERROR'
  );
}

/**
 * Crée une réponse d'erreur d'autorisation
 * @param {Object} res - L'objet response Express
 * @param {string} [message] - Message d'erreur personnalisé
 * @returns {Object} Réponse d'erreur d'autorisation formatée
 */
function createForbiddenResponse(res, message = 'Accès non autorisé') {
  return createErrorResponse(
    res,
    403,
    message,
    'FORBIDDEN'
  );
}

/**
 * Crée une réponse pour ressource non trouvée
 * @param {Object} res - L'objet response Express
 * @param {string} [resource] - Nom de la ressource non trouvée
 * @returns {Object} Réponse 404 formatée
 */
function createNotFoundResponse(res, resource = 'Ressource') {
  return createErrorResponse(
    res,
    404,
    `${resource} non trouvé(e)`,
    'NOT_FOUND'
  );
}

module.exports = {
  createResponse,
  createErrorResponse,
  createValidationErrorResponse,
  createAuthErrorResponse,
  createForbiddenResponse,
  createNotFoundResponse,
  asyncHandler
};