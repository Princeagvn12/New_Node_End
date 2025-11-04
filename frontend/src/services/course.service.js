import api from './api'

const unwrapCourses = (res) => {
  if (!res) return []

  let courses = null

  if (Array.isArray(res)) courses = res
  else if (Array.isArray(res.data?.data?.courses)) courses = res.data.data.courses
  else if (Array.isArray(res.data?.courses)) courses = res.data.courses
  else if (Array.isArray(res.data)) courses = res.data
  else return []

  // remove null/undefined entries (and other falsy non-object values)
  return courses.filter(c => c != null)
}

const getAll = () => api.get('/courses').then(res => unwrapCourses(res))
const getById = (id) => api.get(`/courses/${id}`).then(res => res.data?.data?.course || res.data?.course || res.data)
const create = (payload) => api.post('/courses', payload).then(res => res.data?.data?.course || res.data?.course || res.data)
const patchStudents = (id, students) => api.patch(`/courses/${id}/students`, { students }).then(res => res.data)
const update = (id, payload) => api.patch(`/courses/${id}`, payload).then(res => res.data?.data?.course || res.data?.course || res.data)
const remove = (id) => api.delete(`/courses/${id}`).then(res => res.data)

export default { getAll, getById, create, patchStudents, update, remove }