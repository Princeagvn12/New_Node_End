import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const api = axios.create({
  baseURL,
  withCredentials: true,
})

// Response interceptor that attempts a refresh on 401 and retries once
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (!originalRequest) return Promise.reject(error)

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        // call refresh endpoint directly with axios to avoid circular import
        await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
        return api(originalRequest)
      } catch (e) {
        return Promise.reject(e)
      }
    }

    return Promise.reject(error)
  }
)

export default api
// placeholder: frontend/src/services/api.js