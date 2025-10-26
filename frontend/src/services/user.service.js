import api from './api'

const getAll = () => api.get('/users')
const getById = (id) => api.get(`/users/${id}`)
const create = (payload) => api.post('/users', payload)
const update = (id, payload) => api.patch(`/users/${id}`, payload)
const activate = (id, active = true) => api.patch(`/users/${id}/activate`, { isActive: active })
const patchRole = (id, role) => api.patch(`/users/${id}/role`, { role })
const remove = (id) => api.delete(`/users/${id}`)

export default { getAll, getById, create, update, activate, patchRole, remove }
// placeholder: frontend/src/services/user.service.js