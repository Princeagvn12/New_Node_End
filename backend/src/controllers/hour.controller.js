const HourEntry = require('../models/HourEntry');
const Course = require('../models/Course');
const { createResponse } = require('../utils/response');

// Get hours for current user
const getMyHours = async (req, res, next) => {
  try {
    // Défense serveur : admins et RH ne doivent pas consulter les heures via /hours/me
    if (['admin', 'rh'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Accès non autorisé" });
    }
    let query = {};
    const userId = req.user.id;

    if (req.user.role === 'formateur') {
      query.teacher = userId;
    } else if (req.user.role === 'formateur_principal') {
      const deptCourses = await Course.find({ department: req.user.department }).select('_id');
      const courseIds = deptCourses.map(c => c._id);
      if (!courseIds.length) return res.json({ success: true, data: { hours: [] } });
      query.course = { $in: courseIds };
    } else if (req.user.role === 'etudiant') {
      const studentCourses = await Course.find({ students: userId }).select('_id');
      const courseIds = (studentCourses || []).map(c => c._id);
      if (!courseIds.length) return res.json({ success: true, data: { hours: [] } });
      query.course = { $in: courseIds };
    }

    const hours = await HourEntry.find(query)
      .populate({ path: 'course', select: 'title code description' })
      .populate({ path: 'teacher', select: 'name email id' })
      .sort({ date: -1 });

    // Return stable shape: { success:true, data: { hours } }
    return res.json({ success: true, data: { hours } });
  } catch (error) {
    next(error);
  }
};

// Create hour entry
const createHourEntry = async (req, res, next) => {
  try {
    const { course: courseId, date, hours, description } = req.body;
    const userId = req.user.id; // <-- utilise `id`
    console.log(req.user);
    

    const course = await Course.findById(courseId).select('teacher title');
    console.log(course);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Cours introuvable' });
    }

    // Si l'utilisateur est formateur, il doit être le teacher assigné
    if (req.user.role === 'formateur') {
      const courseTeacherId = course.teacher ? String(course.teacher) : null;
      if (!courseTeacherId || courseTeacherId !== String(userId)) {
        return res.status(403).json({ success: false, message: "Vous n'êtes pas le formateur assigné à ce cours" });
      }
    }

    const entry = await HourEntry.create({
      course: courseId,
      teacher: userId,
      date,
      hours,
      description
    });

    return res.status(201).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

// Update hour entry
const updateHourEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // <-- utilise `id`

    const hourEntry = await HourEntry.findById(id).populate('course', 'teacher title').populate('teacher', 'id');
    if (!hourEntry) return res.status(404).json({ success: false, message: 'Entrée introuvable' });

    // Formateurs peuvent modifier seulement leurs propres entrées (sauf admin/rh)
    if (req.user.role === 'formateur') {
      const entryTeacherId = hourEntry.teacher ? String(hourEntry.teacher.id || hourEntry.teacher) : null;
      if (!entryTeacherId || entryTeacherId !== String(userId)) {
        return res.status(403).json({ success: false, message: "Vous ne pouvez modifier que vos propres entrées" });
      }

      // Optionnel: vérifiez aussi que le cours est toujours assigné au formateur
      const courseTeacherId = hourEntry.course?.teacher ? String(hourEntry.course.teacher) : null;
      if (!courseTeacherId || courseTeacherId !== String(userId)) {
        return res.status(403).json({ success: false, message: "Vous n'êtes plus assigné à ce cours" });
      }
    }

    Object.assign(hourEntry, req.body);
    await hourEntry.save();

    return res.json({ success: true, data: hourEntry });
  } catch (error) {
    next(error);
  }
};

// Delete hour entry
const deleteHourEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(req.user);
    const userId = req.user.id; // <-- utilise `id`

    const hourEntry = await HourEntry.findById(id).populate('course', 'teacher').populate('teacher', 'id');
    console.log(hourEntry);
    if (!hourEntry) return res.status(404).json({ success: false, message: 'Entrée introuvable' });

    if (req.user.role === 'formateur') {
      const entryTeacherId = hourEntry.teacher ? String(hourEntry.teacher.id || hourEntry.teacher) : null;
      if (!entryTeacherId || entryTeacherId !== String(userId)) {
        return res.status(403).json({ success: false, message: "Vous ne pouvez supprimer que vos propres entrées" });
      }
      const courseTeacherId = hourEntry.course?.teacher ? String(hourEntry.course.teacher) : null;
      if (!courseTeacherId || courseTeacherId !== String(userId)) {
        return res.status(403).json({ success: false, message: "Vous n'êtes plus assigné à ce cours" });
      }
    }

    await hourEntry.deleteOne({ _id: hourEntry._id });
    return res.json({ success: true, data: null });
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