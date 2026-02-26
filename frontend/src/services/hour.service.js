import api from './api'

const unwrapHours = (res) => {
  if (!res) return []
  if (Array.isArray(res)) return res
  if (res.data?.data?.hours) return res.data.data.hours
  if (res.data?.hours) return res.data.hours
  if (res.data) return res.data
  return []
}

const getMy = () => api.get('/hours/me').then(res => unwrapHours(res))
const create = (payload) => api.post('/hours', payload).then(res => res.data)
const remove = (id) => api.delete(`/hours/${id}`).then(res => res.data)
const update = (id, payload) => api.patch(`/hours/${id}`, payload).then(res => res.data)

export default { getMy, create, update, remove }