const { User } = require("../models/User");
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

module.exports = {
  login,
  refresh,
  logout,
  me,
};