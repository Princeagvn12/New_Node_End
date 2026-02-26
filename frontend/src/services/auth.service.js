import api, { clearAuthTokens, getRefreshToken, setAuthTokens } from './api'

const login = async (credentials) => {
  const res = await api.post('/auth/login', credentials)
  const payload = res.data

  if (payload?.accessToken || payload?.refreshToken) {
    setAuthTokens({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken
    })
  }

  return payload?.user || payload
}

const logout = async () => {
  try {
    const res = await api.post('/auth/logout')
    return res.data
  } finally {
    clearAuthTokens()
  }
}

const me = async () => {
  const res = await api.get('/auth/me')
  return res.data
}

const refresh = async () => {
  const refreshToken = getRefreshToken()
  const res = await api.post('/auth/refresh', refreshToken ? { refreshToken } : {})

  if (res.data?.accessToken) {
    setAuthTokens({ accessToken: res.data.accessToken, refreshToken })
  }

  return res.data
}

const requestPasswordReset = async (email) => {
  const res = await api.post('/auth/request-password-reset', { email })
  return res.data
}

const resetPasswordWithCode = async (email, code, password) => {
  const res = await api.post('/auth/reset-password', { email, code, password })
  return res.data
}

export default { login, logout, me, refresh, requestPasswordReset, resetPasswordWithCode }
