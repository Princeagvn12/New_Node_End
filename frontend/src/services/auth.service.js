import api from './api'

const login = async (credentials) => {
  // L'interceptor déjà déballé res.data.data -> res.data
  const res = await api.post('/auth/login', credentials)
  return res.data
}

const logout = async () => {
  const res = await api.post('/auth/logout')
  return res.data
}

const me = async () => {
  // L'interceptor déjà déballé res.data.data -> res.data
  const res = await api.get('/auth/me')
  return res.data
}

const refresh = async () => {
  const res = await api.post('/auth/refresh')
  return res.data
}

export default { login, logout, me, refresh }