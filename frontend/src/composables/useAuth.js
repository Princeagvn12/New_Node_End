import authService from '../services/auth.service'
import { useUserStore } from '../store/user.store'

export function useAuth() {
  const store = useUserStore()

  async function login(credentials) {
    const user = await authService.login(credentials)
    store.setUser(user)
    return user
  }

  async function logout() {
    try {
      await authService.logout()
    } finally {
      store.clearUser()
    }
  }

  async function init() {
    try {
      return await store.init()
    } catch (error) {
      return null
    }
  }

  function getRole() {
    return store.user?.role
  }

  function isInRole(roles = []) {
    if (!store.user) return false
    return roles.includes(store.user.role)
  }

  return { login, logout, init, getRole, isInRole, store }
}
// placeholder: frontend/src/composables/useAuth.js