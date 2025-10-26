import api from './api'

const login = async (credentials) => {
  const res = await api.post('/auth/login', credentials)
  return res.data
}

const logout = async () => {
  const res = await api.post('/auth/logout')
  return res.data
}

const me = async () => {
  const res = await api.get('/auth/me')
  return res.data
}

const refresh = async () => {
  const res = await api.post('/auth/refresh')
  return res.data
}

export default { login, logout, me, refresh }
// placeholder: frontend/src/services/auth.service.js