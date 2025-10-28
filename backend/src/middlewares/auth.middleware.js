const { verifyAccessToken } = require('../config/jwt');

/**
 * Middleware to authenticate user via JWT from cookies
 */
function authenticate(req, res, next) {
  try {
    // Get access token from cookies
    const accessToken = req.cookies['accessToken'];
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        code: 'TOKEN_REQUIRED'
      });
    }

    // Verify token
    const decoded = verifyAccessToken(accessToken);
    
    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
  role: decoded.role,
  department: decoded.department || null
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
}

module.exports = authenticate;