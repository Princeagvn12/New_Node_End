import api from './api'

const getAll = () => api.get('/courses').then(res => res.data)
const getById = (id) => api.get(`/courses/${id}`).then(res => res.data)
const create = (payload) => api.post('/courses', payload).then(res => res.data)
const patchStudents = (id, students) => api.patch(`/courses/${id}/students`, { students }).then(res => res.data)
const update = (id, payload) => api.patch(`/courses/${id}`, payload).then(res => res.data)
const remove = (id) => api.delete(`/courses/${id}`).then(res => res.data)

export default { getAll, getById, create, patchStudents, update, remove }