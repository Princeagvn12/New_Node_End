const jwt = require('jsonwebtoken');

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`${name} is required and must be set in environment`);
  }
  return value;
}

// Secrets from environment (no hardcoded fallbacks)
const ACCESS_TOKEN_SECRET = getRequiredEnv('JWT_ACCESS_TOKEN_SECRET');
const REFRESH_TOKEN_SECRET = getRequiredEnv('JWT_REFRESH_TOKEN_SECRET');

// Token TTL from environment
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || '7d';

// Cookie security settings
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';

/**
 * Generate access token
 */
function generateAccessToken(user) {
  return jwt.sign(
    {
  id: user._id,
  email: user.email,
  role: user.role,
  // include department id when present so middleware can attach it to req.user
  department: user.department ? (user.department._id || user.department) : null
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

/**
 * Generate refresh token
 */
function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_TTL }
  );
}

/**
 * Verify access token
 */
function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
}

/**
 * Verify refresh token
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
}

/**
 * Create cookie options based on token type
 */
function createCookieOptions(tokenType = 'access') {
  const ttl = tokenType === 'access' ? ACCESS_TOKEN_TTL : REFRESH_TOKEN_TTL;
  
  // Convert TTL string to milliseconds
  let maxAge;
  if (ttl.endsWith('m')) {
    maxAge = parseInt(ttl) * 60 * 1000; // minutes to ms
  } else if (ttl.endsWith('h')) {
    maxAge = parseInt(ttl) * 60 * 60 * 1000; // hours to ms
  } else if (ttl.endsWith('d')) {
    maxAge = parseInt(ttl) * 24 * 60 * 60 * 1000; // days to ms
  } else {
    maxAge = 15 * 60 * 1000; // default 15 minutes
  }

  return {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    maxAge,
    path: '/'
  };
}

module.exports = {
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
  COOKIE_SECURE,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  createCookieOptions
};
