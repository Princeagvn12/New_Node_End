import axios from 'axios'
import router from '../router'

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api')

const canUseStorage = () => typeof window !== 'undefined' && !!window.localStorage

export const getAccessToken = () => (canUseStorage() ? localStorage.getItem(ACCESS_TOKEN_KEY) : null)
export const getRefreshToken = () => (canUseStorage() ? localStorage.getItem(REFRESH_TOKEN_KEY) : null)

export const setAuthTokens = ({ accessToken, refreshToken }) => {
  if (!canUseStorage()) return
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export const clearAuthTokens = () => {
  if (!canUseStorage()) return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      response.data = response.data.data
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (!error.response || !originalRequest) {
      return Promise.reject(error)
    }

    if (
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => api(originalRequest)).catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = getRefreshToken()
        const refreshResponse = await axios.post(
          `${baseURL}/auth/refresh`,
          refreshToken ? { refreshToken } : {},
          { withCredentials: true }
        )

        const refreshPayload =
          refreshResponse.data && typeof refreshResponse.data === 'object' && 'data' in refreshResponse.data
            ? refreshResponse.data.data
            : refreshResponse.data

        if (refreshPayload?.accessToken) {
          setAuthTokens({ accessToken: refreshPayload.accessToken, refreshToken })
        }

        processQueue(null, refreshPayload?.accessToken || null)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearAuthTokens()

        if (router.currentRoute.value.name !== 'Login') {
          router.push({
            name: 'Login',
            query: { redirect: router.currentRoute.value.fullPath }
          })
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
