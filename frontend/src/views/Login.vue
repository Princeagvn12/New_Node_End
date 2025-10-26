<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref(null)

const router = useRouter()
const route = useRoute()
const { login } = useAuth()

const submit = async () => {
  loading.value = true
  error.value = null
  try {
      const user = await login({ email: email.value, password: password.value })
      console.log(user);
      const redirect = route.query.redirect || { name: 'Dashboard' }
      router.push(redirect)
    } catch (err) {
    error.value = err?.response?.data?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto mt-12 bg-white/60 dark:bg-slate-800/60 p-6 rounded-lg shadow-md backdrop-blur">
    <h2 class="text-2xl font-semibold text-blue-400 mb-4">Se connecter</h2>
    <form @submit.prevent="submit" class="space-y-4">
      <div>
        <label class="block text-sm">Email</label>
        <input v-model="email" type="email" required class="w-full p-2 rounded border" />
      </div>
      <div>
        <label class="block text-sm">Password</label>
        <input v-model="password" type="password" required class="w-full p-2 rounded border" />
      </div>
      <div v-if="error" class="text-sm text-red-600">{{ error }}</div>
      <div class="flex justify-end">
        <button class="px-4 py-2 bg-blue-400 text-white rounded" :disabled="loading">{{ loading ? 'Loading...' : 'Login' }}</button>
      </div>
    </form>
  </div>
</template>
<!-- placeholder: frontend/src/views/Login.vue -->