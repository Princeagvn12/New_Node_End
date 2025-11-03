const Department = require('../models/Department');
const { createResponse } = require('../utils/response');
const {User} = require('../models/User');

// Get all departments
const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find()
      .populate('mainTeacher', 'name email');
    
    return createResponse(res, 200, 'Départements récupérés avec succès', { departments });
  } catch (error) {
    next(error);
  }
};

// Get department by ID
const getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('mainTeacher', 'name email');
    
    if (!department) {
      return createResponse(res, 404, 'Département non trouvé');
    }
    
    return createResponse(res, 200, 'Département récupéré avec succès', { department });
  } catch (error) {
    next(error);
  }
};

// Create department (admin only)
const createDepartment = async (req, res, next) => {
  try {
    const { name, description, mainTeacher } = req.body;
    
    // Vérifier si le nom existe déjà
    const existingDepartment = await Department.findOne({ name });
    if (existingDepartment) {
      return createResponse(res, 400, 'Un département avec ce nom existe déjà');
    }
    
    const department = await Department.create({
      name,
      description,
      mainTeacher
    });
    
    await department.populate('mainTeacher', 'name email');
    return createResponse(res, 201, 'Département créé avec succès', { department });
  } catch (error) {
    next(error);
  }
};

// Update department
const updateDepartment = async (req, res, next) => {
  try {
    const { name, description, mainTeacher } = req.body;
    
    // Vérifier si le nouveau nom existe déjà
    if (name) {
      const existingDepartment = await Department.findOne({ 
        name, 
        _id: { $ne: req.params.id } 
      });
      if (existingDepartment) {
        return createResponse(res, 400, 'Un département avec ce nom existe déjà');
      }
    }
    
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, description, mainTeacher },
      { new: true }
    ).populate('mainTeacher', 'name email');

    if (!department) {
      return createResponse(res, 404, 'Département non trouvé');
    }

    return createResponse(res, 200, 'Département mis à jour avec succès', { department });
  } catch (error) {
    next(error);
  }
};

// Delete department
const deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return createResponse(res, 404, 'Département non trouvé');
    }

    // Vérifier s'il y a des utilisateurs dans ce département
    const hasUsers = await User.findOne({ department: department._id });
    if (hasUsers) {
      return createResponse(res, 400, 'Le département ne peut pas être supprimé car il contient des utilisateurs');
    }

    await department.deleteOne();
    return createResponse(res, 200, 'Département supprimé avec succès');
  } catch (error) {
    next(error);

  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
};