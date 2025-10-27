import api from './api'

const login = async (credentials) => {
  const res = await api.post('/auth/login', credentials)
  // Le backend renvoie { success: true, data: { user } }
  return res.data.data || res.data
}

const logout = async () => {
  const res = await api.post('/auth/logout')
  return res.data
}

const me = async () => {
  const res = await api.get('/auth/me')
  // Le backend renvoie { success: true, data: user }
  return res.data.data || res.data
}

const refresh = async () => {
  const res = await api.post('/auth/refresh')
  return res.data
}

export default { login, logout, me, refresh }