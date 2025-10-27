require('dotenv').config();
const { connectDB } = require('../config/db');
const { User } = require('../models/User');
const Department = require('../models/Department');
const Course = require('../models/Course');
const HourEntry = require('../models/HourEntry');

async function clearCollections() {
  console.log('🗑️  Nettoyage des collections...');
  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    Course.deleteMany({}),
    HourEntry.deleteMany({})
  ]);
}

async function seedDepartments() {
  console.log('🏢 Création des départements...');
  
  const departments = await Department.create([
    { 
      name: 'Informatique', 
      description: 'Département des Sciences Informatiques'
    },
    { 
      name: 'Mathématiques', 
      description: 'Département de Mathématiques Appliquées'
    },
    { 
      name: 'Physique', 
      description: 'Département de Physique Théorique et Appliquée'
    },
    { 
      name: 'Chimie', 
      description: 'Département de Chimie'
    },
    { 
      name: 'Biologie', 
      description: 'Département des Sciences Biologiques'
    },
    { 
      name: 'Géologie', 
      description: 'Département des Sciences de la Terre'
    }
  ]);

  console.log('✅ Départements créés:', departments.length);
  return departments;
}

async function seedUsers(departments) {
  console.log('👥 Création des utilisateurs...');
  
  const informatiqueDept = departments[0]; // Département d'informatique
  // Hasher explicitement les mots de passe avant insertion pour éviter les problèmes de hook
  const hashedPassword = await require('bcrypt').hash('password123', 10);

  const users = await User.create([
    {
      name: 'Admin Système',
      email: 'admin@uni.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    },
    {
      name: 'RH Manager',
      email: 'rh@uni.com',
      password: hashedPassword,
      role: 'rh',
      isActive: true
    },
    {
      name: 'Principal Informatique',
      email: 'principal.info@uni.com',
      password: hashedPassword,
      role: 'formateur_principal',
      department: informatiqueDept._id,
      isActive: true
    },
    {
      name: 'Prof Java',
      email: 'prof.java@uni.com',
      password: hashedPassword,
      role: 'formateur',
      department: informatiqueDept._id,
      isActive: true
    },
    {
      name: 'Prof Python',
      email: 'prof.python@uni.com',
      password: hashedPassword,
      role: 'formateur',
      department: informatiqueDept._id,
      isActive: true
    },
    {
      name: 'Étudiant 1',
      email: 'etudiant1@uni.com',
      password: hashedPassword,
      role: 'etudiant',
      department: informatiqueDept._id,
      isActive: true
    },
    {
      name: 'Étudiant 2',
      email: 'etudiant2@uni.com',
      password: hashedPassword,
      role: 'etudiant',
      department: informatiqueDept._id,
      isActive: true
    }
  ]);

  // Mettre à jour le formateur principal du département
  await Department.findByIdAndUpdate(
    informatiqueDept._id,
    { mainTeacher: users[2]._id } // Principal Informatique
  );

  console.log('✅ Utilisateurs créés:', users.length);
  return users;
}

async function seedCourses(departments, users) {
  console.log('📚 Création des cours...');
  
  const informatiqueDept = departments[0];
  const profJava = users[3];
  const profPython = users[4];
  const etudiant1 = users[5];
  const etudiant2 = users[6];

  const courses = await Course.create([
    {
      title: 'Introduction à Java',
      code: 'JAVA101',
      description: 'Fondamentaux de la programmation Java',
      department: informatiqueDept._id,
      teacher: profJava._id,
      students: [etudiant1._id, etudiant2._id]
    },
    {
      title: 'Python Avancé',
      code: 'PY201',
      description: 'Concepts avancés en Python',
      department: informatiqueDept._id,
      teacher: profPython._id,
      students: [etudiant1._id]
    }
  ]);

  console.log('✅ Cours créés:', courses.length);
  return courses;
}

async function seedHours(courses) {
  console.log('⏰ Création des heures de cours...');
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const hours = await HourEntry.create([
    {
      course: courses[0]._id, // Cours Java
      teacher: courses[0].teacher,
      date: today,
      hours: 3, // 3 heures de CM
      description: 'Introduction aux classes et objets'
    },
    {
      course: courses[1]._id, // Cours Python
      teacher: courses[1].teacher,
      date: yesterday,
      hours: 3, // 3 heures de TP
      description: 'Exercices sur les générateurs'
    }
  ]);

  console.log('✅ Heures créées:', hours.length);
  return hours;
}

async function seedDatabase() {
  try {
    console.log('🌱 Démarrage du seed...');
    
    await connectDB();
    await clearCollections();
    
    const departments = await seedDepartments();
    const users = await seedUsers(departments);
    const courses = await seedCourses(departments, users);
    const hours = await seedHours(courses);

    console.log('\n✨ Seed terminé avec succès!');
    console.log('\n📝 Identifiants de test:');
    console.log('------------------------');
    console.log('Admin:');
    console.log('Email: admin@uni.com');
    console.log('Password: password123');
    console.log('\nRH:');
    console.log('Email: rh@uni.com');
    console.log('Password: password123');
    console.log('\nFormateur Principal:');
    console.log('Email: principal.info@uni.com');
    console.log('Password: password123');
    console.log('\nFormateur Java:');
    console.log('Email: prof.java@uni.com');
    console.log('Password: password123');
    console.log('\nFormateur Python:');
    console.log('Email: prof.python@uni.com');
    console.log('Password: password123');
    console.log('\nÉtudiant 1:');
    console.log('Email: etudiant1@uni.com');
    console.log('Password: password123');
    console.log('\nÉtudiant 2:');
    console.log('Email: etudiant2@uni.com');
    console.log('Password: password123');
    console.log('------------------------');

  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
  } finally {
    process.exit(0);
  }
}

seedDatabase();