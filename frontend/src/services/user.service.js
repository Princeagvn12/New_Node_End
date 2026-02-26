import api from './api'

// L'interceptor déballe déjà les réponses, donc res.data contient directement le payload
const getAll = () => api.get('/users').then(res => {
  // Backend renvoie { users: [...] } après déballage
  return res.data.users
})

const getStudents = () => api.get('/users/students').then(res => res.data.users)
const getTeachers = () => api.get('/users/teachers').then(res => res.data.users)

const getById = (id) => api.get(`/users/${id}`).then(res => res.data)
const create = (payload) => api.post('/users', payload).then(res => res.data)
const update = (id, payload) => api.patch(`/users/${id}`, payload).then(res => res.data)
const activate = (id, active = true) => api.patch(`/users/${id}/activate`, { isActive: active }).then(res => res.data)
const patchRole = (id, role) => api.patch(`/users/${id}/role`, { role }).then(res => res.data)
const remove = (id) => api.delete(`/users/${id}`).then(res => res.data)

// teacher-specific endpoints
const teacherToggleStudentActive = (studentId) => api.patch(`/users/students/${studentId}/activate`).then(res => res.data)
const teacherUpdateStudentCourse = (studentId, payload) => api.patch(`/users/students/${studentId}/course`, payload).then(res => res.data)

export default { getAll, getStudents, getTeachers, getById, create, update, activate, patchRole, remove, teacherToggleStudentActive, teacherUpdateStudentCourse }