import api from './api'

const getAll = () => api.get('/courses')
const getById = (id) => api.get(`/courses/${id}`)
const create = (payload) => api.post('/courses', payload)
const patchStudents = (id, students) => api.patch(`/courses/${id}/students`, { students })
const update = (id, payload) => api.patch(`/courses/${id}`, payload)
const remove = (id) => api.delete(`/courses/${id}`)

export default { getAll, getById, create, patchStudents, update, remove }
// placeholder: frontend/src/services/course.service.js