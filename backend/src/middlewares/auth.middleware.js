const { verifyAccessToken } = require('../config/jwt');

/**
 * Middleware to authenticate user via JWT from cookies
 */
function authenticate(req, res, next) {
  try {
    const accessToken = req.cookies['accessToken'] || req.headers['authorization']?.replace('Bearer ', '');
    if (!accessToken) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const payload = verifyAccessToken(accessToken);
    if (!payload) return res.status(401).json({ success: false, message: 'Invalid token' });

    // normalize user object: ensure id property exists
    req.user = payload;
    req.user.id = payload.id || payload._id || payload.userId || payload.sub;
    // role should already exist (payload.role), keep as-is
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
}

module.exports = { authenticate };