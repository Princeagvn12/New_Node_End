<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import authService from '../services/auth.service'
import { showSuccess, showError } from '../utils/toast'

const router = useRouter()
const email = ref('')
const loading = ref(false)

const submit = async () => {
  if (!email.value) { showError('Email is required'); return }
  loading.value = true
  try {
    await authService.requestPasswordReset(email.value)
    showSuccess('If the account exists, a reset email has been sent')
    setTimeout(() => {
      router.push({ name: 'ResetPassword' })
    }, 4000)
  } catch (e) {
    showError(e?.response?.data?.message || 'Error while sending request')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-linear-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center overflow-hidden">
    <div class="w-full max-w-md px-6 py-8 bg-white/95 dark:bg-slate-800/85 rounded-2xl shadow-2xl">
      <h2 class="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Forgot password</h2>
      <p class="text-sm text-slate-600 dark:text-slate-300 mb-6">Enter your email and we'll send instructions to reset your password.</p>

      <div class="space-y-4">
        <input
          v-model="email"
          type="email"
          placeholder="your.email@example.com"
          class="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          @click="submit"
          :disabled="loading"
          class="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
        >
          {{ loading ? 'Sending...' : 'Send reset email' }}
        </button>

        <div class="text-sm text-center text-slate-500 dark:text-slate-300">
          <router-link to="/login" class="text-blue-600 hover:underline">Back to login</router-link>
        </div>
      </div>
    </div>
  </div>
</template>