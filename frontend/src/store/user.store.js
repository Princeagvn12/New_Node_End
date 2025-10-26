import { defineStore } from 'pinia'
import authService from '../services/auth.service'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    isAuthenticated: false,
  }),
  actions: {
    setUser(user) {
      this.user = user
      this.isAuthenticated = !!user
    },
    clearUser() {
      this.user = null
      this.isAuthenticated = false
    },
    async init() {
      try {
        const data = await authService.me()
        this.setUser(data)
        return data
      } catch (err) {
        this.clearUser()
        throw err
      }
    },
  },
})
// placeholder: frontend/src/store/user.store.js