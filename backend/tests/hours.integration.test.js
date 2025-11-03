const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
let app;

// models
let User;
let Course;
let HourEntry;

describe('GET /api/hours/me - integration', () => {
  let mongoServer;
  let server;
  let agent;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    // require app after mongoose connected
    app = require('../app');
    agent = request.agent(app);

    // load models
    User = require('../src/models/User');
    Course = require('../src/models/Course');
    HourEntry = require('../src/models/HourEntry');
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // clear db
    await User.deleteMany({});
    await Course.deleteMany({});
    await HourEntry.deleteMany({});
  });

  test('formateur sees only their own hour entries', async () => {
    // create teacher user
    const teacher = await User.create({ name: 'Teacher A', email: 't1@example.com', password: 'pass', role: 'formateur', isActive: true });
    const otherTeacher = await User.create({ name: 'Teacher B', email: 't2@example.com', password: 'pass', role: 'formateur', isActive: true });

    // create course taught by teacher
    const course1 = await Course.create({ title: 'Course 1', code: 'C1', department: mongoose.Types.ObjectId(), teacher: teacher._id });
    const course2 = await Course.create({ title: 'Course 2', code: 'C2', department: mongoose.Types.ObjectId(), teacher: otherTeacher._id });

    // create hour entries
    await HourEntry.create({ course: course1._id, teacher: teacher._id, hours: 2 });
    await HourEntry.create({ course: course2._id, teacher: otherTeacher._id, hours: 3 });

    // create a signed JWT cookie for teacher
    const jwt = require('../src/config/jwt');
    const token = jwt.generateAccessToken(teacher);

    const res = await agent.get('/api/hours/me').set('Cookie', [`accessToken=${token}`]).expect(200);
    expect(res.body).toBeDefined();
    expect(res.body.data).toBeDefined();
    const hours = res.body.data.hours;
    expect(Array.isArray(hours)).toBe(true);
    expect(hours.length).toBe(1);
    expect(String(hours[0].teacher)).toBe(String(teacher._id));
  });

  test('formateur_principal sees hours for their department courses', async () => {
    // create principal user
    const deptId = mongoose.Types.ObjectId();
    const principal = await User.create({ name: 'Principal', email: 'p@example.com', password: 'pass', role: 'formateur_principal', department: deptId, isActive: true });

    const otherTeacher = await User.create({ name: 'Teacher B', email: 't2@example.com', password: 'pass', role: 'formateur', isActive: true });

    // courses: one in principal's department taught by otherTeacher, one in other dept
    const courseInDept = await Course.create({ title: 'Dept Course', code: 'DC', department: deptId, teacher: otherTeacher._id });
    const courseOut = await Course.create({ title: 'Other Course', code: 'OC', department: mongoose.Types.ObjectId(), teacher: otherTeacher._id });

    // hours
    await HourEntry.create({ course: courseInDept._id, teacher: otherTeacher._id, hours: 1 });
    await HourEntry.create({ course: courseOut._id, teacher: otherTeacher._id, hours: 4 });

    const jwt = require('../src/config/jwt');
    const token = jwt.generateAccessToken(principal);

    const res = await agent.get('/api/hours/me').set('Cookie', [`accessToken=${token}`]).expect(200);
    const hours = res.body.data.hours;
    expect(Array.isArray(hours)).toBe(true);
    // should only see the entry for courseInDept
    expect(hours.length).toBe(1);
    expect(String(hours[0].course)).toBe(String(courseInDept._id));
  });
});
