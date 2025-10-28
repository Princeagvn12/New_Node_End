const Course = require('../models/Course');
const { createResponse } = require('../utils/response');

// Get all courses
const getCourses = async (req, res, next) => {
  try {
    let query = {};
    
    // Filter courses based on user role and department
    if (req.user.role === 'formateur_principal') {
      query.department = req.user.department;
    } else if (req.user.role === 'formateur') {
      query.teacher = req.user._id;
    } else if (req.user.role === 'etudiant') {
      query.students = req.user._id;
    }
    
    const courses = await Course.find(query)
      .populate('department', 'name')
      .populate('teacher', 'name email')
      .populate('students', 'name email');
    
    return createResponse(res, 200, 'Cours récupérés avec succès', { courses });
  } catch (error) {
    next(error);
  }
};

// Get course by ID
const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('department', 'name')
      .populate('teacher', 'name email')
      .populate('students', 'name email');
    
    if (!course) {
      return createResponse(res, 404, 'Cours non trouvé');
    }
    
    // Vérifier les permissions d'accès
    if (req.user.role === 'formateur_principal' && 
        course.department.toString() !== req.user.department.toString()) {
      return createResponse(res, 403, 'Accès non autorisé à ce cours');
    }
    
    if (req.user.role === 'formateur' && 
        course.teacher.toString() !== req.user._id.toString()) {
      return createResponse(res, 403, 'Accès non autorisé à ce cours');
    }
    
    if (req.user.role === 'etudiant' && 
        !course.students.includes(req.user._id)) {
      return createResponse(res, 403, 'Accès non autorisé à ce cours');
    }
    
    return createResponse(res, 200, 'Cours récupéré avec succès', { course });
  } catch (error) {
    next(error);
  }
};

// Create course (formateur_principal only)
const createCourse = async (req, res, next) => {
  try {
    const { title, description, teacher, code, department} = req.body;
    
    const course = await Course.create({
      title,
      description,
      code,
      teacher,
      department, // Département du formateur principal
      students: []
    });
    
    await course.populate([
      { path: 'department', select: 'name' },
      { path: 'teacher', select: 'name email' }
    ]);
    
    return createResponse(res, 201, 'Cours créé avec succès', { course });
  } catch (error) {
    next(error);
  }
};

// Update course
const updateCourse = async (req, res, next) => {
  try {
    const { title, description, teacher } = req.body;
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return createResponse(res, 404, 'Cours non trouvé');
    }
    
    // Admins peuvent modifier tous les cours
    if (req.user.role !== 'admin') {
      // Vérifier que le formateur principal appartient au département du cours
      const courseDeptId = course.department && (course.department._id || course.department).toString()
      const userDeptId = req.user.department && req.user.department.toString()
      if (!userDeptId || courseDeptId !== userDeptId) {
        return createResponse(res, 403, 'Vous ne pouvez modifier que les cours de votre département');
      }
    }
    
    // Prepare update payload (only allowed fields)
  const updatePayload = {};
  if (typeof title !== 'undefined') updatePayload.title = title;
  if (typeof description !== 'undefined') updatePayload.description = description;
  if (typeof teacher !== 'undefined') updatePayload.teacher = teacher;

    // Use atomic update
    await Course.updateOne({ _id: course._id }, { $set: updatePayload });

    // Fetch the updated course with population
  const updatedCourse = await Course.findById(course._id)
      .populate({ path: 'department', select: 'name' })
      .populate({ path: 'teacher', select: 'name email' })
      .populate({ path: 'students', select: 'name email' });

    return createResponse(res, 200, 'Cours mis à jour avec succès', { course: updatedCourse });
  } catch (error) {
    next(error);
  }
};

// Add/Remove students to/from course
const updateCourseStudents = async (req, res, next) => {
  try {
    const { action, studentIds } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return createResponse(res, 404, 'Cours non trouvé');
    }

    // Allow admin or users from same department
    const courseDeptId = course.department && (course.department._id || course.department).toString()
    const userDeptId = req.user.department && req.user.department.toString()
    if (req.user.role !== 'admin' && (!userDeptId || courseDeptId !== userDeptId)) {
      return createResponse(res, 403, 'Vous ne pouvez modifier que les cours de votre département');
    }

    if (!Array.isArray(studentIds)) {
      return createResponse(res, 400, 'studentIds must be an array');
    }

    if (action === 'add') {
      // Add students atomically without duplicates
      await Course.updateOne({ _id: course._id }, { $addToSet: { students: { $each: studentIds } } });
    } else if (action === 'remove') {
      await Course.updateOne({ _id: course._id }, { $pull: { students: { $in: studentIds } } });
    } else {
      return createResponse(res, 400, 'Invalid action');
    }

    const updatedCourse = await Course.findById(course._id)
      .populate({ path: 'department', select: 'name' })
      .populate({ path: 'teacher', select: 'name email' })
      .populate({ path: 'students', select: 'name email' });

    return createResponse(res, 200, 'Liste des étudiants mise à jour avec succès', { course: updatedCourse });
  } catch (error) {
    next(error);
  }
};

// Delete course
const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return createResponse(res, 404, 'Cours non trouvé');
    }
    
    // Vérifier que le formateur principal appartient au département du cours
    if (course.department.toString() !== req.user.department.toString()) {
      return createResponse(res, 403, 'Vous ne pouvez supprimer que les cours de votre département');
    }
    
    // Vérifier s'il existe des heures enregistrées pour ce cours
    const HourEntry = require('../models/HourEntry');
    const hasHours = await HourEntry.exists({ course: course._id });
    if (hasHours) {
      return createResponse(res, 400, 'Le cours ne peut pas être supprimé car il contient des heures enregistrées');
    }
    
    await course.remove();
    return createResponse(res, 200, 'Cours supprimé avec succès');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  updateCourseStudents,
  deleteCourse
};