const Course = require('../models/Course');
const { createResponse } = require('../utils/response');
const { User } = require('../models/User');

// Get all courses
const getCourses = async (req, res, next) => {
  try {
    let query = {};
    
    // Filter courses based on user role and department
    if (req.user.role === 'formateur_principal') {
      query.department = req.user.department;
    } else if (req.user.role === 'formateur') {
      query.teacher = req.user.id; // use id
    } else if (req.user.role === 'etudiant') {
      query.students = req.user.id; // use id
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
    if (req.user.role === 'formateur_principal') {
      const courseDeptId = course.department && (course.department._id || course.department).toString();
      const userDeptId = req.user.department && req.user.department.toString();
      if (!userDeptId || courseDeptId !== userDeptId) {
        return createResponse(res, 403, 'Accès non autorisé à ce cours');
      }
    }
    
    if (req.user.role === 'formateur') {
      const courseTeacherId = course.teacher ? String(course.teacher._id || course.teacher) : null;
      if (!courseTeacherId || courseTeacherId !== String(req.user.id)) {
        return createResponse(res, 403, 'Accès non autorisé à ce cours');
      }
    }
    
    if (req.user.role === 'etudiant') {
      const isStudent = Array.isArray(course.students) && course.students.some(s => String(s._id || s) === String(req.user.id));
      if (!isStudent) {
        return createResponse(res, 403, 'Accès non autorisé à ce cours');
      }
    }
    
    return createResponse(res, 200, 'Cours récupéré avec succès', { course });
  } catch (error) {
    next(error);
  }
};

// Create course (formateur_principal only)
const createCourse = async (req, res, next) => {
  try {
    const { title, description, teacher, code, department, students } = req.body;

    // Validate students: only users with role 'etudiant'
    let validStudents = [];
    if (Array.isArray(students) && students.length > 0) {
      const studentDocs = await User.find({ _id: { $in: students }, role: 'etudiant' }).select('_id');
      validStudents = studentDocs.map(s => s._id);
    }

    // If creator is formateur_principal, force the department to the user's department
    const deptToUse = req.user.role === 'formateur_principal' ? req.user.department : department;

    const course = await Course.create({
      title,
      description,
      code,
      teacher,
      department: deptToUse,
      students: validStudents
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
    const { title, description, teacher, code, department, students } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return createResponse(res, 404, 'Cours non trouvé');
    }

    // Admins peuvent modifier tous les cours
    if (req.user.role !== 'admin') {
      // Vérifier que le formateur principal appartient au département du cours
      const courseDeptId = course.department && (course.department._id || course.department).toString();
      const userDeptId = req.user.department && req.user.department.toString();
      if (!userDeptId || courseDeptId !== userDeptId) {
        return createResponse(res, 403, 'Vous ne pouvez modifier que les cours de votre département');
      }
    }

    // Prepare update payload (only allowed fields)
    const updatePayload = {};
    if (typeof title !== 'undefined') updatePayload.title = title;
    if (typeof description !== 'undefined') updatePayload.description = description;
    if (typeof code !== 'undefined') updatePayload.code = code;
    if (typeof teacher !== 'undefined') updatePayload.teacher = teacher;
    // Only admins can change the department. For others, ignore any department value coming from client.
    if (req.user.role === 'admin' && typeof department !== 'undefined') {
      updatePayload.department = department;
    }

    // If students provided, validate and set
    if (Array.isArray(students)) {
      const studentDocs = await User.find({ _id: { $in: students }, role: 'etudiant' }).select('_id');
      updatePayload.students = studentDocs.map(s => s._id);
    }

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
    
    // Vérifier la permission: admin bypass; formateur_principal doit appartenir au département
    if (req.user.role !== 'admin') {
      const courseDeptId = course.department && (course.department._id || course.department).toString();
      const userDeptId = req.user.department && req.user.department.toString();
      if (!userDeptId || courseDeptId !== userDeptId) {
        return createResponse(res, 403, 'Vous ne pouvez modifier que les cours de votre département');
      }
    }

    // Validate studentIds: only keep users with role 'etudiant'
    const validStudents = Array.isArray(studentIds) && studentIds.length > 0
      ? (await User.find({ _id: { $in: studentIds }, role: 'etudiant' }).select('_id')).map(s => s._id)
      : [];

    if (action === 'add') {
      if (validStudents.length > 0) {
        await Course.updateOne({ _id: course._id }, { $addToSet: { students: { $each: validStudents } } });
      }
    } else if (action === 'remove') {
      if (validStudents.length > 0) {
        await Course.updateOne({ _id: course._id }, { $pull: { students: { $in: validStudents } } });
      }
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
    if (req.user.role !== 'admin') {
      const courseDeptId = course.department && (course.department._id || course.department).toString()
      const userDeptId = req.user.department && req.user.department.toString()
      if (!userDeptId || courseDeptId !== userDeptId) {
        return createResponse(res, 403, 'Vous ne pouvez modifier que les cours de votre département');
      }
    }
    
    // Vérifier s'il existe des heures enregistrées pour ce cours
    const HourEntry = require('../models/HourEntry');
    const hasHours = await HourEntry.exists({ course: course._id });
    if (hasHours) {
      return createResponse(res, 400, 'Le cours ne peut pas être supprimé car il contient des heures enregistrées');
    }
    
    await course.deleteOne({ _id: course._id });
    return createResponse(res, 200, 'Cours supprimé avec succès');
  } catch (error) {
    next(error);
  }
};

// Get courses taught by the logged-in teacher
const getMyCourses = async (req, res, next) => {
  try {
    const teacherId = req.user.id; // utilise `id`
    const courses = await Course.find({ teacher: teacherId }).select('title code _id');
    return res.json({ success: true, data: courses });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  updateCourseStudents,
  deleteCourse,
  getMyCourses
};