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
    const { name, description, teacher } = req.body;
    
    const course = await Course.create({
      name,
      description,
      department: req.user.department, // Département du formateur principal
      teacher,
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
    const { name, description, teacher } = req.body;
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return createResponse(res, 404, 'Cours non trouvé');
    }
    
    // Vérifier que le formateur principal appartient au département du cours
    if (course.department.toString() !== req.user.department.toString()) {
      return createResponse(res, 403, 'Vous ne pouvez modifier que les cours de votre département');
    }
    
    course.name = name || course.name;
    course.description = description || course.description;
    course.teacher = teacher || course.teacher;
    
    await course.save();
    await course.populate([
      { path: 'department', select: 'name' },
      { path: 'teacher', select: 'name email' },
      { path: 'students', select: 'name email' }
    ]);
    
    return createResponse(res, 200, 'Cours mis à jour avec succès', { course });
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
    
    // Vérifier que le formateur principal appartient au département du cours
    if (course.department.toString() !== req.user.department.toString()) {
      return createResponse(res, 403, 'Vous ne pouvez modifier que les cours de votre département');
    }
    
    if (action === 'add') {
      // Ajouter les étudiants sans doublons
      course.students = [...new Set([...course.students, ...studentIds])];
    } else if (action === 'remove') {
      // Retirer les étudiants
      course.students = course.students.filter(id => !studentIds.includes(id.toString()));
    }
    
    await course.save();
    await course.populate([
      { path: 'department', select: 'name' },
      { path: 'teacher', select: 'name email' },
      { path: 'students', select: 'name email' }
    ]);
    
    return createResponse(res, 200, 'Liste des étudiants mise à jour avec succès', { course });
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