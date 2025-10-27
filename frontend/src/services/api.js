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

// Response interceptor that unwraps the backend wrapper { success, message, data }
// so that downstream code that expects `res.data` to be the payload keeps working.
// Also handles 401 -> refresh retry logic in the error handler below.
api.interceptors.response.use(
  (response) => {
    try {
      const d = response.data
      // If backend used the { success, message, data } envelope, unwrap it
      if (d && typeof d === 'object' && ('success' in d) && Object.prototype.hasOwnProperty.call(d, 'data')) {
        // Replace axios response.data with the inner payload
        response.data = d.data
      }
    } catch (e) {
      // ignore and return the original response
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Si pas de réponse ou pas de config, rejeter directement
    if (!error.response || !originalRequest) {
      return Promise.reject(error)
    }

    // Si 401 et ce n'est pas déjà une requête de refresh ou login
    if (error.response.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url.includes('/auth/login') &&
        !originalRequest.url.includes('/auth/refresh')) {
      
      if (isRefreshing) {
        // Si un refresh est déjà en cours, mettre en queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => {
          return api(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Tenter de refresh le token
        await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
        
        // Si succès, traiter la queue et rejouer la requête originale
        processQueue(null, null)
        return api(originalRequest)
      } catch (refreshError) {
        // Si le refresh échoue, déconnecter l'utilisateur
        processQueue(refreshError, null)
        
        // Rediriger vers login
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