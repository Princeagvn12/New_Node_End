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

// password reset
  const requestPasswordReset = async (email) => {
    const res = await api.post('/auth/request-password-reset', { email })
    return res.data;
  };

 const resetPasswordWithCode = async (email, code, password) => {
  const res = await api.post('/auth/reset-password', { email, code, password });
    return res.data;
  }

export default { login, logout, me, refresh,requestPasswordReset,resetPasswordWithCode }