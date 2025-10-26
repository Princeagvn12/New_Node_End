import api from './api'

const getMy = () => api.get('/hours/me')
const create = (payload) => api.post('/hours', payload)
const remove = (id) => api.delete(`/hours/${id}`)

export default { getMy, create, remove }
// placeholder: frontend/src/services/hour.service.js