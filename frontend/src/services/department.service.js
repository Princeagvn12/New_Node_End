import api from './api'

const getAll = () => api.get('/departments')
const getById = (id) => api.get(`/departments/${id}`)
const create = (payload) => api.post('/departments', payload)
const update = (id, payload) => api.patch(`/departments/${id}`, payload)
const remove = (id) => api.delete(`/departments/${id}`)

export default { getAll, getById, create, update, remove }
// placeholder: frontend/src/services/department.service.js