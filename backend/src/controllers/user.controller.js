const { User } = require("../models/User");
const { createResponse } = require("../utils/response");
const bcrypt = require("bcrypt");
const Course = require('../models/Course');

// Get all users
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("department", "name").sort({createdAt: -1});

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

    // NE PAS hasher ici - le hook pre('save') du modèle le fait automatiquement
    const user = await User.create({
      name,
      email,
      password, // Le password sera hashé par le hook pre('save')
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
    if (req.user.id.toString() === userId) {
      const user = await User.findById(userId).select('+password');
      const isValid = await user.comparePassword(currentPassword);
      if (!isValid) {
        return createResponse(res, 400, "Mot de passe actuel incorrect");
      }
    } else if (!["admin", "rh"].includes(req.user.role)) {
      return createResponse(res, 403, "Non autorisé à changer le mot de passe");
    }

    // Mettre à jour le password - le hook pre('save') le hashera automatiquement
    const user = await User.findById(userId);
    user.password = newPassword;
    await user.save();

    return createResponse(res, 200, "Mot de passe modifié avec succès");
  } catch (error) {
    next(error);
  }
};

const patchRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    if (!role || !['admin', 'rh', 'formateur_principal', 'formateur', 'etudiant'].includes(role)) {
      return createResponse(res, 400, 'Invalid role provided');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    )
      .select('-password')
      .populate('department', 'name');

    if (!user) {
      return createResponse(res, 404, 'Utilisateur non trouvé');
    }

    return createResponse(res, 200, 'Rôle mis à jour avec succès', { user });
  } catch (error) {
    next(error);
  }
};

// Get only teachers (formateur), exclude formateur_principal
const getTeachers = async (req, res, next) => {
  try {
    const teachers = await User.find({ role: 'formateur' }).select('-password').populate('department', 'name');
    return createResponse(res, 200, 'Formateurs récupérés avec succès', { users: teachers });
  } catch (error) {
    next(error);
  }
};

// Get only students (for formateur_principal, admin, rh)
const getStudents = async (req, res, next) => {
  try {
    const students = await User.find({ role: 'etudiant' })
      .select('-password')
      .populate('department', 'name');

    return createResponse(res, 200, 'Étudiants récupérés avec succès', { users: students });
  } catch (error) {
    next(error);
  }
};

// Toggle student active by teacher/formateur_principal (limited)
const toggleStudentActiveForTeacher = async (req, res, next) => {
  try {
    const studentId = req.params.id;
    const requesterId = req.user.id; // use id
    const requesterRole = req.user.role;

    const student = await User.findById(studentId);
    if (!student) return createResponse(res, 404, 'Utilisateur non trouvé');

    if (student.role !== 'etudiant') {
      return createResponse(res, 400, 'Cette opération n\'est autorisée que pour les étudiants');
    }

    // If requester is formateur, ensure requester teaches a course where the student is enrolled
    if (requesterRole === 'formateur') {
      const teaches = await Course.exists({ teacher: requesterId, students: studentId });
      if (!teaches) return createResponse(res, 403, 'Non autorisé pour cet étudiant');
    }

    // If requester is formateur_principal, ensure the student is in at least one course of the principal's department
    if (requesterRole === 'formateur_principal') {
      const inDept = await Course.exists({ department: req.user.department, students: studentId });
      if (!inDept) return createResponse(res, 403, 'Non autorisé pour cet étudiant');
    }

    // Admin/rh bypass (they already have other route)
    student.isActive = !student.isActive;
    await student.save();

    return createResponse(res, 200, `Utilisateur ${student.isActive ? 'activé' : 'désactivé'} avec succès`, { user: student });
  } catch (error) {
    next(error);
  }
};

// Assign / Remove student to/from a course (teacher limited)
const updateStudentCourseAssignment = async (req, res, next) => {
  try {
    const studentId = req.params.id;
    const { action, courseId } = req.body;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;

    if (!['add', 'remove'].includes(action)) {
      return createResponse(res, 400, 'Action invalide (add|remove attendu)');
    }
    if (!courseId) {
      return createResponse(res, 400, 'courseId requis');
    }

    const course = await Course.findById(courseId).select('teacher department students');
    if (!course) return createResponse(res, 404, 'Cours introuvable');

    // Ensure target is student
    const student = await User.findById(studentId);
    if (!student) return createResponse(res, 404, 'Utilisateur non trouvé');
    if (student.role !== 'etudiant') return createResponse(res, 400, 'Cible doit être un étudiant');

    // Authorization:
    // - formateur can only modify students for his own courses (teacher === requesterId)
    // - formateur_principal can modify students for courses in his department
    if (requesterRole === 'formateur') {
      if (!course.teacher || String(course.teacher) !== String(requesterId)) {
        return createResponse(res, 403, 'Vous n\'êtes pas le formateur de ce cours');
      }
    } else if (requesterRole === 'formateur_principal') {
      if (!req.user.department || String(course.department) !== String(req.user.department)) {
        return createResponse(res, 403, 'Ce cours n\'appartient pas à votre département');
      }
    } else {
      return createResponse(res, 403, 'Non autorisé');
    }

    const isStudentInCourse = Array.isArray(course.students) && course.students.some(s => String(s._id || s) === String(studentId));

    if (action === 'add') {
      if (isStudentInCourse) {
        return createResponse(res, 400, 'L\'étudiant est déjà affecté à ce cours');
      }
      await Course.updateOne({ _id: courseId }, { $addToSet: { students: student._id } });
      const updatedCourse = await Course.findById(courseId).populate('students', 'name email');
      return createResponse(res, 200, 'Étudiant affecté avec succès', { course: updatedCourse });
    } else {
      // remove
      if (!isStudentInCourse) {
        return createResponse(res, 400, 'L\'étudiant n\'est pas affecté à ce cours');
      }
      await Course.updateOne({ _id: courseId }, { $pull: { students: student._id } });
      const updatedCourse = await Course.findById(courseId).populate('students', 'name email');
      return createResponse(res, 200, 'Étudiant désaffecté avec succès', { course: updatedCourse });
    }
  } catch (error) {
    next(error);
  }
};

// Delete user (admin / rh)
const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return createResponse(res, 404, 'Utilisateur non trouvé');
    }
    return createResponse(res, 200, 'Utilisateur supprimé avec succès');
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
  patchRole,
  getStudents,
  getTeachers,
  // new exports
  toggleStudentActiveForTeacher,
  updateStudentCourseAssignment,
  deleteUser
};