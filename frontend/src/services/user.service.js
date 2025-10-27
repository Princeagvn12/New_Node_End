import api from './api'

const getAll = () => api.get('/users').then(res => res.data)
const getById = (id) => api.get(`/users/${id}`).then(res => res.data)
const create = (payload) => api.post('/users', payload).then(res => res.data)
const update = (id, payload) => api.patch(`/users/${id}`, payload).then(res => res.data)
const activate = (id, active = true) => api.patch(`/users/${id}/activate`, { isActive: active }).then(res => res.data)
const patchRole = (id, role) => api.patch(`/users/${id}/role`, { role }).then(res => res.data)
const remove = (id) => api.delete(`/users/${id}`).then(res => res.data)

export default { getAll, getById, create, update, activate, patchRole, remove }