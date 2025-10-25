const jwt = require('jsonwebtoken');

/**
 * JWT Configuration and utility functions
 * Used for managing access and refresh tokens
 */

const config = {
  access: {
    secret: process.env.JWT_ACCESS_TOKEN_SECRET,
    ttl: process.env.ACCESS_TOKEN_TTL || '15m',
  },
  refresh: {
    secret: process.env.JWT_REFRESH_TOKEN_SECRET,
    ttl: process.env.REFRESH_TOKEN_TTL || '7d',
  },
  cookie: {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    path: '/'
  }
};

/**
 * Generate access token for user
 * Contains user ID and role for authorization
 */
function generateAccessToken(user) {
  return jwt.sign(
    { 
      id: user._id,
      role: user.role 
    },
    config.access.secret,
    { expiresIn: config.access.ttl }
  );
}

/**
 * Generate refresh token for user
 * Contains only user ID for security
 */
function generateRefreshToken(user) {
  return jwt.sign(
    { id: user._id },
    config.refresh.secret,
    { expiresIn: config.refresh.ttl }
  );
}

/**
 * Verify access token and return decoded payload
 * @throws {JsonWebTokenError} If token is invalid
 * @throws {TokenExpiredError} If token has expired
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, config.access.secret);
  } catch (error) {
    throw error;
  }
}

/**
 * Verify refresh token and return decoded payload
 * @throws {JsonWebTokenError} If token is invalid
 * @throws {TokenExpiredError} If token has expired
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, config.refresh.secret);
  } catch (error) {
    throw error;
  }
}

/**
 * Get token expiration time in milliseconds
 * Used for setting cookie maxAge
 */
function getTokenExpiration(token) {
  const decoded = jwt.decode(token);
  return decoded.exp * 1000; // Convert to milliseconds
}

/**
 * Cookie options factory
 * Creates cookie options with proper expiration
 */
function createCookieOptions(token) {
  return {
    ...config.cookie,
    maxAge: getTokenExpiration(token) - Date.now()
  };
}

module.exports = {
  config,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getTokenExpiration,
  createCookieOptions
};