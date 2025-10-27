import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import authService from '../services/auth.service'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref(null)
  const loading = ref(false)
  const initialized = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const userRole = computed(() => user.value?.role || null)
  const userName = computed(() => user.value?.name || 'Guest')

  // Actions
  function setUser(userData) {
    user.value = userData
    initialized.value = true
  }

  function clearUser() {
    user.value = null
    initialized.value = false
  }

  async function init() {
    if (initialized.value && user.value) {
      return user.value
    }

    loading.value = true
    try {
      // authService.me() retourne directement les données utilisateur
      const userData = await authService.me()
      setUser(userData)
      return userData
    } catch (error) {
      console.error('Failed to initialize user:', error)
      clearUser()
      throw error
    } finally {
      loading.value = false
    }
  }

  function hasRole(roles = []) {
    if (!user.value) return false
    return roles.includes(user.value.role)
  }

  return {
    // State
    user,
    loading,
    initialized,
    // Getters
    isAuthenticated,
    userRole,
    userName,
    // Actions
    setUser,
    clearUser,
    init,
    hasRole
  }
})