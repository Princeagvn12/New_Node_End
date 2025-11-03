import api from './api'

const unwrapCourses = (res) => {
  if (!res) return []
  if (Array.isArray(res)) return res
  // axios + backend createResponse -> res.data.data.courses
  if (res.data?.data?.courses) return res.data.data.courses
  if (res.data?.courses) return res.data.courses
  if (res.data) return res.data
  return []
}

const getAll = () => api.get('/courses').then(res => unwrapCourses(res))
const getById = (id) => api.get(`/courses/${id}`).then(res => res.data?.data?.course || res.data?.course || res.data)
const create = (payload) => api.post('/courses', payload).then(res => res.data?.data?.course || res.data?.course || res.data)
const patchStudents = (id, students) => api.patch(`/courses/${id}/students`, { students }).then(res => res.data)
const update = (id, payload) => api.patch(`/courses/${id}`, payload).then(res => res.data?.data?.course || res.data?.course || res.data)
const remove = (id) => api.delete(`/courses/${id}`).then(res => res.data)

export default { getAll, getById, create, patchStudents, update, remove }