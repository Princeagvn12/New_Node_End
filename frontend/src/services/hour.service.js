import api from './api'

const getMy = () => api.get('/hours/me').then(res => res.data)
const create = (payload) => api.post('/hours', payload).then(res => res.data)
const remove = (id) => api.delete(`/hours/${id}`).then(res => res.data)

export default { getMy, create, remove }