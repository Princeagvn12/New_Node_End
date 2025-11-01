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

    // Return user profile without sensitive data
    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isActive: user.isActive,
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
    const refreshToken = req.cookies["refreshToken"];
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
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return createResponse(res, 400, 'Email requis');

    const user = await User.findOne({ email });
    // Never reveal whether user exists — respond with success message for security
    if (!user) {
      return createResponse(res, 200, "Un email de réinitialisation a été envoyé si le compte existe");
    }

    // generate token (plain for email, store hashed)
    const token = crypto.randomBytes(20).toString('hex');
    const hashed = crypto.createHash('sha256').update(token).digest('hex');

    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = Date.now() + 3600 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    // build reset URL (frontend handles the token)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}&id=${user._id}`;

    const html = `<p>Vous avez demandé une réinitialisation de mot de passe. Utilisez le lien ci‑dessous (valable 1h) :</p>
                  <p><a href="${resetUrl}">${resetUrl}</a></p>
                  <p>Si vous n'avez pas demandé cette opération, ignorez ce message.</p>`;

    const mailInfo = await sendMail({
      to: user.email,
      subject: 'Réinitialisation du mot de passe',
      html,
      text: `Réinitialisation: ${resetUrl}`
    });

    // Log mail sending details to help debugging (messageId and Ethereal preview URL when available)
    try {
      console.log('Reset password email sent info:', mailInfo && (mailInfo.messageId || mailInfo.response) ? (mailInfo.messageId || mailInfo.response) : mailInfo);
      const nodemailer = require('nodemailer');
      if (nodemailer.getTestMessageUrl) {
        const preview = nodemailer.getTestMessageUrl(mailInfo);
        if (preview) console.log('Ethereal preview URL:', preview);
      }
    } catch (logErr) {
      console.warn('Could not log mail preview URL', logErr && logErr.message ? logErr.message : logErr);
    }

    return createResponse(res, 200, "Un email de réinitialisation a été envoyé si le compte existe");
  } catch (err) {
    console.log("ereeeeeee");
    next(err);
  }
}

/**
 * Reset password using token
 * POST /api/auth/reset
 * body: { token, password }
 */
async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !password) return createResponse(res, 400, 'Token et nouveau mot de passe requis');

    const hashed = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return createResponse(res, 400, 'Token invalide ou expiré');

    // hash new password and save
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return createResponse(res, 200, 'Mot de passe réinitialisé avec succès');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  refresh,
  logout,
  me,
  forgotPassword,
  resetPassword
};