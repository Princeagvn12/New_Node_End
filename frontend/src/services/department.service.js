import api from './api'

const getAll = () => api.get('/departments').then(res => res.data.departments)
const getById = (id) => api.get(`/departments/${id}`).then(res => res.data)
const create = (payload) => api.post('/departments', payload).then(res => res.data)
const update = (id, payload) => api.patch(`/departments/${id}`, payload).then(res => res.data)
const remove = (id) => api.delete(`/departments/${id}`).then(res => res.data)

export default { getAll, getById, create, update, remove }