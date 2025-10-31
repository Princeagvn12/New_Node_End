<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { showSuccess, showError } from '../utils/toast'
import FormField from '../components/common/FormField.vue'

const router = useRouter()
const route = useRoute()
const { login } = useAuth()

const form = ref({
  email: '',
  password: ''
})

const loading = ref(false)

const handleLogin = async () => {
  if (!form.value.email || !form.value.password) {
    showError('Please enter email and password')
    return
  }

  loading.value = true
  try {
    await login(form.value)
    showSuccess('Login successful!')

    // Rediriger vers la page demandée ou dashboard
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (error) {
    console.error('Login error:', error)
    const message = error.response?.data?.message || 'Login failed. Please check your credentials.'
    showError(message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
    <div class="w-full max-w-md p-8 space-y-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl shadow-2xl">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-blue-600 dark:text-blue-400">Welcome</h1>
        <p class="mt-2 text-gray-600 dark:text-gray-300">Sign in to your account</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <FormField
          v-model="form.email"
          label="Email"
          type="email"
          placeholder="your.email@example.com"
          required
          autocomplete="email"
        />

        <FormField
          v-model="form.password"
          label="Password"
          type="password"
          placeholder="••••••••"
          required
          autocomplete="current-password"
        />

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                 text-white font-semibold rounded-lg transition-colors duration-200
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <div class="mt-4 text-center">
        <router-link to="/forgot-password" class="text-sm text-blue-600 hover:underline">Mot de passe oublié ?</router-link>
      </div>

      <!-- <div class="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>Test Credentials:</p>
        <p class="font-mono mt-1">admin@uni / password</p>
      </div> -->
    </div>
  </div>
</template>