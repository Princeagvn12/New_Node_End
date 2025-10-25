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

// Create hour entry (formateurs only)
const createHourEntry = async (req, res, next) => {
  try {
    const { course: courseId, date, startTime, endTime, type, comments } = req.body;
    
    // Vérifier que le formateur est bien assigné au cours
    const course = await Course.findById(courseId);
    if (!course) {
      return createResponse(res, 404, 'Cours non trouvé');
    }
    
    if (course.teacher.toString() !== req.user._id.toString()) {
      return createResponse(res, 403, 'Vous n\'êtes pas le formateur assigné à ce cours');
    }
    
    // Créer l'entrée d'heures
    const hourEntry = await HourEntry.create({
      course: courseId,
      teacher: req.user._id,
      date,
      startTime,
      endTime,
      type,
      comments
    });
    
    await hourEntry.populate([
      {
        path: 'course',
        select: 'name department',
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

// Update hour entry (within 24h only)
const updateHourEntry = async (req, res, next) => {
  try {
    const { date, startTime, endTime, type, comments } = req.body;
    
    const hourEntry = await HourEntry.findOne({
      _id: req.params.id,
      teacher: req.user._id
    });
    
    if (!hourEntry) {
      return createResponse(res, 404, 'Entrée d\'heures non trouvée');
    }
    
    // Vérifier le délai de 24h
    const hours24 = 24 * 60 * 60 * 1000;
    if (Date.now() - hourEntry.createdAt > hours24) {
      return createResponse(res, 403, 'Les modifications ne sont autorisées que dans les 24 heures suivant la création');
    }
    
    // Mettre à jour les champs
    Object.assign(hourEntry, {
      date: date || hourEntry.date,
      startTime: startTime || hourEntry.startTime,
      endTime: endTime || hourEntry.endTime,
      type: type || hourEntry.type,
      comments: comments || hourEntry.comments
    });
    
    await hourEntry.save();
    await hourEntry.populate([
      {
        path: 'course',
        select: 'name department',
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

// Delete hour entry (within 24h only)
const deleteHourEntry = async (req, res, next) => {
  try {
    const hourEntry = await HourEntry.findOne({
      _id: req.params.id,
      teacher: req.user._id
    });
    
    if (!hourEntry) {
      return createResponse(res, 404, 'Entrée d\'heures non trouvée');
    }
    
    // Vérifier le délai de 24h
    const hours24 = 24 * 60 * 60 * 1000;
    if (Date.now() - hourEntry.createdAt > hours24) {
      return createResponse(res, 403, 'Les suppressions ne sont autorisées que dans les 24 heures suivant la création');
    }
    
    await hourEntry.remove();
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