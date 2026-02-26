<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import authService from '../services/auth.service'
import { showSuccess, showError } from '../utils/toast'

const route = useRoute()
const router = useRouter()
const email = ref(route.query.email || '')
const code = ref('')
const password = ref('')
const confirm = ref('')
const loading = ref(false)

const submit = async () => {
  if (!email.value || !code.value || !password.value || !confirm.value) {
    showError('Please fill all fields')
    return
  }
  if (password.value !== confirm.value) {
    showError('Passwords do not match')
    return
  }

  loading.value = true
  try {
    await authService.resetPasswordWithCode(email.value, code.value, password.value)
    showSuccess('Password reset. You can now log in.')
    router.push({ name: 'Login' })
  } catch (e) {
    showError(e?.response?.data?.message || 'Error during password reset')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center overflow-hidden">
    <div class="w-full max-w-md px-6 py-8 bg-white/95 dark:bg-slate-800/85 rounded-2xl shadow-2xl">
      <h2 class="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Reset password</h2>
      <p class="text-sm text-slate-600 dark:text-slate-300 mb-6">Enter the code you received and set a new password.</p>

      <div class="space-y-4">
        <input
          v-model="email"
          type="email"
          placeholder="your.email@example.com"
          class="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          v-model="code"
          type="text"
          placeholder="Verification code"
          class="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          v-model="password"
          type="password"
          placeholder="New password"
          class="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          v-model="confirm"
          type="password"
          placeholder="Confirm password"
          class="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          @click="submit"
          :disabled="loading"
          class="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
        >
          {{ loading ? 'Processing...' : 'Change password' }}
        </button>

        <div class="text-sm text-center text-slate-500 dark:text-slate-300">
          <router-link to="/login" class="text-blue-600 hover:underline">Back to login</router-link>
        </div>
      </div>
    </div>
  </div>
</template>