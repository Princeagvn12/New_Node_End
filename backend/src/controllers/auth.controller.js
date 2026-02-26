const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { sendMail } = require('../config/mail');
const { User } = require("../models/User");
const { createResponse } = require('../utils/response');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  createCookieOptions,
} = require("../config/jwt");
const CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Login user and set JWT cookies
 * @route POST /api/auth/login
 * @body {email, password}
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    console.log(req.body);
    
    // Validation basique
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
        code: "MISSING_CREDENTIALS",
      });
    }

    // Trouver l'utilisateur avec le password (il est exclu par défaut avec select: false)
    const user = await User.findOne({ email }).select('+password').populate("department", "name");
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is inactive. Please contact administrator.",
        code: "ACCOUNT_INACTIVE",
      });
    }
    
    // CORRECTION : Appeler comparePassword comme méthode d'instance avec await
    const isValidPassword = await user.comparePassword(password);
    console.log(isValidPassword);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set cookies with proper options
    res.cookie("accessToken", accessToken, createCookieOptions('access'));
    res.cookie("refreshToken", refreshToken, createCookieOptions('refresh'));

    // Return user profile and tokens (token fallback for clients where cookies are blocked)
    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      isActive: user.isActive,
    };

    res.json({
      success: true,
      data: {
        user: safeUser,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
}

/**
 * Refresh access token using refresh token
 * @route POST /api/auth/refresh
 */
async function refresh(req, res, next) {
  try {
    const refreshToken =
      req.cookies["refreshToken"] ||
      req.body?.refreshToken ||
      req.headers["x-refresh-token"];
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required",
        code: "REFRESH_REQUIRED",
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id).populate("department", "name");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
        code: "INVALID_SESSION",
      });
    }

    // Generate and set new access token
    const accessToken = generateAccessToken(user);
    res.cookie("accessToken", accessToken, createCookieOptions('access'));

    res.json({
      success: true,
      data: { accessToken },
      message: "Access token renewed",
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired, please login again",
        code: "SESSION_EXPIRED",
      });
    }
    console.error('Refresh error:', error);
    next(error);
  }
}

/**
 * Clear auth cookies
 * @route POST /api/auth/logout
 */
function logout(req, res) {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });
  res.json({
    success: true,
    message: "Logged out successfully",
  });
}

/**
 * Get current user profile
 * @route GET /api/auth/me
 */
async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("department", "name");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
        code: "INVALID_USER",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is inactive",
        code: "ACCOUNT_INACTIVE",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Me error:', error);
    next(error);
  }
}

/**
 * Request password reset - generate token and send email
 * POST /api/auth/forgot
 * body: { email }
 */
async function requestPasswordReset(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // don't reveal user existence
      return res.status(200).json({ message: 'If the account exists, a reset code was sent.' });
    }

    // generate 6-digit code
    const code = String(crypto.randomInt(100000, 999999));
    const hash = await bcrypt.hash(code, 10);

    user.resetCodeHash = hash;
    user.resetCodeExpiry = Date.now() + CODE_TTL_MS;
    await user.save();

    // send email (non-blocking: await so errors can be propagated but doesn't block other threads)
    const subject = 'Your password reset code';
    const html = `<p>Your verification code is <strong>${code}</strong>. It expires in 15 minutes.</p>`;
    const text = `Your verification code is ${code}. It expires in 15 minutes.`;

    try {
      await sendMail({ to: user.email, subject, html, text });
    } catch (mailErr) {
      console.error('Failed to send reset code email:', mailErr && mailErr.message ? mailErr.message : mailErr);
      // we still return success response to avoid leaking info, but log the error
    }

    return res.status(200).json({ message: 'If the account exists, a reset code was sent.' });
  } catch (err) {
    console.error('requestPasswordReset error:', err);
    return res.status(500).json({ message: 'Internal error' });
  }
}

/**
 * Reset password using token
 * POST /api/auth/reset
 * body: { token, password }
 */
async function resetPasswordWithCode(req, res) {
  const { email, code, password } = req.body;
  if (!email || !code || !password) return res.status(400).json({ message: 'Email, code and password are required' });

  try {
    const user = await User.findOne({ email: email });
    console.log(user);
    
    if (!user || !user.resetCodeHash || !user.resetCodeExpiry) {
      return res.status(400).json({ message: 'Invalid code or expired' });
    }

    if (Date.now() > user.resetCodeExpiry) {
      // cleanup
      user.resetCodeHash = undefined;
      user.resetCodeExpiry = undefined;
      await user.save();
      return res.status(400).json({ message: 'Code expired' });
    }

    const match = await bcrypt.compare(String(code), user.resetCodeHash);
    if (!match) return res.status(400).json({ message: 'Invalid code' });

    // ok: reset password
    const pwHash = await bcrypt.hash(password, 10);
    user.password = pwHash;
    user.resetCodeHash = undefined;
    user.resetCodeExpiry = undefined;
    await user.save();

    return res.status(200).json({ message: 'Password updated' });
  } catch (err) {
    console.error('resetPasswordWithCode error:', err);
    return res.status(500).json({ message: 'Internal error' });
  }
}

module.exports = {
  login,
  refresh,
  logout,
  me,
  requestPasswordReset,
  resetPasswordWithCode
};

