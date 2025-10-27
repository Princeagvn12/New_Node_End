const { User } = require("../models/User");
const { createResponse } = require("../utils/response");
const bcrypt = require("bcrypt");

// Get all users
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("department", "name");

    return createResponse(res, 200, "Utilisateurs récupérés avec succès", {
      users,
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("department", "name");

    if (!user) {
      return createResponse(res, 404, "Utilisateur non trouvé");
    }

    return createResponse(res, 200, "Utilisateur récupéré avec succès", {
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Create user (Admin/RH only)
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, department } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return createResponse(res, 400, "Cet email est déjà utilisé");
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      department,
      isActive: true,
    });

    // Retourner l'utilisateur sans le mot de passe
    const userResponse = await User.findById(user._id)
      .select("-password")
      .populate("department", "name");

    return createResponse(res, 201, "Utilisateur créé avec succès", {
      user: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

// Update user
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, department } = req.body;
    const userId = req.params.id;

    // Vérifier si l'email existe déjà pour un autre utilisateur
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return createResponse(res, 400, "Cet email est déjà utilisé");
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { name, email, role, department },
      { new: true }
    )
      .select("-password")
      .populate("department", "name");

    if (!user) {
      return createResponse(res, 404, "Utilisateur non trouvé");
    }

    return createResponse(res, 200, "Utilisateur mis à jour avec succès", {
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Activate/Deactivate user
const toggleUserActive = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    )
      .select("-password")
      .populate("department", "name");

    if (!user) {
      return createResponse(res, 404, "Utilisateur non trouvé");
    }

    const status = isActive ? "activé" : "désactivé";
    return createResponse(res, 200, `Utilisateur ${status} avec succès`, {
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Change user password (Admin/RH or user himself)
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.params.id;

    // Seul l'utilisateur lui-même doit fournir son mot de passe actuel
    if (req.user._id.toString() === userId) {
      const user = await User.findById(userId);
      const isValid = await user.comparePassword(currentPassword);
      if (!isValid) {
        return createResponse(res, 400, "Mot de passe actuel incorrect");
      }
    } else if (!["admin", "rh"].includes(req.user.role)) {
      return createResponse(res, 403, "Non autorisé à changer le mot de passe");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, { password: hashedPassword });

    return createResponse(res, 200, "Mot de passe modifié avec succès");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserActive,
  changePassword,
};
