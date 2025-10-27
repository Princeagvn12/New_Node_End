import axios from 'axios'
import router from '../router'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Flag pour éviter les boucles infinies de refresh
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Déballer automatiquement { success, data, message } du backend
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

    // Gérer les 401 avec refresh automatique
    if (
      error.response.status === 401 && 
      !originalRequest._retry && 
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => api(originalRequest)).catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
        processQueue(null, null)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
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