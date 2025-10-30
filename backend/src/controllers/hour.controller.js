const HourEntry = require('../models/HourEntry');
const Course = require('../models/Course');
const { createResponse } = require('../utils/response');

// Get hours for current user
const getMyHours = async (req, res, next) => {
  try {
    let query = {};
    
    switch (req.user.role) {
      case 'formateur':
      case 'formateur_principal':
        query.teacher = req.user._id;
        break;
      case 'etudiant':
        // Récupérer d'abord les IDs des cours de l'étudiant
        const studentCourses = await Course.find({ students: req.user._id }).select('_id');
        query.course = { $in: studentCourses.map(c => c._id) };
        break;
      default:
        // Admin et RH voient tout
        break;
    }
    
    const hours = await HourEntry.find(query)
      .populate({
        path: 'course',
        select: 'name department',
        populate: {
          path: 'department',
          select: 'name'
        }
      })
      .populate('teacher', 'name email')
      .sort({ date: -1, startTime: -1 });
    
    return createResponse(res, 200, 'Heures récupérées avec succès', { hours });
  } catch (error) {
    next(error);
  }
};

// Create hour entry (admin/rh/formateurs)
const createHourEntry = async (req, res, next) => {
  try {
    const { course: courseId, date, hours, description } = req.body;

    // Roles allowed: admin, rh, formateur_principal, formateur
    if (!['admin', 'rh', 'formateur_principal', 'formateur'].includes(req.user.role)) {
      return createResponse(res, 403, 'Non autorisé à créer des saisies d\'heures');
    }

    // Vérifier que le cours existe
    const course = await Course.findById(courseId);
    if (!course) {
      return createResponse(res, 404, 'Cours non trouvé');
    }

    // If creator is a plain formateur, ensure they are the assigned teacher
    if (['formateur', 'formateur_principal'].includes(req.user.role)) {
      if (course.teacher.toString() !== req.user._id.toString()) {
        return createResponse(res, 403, 'Vous n\'êtes pas le formateur assigné à ce cours');
      }
    }

    const hourEntry = await HourEntry.create({
      course: courseId,
      teacher: req.user._id,
      date,
      hours,
      description
    });

    await hourEntry.populate([
      {
        path: 'course',
        select: 'title department',
        populate: {
          path: 'department',
          select: 'name'
        }
      },
      { path: 'teacher', select: 'name email' }
    ]);

    return createResponse(res, 201, 'Heures enregistrées avec succès', { hourEntry });
  } catch (error) {
    next(error);
  }
};

// Update hour entry (within 24h only for formateurs, admin/rh can bypass)
const updateHourEntry = async (req, res, next) => {
  try {
    const { date, hours, description } = req.body;

    const hourEntry = await HourEntry.findById(req.params.id);

    if (!hourEntry) {
      return createResponse(res, 404, 'Entrée d\'heures non trouvée');
    }

    // If requester is a formateur, ensure they are the owner
    if (req.user.role === 'formateur' || req.user.role === 'formateur_principal') {
      if (hourEntry.teacher.toString() !== req.user._id.toString()) {
        return createResponse(res, 403, 'Non autorisé à modifier cette entrée');
      }

      // 24h window for formateurs
      const hours24 = 24 * 60 * 60 * 1000;
      if (Date.now() - hourEntry.createdAt > hours24) {
        return createResponse(res, 403, 'Les modifications ne sont autorisées que dans les 24 heures suivant la création');
      }
    }

    // Admin/rh can update any entry
    hourEntry.date = typeof date !== 'undefined' ? date : hourEntry.date;
    hourEntry.hours = typeof hours !== 'undefined' ? hours : hourEntry.hours;
    hourEntry.description = typeof description !== 'undefined' ? description : hourEntry.description;

    await hourEntry.save();
    await hourEntry.populate([
      {
        path: 'course',
        select: 'title department',
        populate: {
          path: 'department',
          select: 'name'
        }
      },
      { path: 'teacher', select: 'name email' }
    ]);

    return createResponse(res, 200, 'Heures mises à jour avec succès', { hourEntry });
  } catch (error) {
    next(error);
  }
};

// Delete hour entry (within 24h only for formateurs, admin/rh can bypass)
const deleteHourEntry = async (req, res, next) => {
  try {
    const hourEntry = await HourEntry.findById(req.params.id);

    if (!hourEntry) {
      return createResponse(res, 404, 'Entrée d\'heures non trouvée');
    }

    if (req.user.role === 'formateur' || req.user.role === 'formateur_principal') {
      if (hourEntry.teacher.toString() !== req.user._id.toString()) {
        return createResponse(res, 403, 'Non autorisé à supprimer cette entrée');
      }

      const hours24 = 24 * 60 * 60 * 1000;
      if (Date.now() - hourEntry.createdAt > hours24) {
        return createResponse(res, 403, 'Les suppressions ne sont autorisées que dans les 24 heures suivant la création');
      }
    }

    await hourEntry.deleteOne({ _id: hourEntry._id });
    return createResponse(res, 200, 'Heures supprimées avec succès');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyHours,
  createHourEntry,
  updateHourEntry,
  deleteHourEntry
};