const { verifyAccessToken } = require('../config/jwt');

/**
 * Authentication middleware that checks for access token in cookies
 * and attaches user information to the request
 */
function authMiddleware(req, res, next) {
  try {
    const accessToken = req.cookies['accessToken'];
    
    if (!accessToken) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const decoded = verifyAccessToken(accessToken);
    
    // Attach decoded user info to request for use in subsequent middlewares/controllers
    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid session',
      code: 'INVALID_TOKEN'
    });
  }
}

module.exports = authMiddleware;