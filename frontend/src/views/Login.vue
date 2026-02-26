<script setup>
import { ref, onMounted } from 'vue'
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

// new: control the welcome splash
const showSplash = ref(true)

onMounted(() => {
  // duration of the splash before showing the form (ms)
  setTimeout(() => {
    showSplash.value = false
  }, 3000)
})

const handleLogin = async () => {
  if (!form.value.email || !form.value.password) {
    showError('Please enter email and password')
    return
  }

  loading.value = true
  try {
    await login(form.value)
    showSuccess('Login successful!')

    // Redirect to requested page or dashboard
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
  <!-- Fullscreen fixed layout to avoid any scrollbars on login -->
  <div class="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center overflow-hidden">
    <!-- Splash Welcome (centered, backdrop + blobs) -->
    <div
      v-show="showSplash"
      class="absolute inset-0 flex items-center justify-center transition-opacity duration-700"
      aria-hidden="true"
    >
      <div class="absolute inset-0 backdrop-blur-md bg-white/30 dark:bg-slate-900/40"></div>

      <!-- decorative colorful blobs -->
      <div class="absolute left-8 top-20 w-64 h-64 rounded-full bg-indigo-500/40 blur-3xl transform -rotate-6 animate-[pulse_3s_infinite]"></div>
      <div class="absolute -right-8 bottom-24 w-56 h-56 rounded-full bg-blue-300/30 blur-2xl transform rotate-12"></div>
      <div class="absolute right-28 top-24 w-36 h-36 rounded-full bg-cyan-300/30 blur-xl"></div>

      <div class="relative z-10 text-center px-6">
        <div class="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white drop-shadow-sm">Welcome</div>
        <p class="mt-4 text-sm text-slate-700 dark:text-slate-300/90">Welcome to your platform</p>
      </div>
    </div>

    <!-- Login two-column card (keeps within viewport, no internal scroll) -->
    <div
      v-show="!showSplash"
      class="relative w-full max-w-5xl mx-4 md:mx-auto transition-opacity duration-700 z-20"
      style="max-height: 88vh;"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-0 bg-white/95 dark:bg-slate-800/85 rounded-3xl shadow-2xl overflow-hidden">
        <!-- Left presentation panel (blue, informational) -->
        <div class="relative hidden md:flex flex-col justify-center p-12 text-white bg-gradient-to-br from-indigo-600 via-blue-500 to-cyan-500">
          <!-- subtle decorative whites for depth -->
          <div class="absolute -left-16 -top-10 w-72 h-72 rounded-full bg-white/6 blur-2xl"></div>
          <div class="absolute right-10 bottom-10 w-40 h-40 rounded-full bg-white/8 blur-xl"></div>

          <div class="z-10">
            <div class="flex items-center gap-3 mb-8">
              <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">G</div>
              <div class="text-sm font-semibold">Gestion</div>
            </div>

            <h2 class="text-3xl font-extrabold leading-tight mb-4">Sign in to your account</h2>
            <p class="text-white/90 mb-6">Access your dashboard, follow your courses and manage your hours — fast and secure.</p>

            <ul class="space-y-3 text-sm text-white/90">
              <li class="flex items-start gap-3">
                <span class="w-3 h-3 rounded-full bg-white/80 mt-1"></span>
                Access courses and resources
              </li>
              <li class="flex items-start gap-3">
                <span class="w-3 h-3 rounded-full bg-white/80 mt-1"></span>
                Track attendance and hours
              </li>
              <li class="flex items-start gap-3">
                <span class="w-3 h-3 rounded-full bg-white/80 mt-1"></span>
                Manage your profile
              </li>
            </ul>
          </div>
        </div>

        <!-- Right form panel (clean, centered) -->
        <div class="p-6 md:p-12 flex items-center justify-center">
          <div class="w-full max-w-md">
            <div class="text-center mb-6">
              <h1 class="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">Welcome back</h1>
              <p class="mt-2 text-sm text-slate-500 dark:text-slate-300">Sign in to continue to your dashboard</p>
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

            <div class="mt-4 flex items-center justify-between text-sm">
              <router-link to="/forgot-password" class="text-blue-600 hover:underline">Forgot password?</router-link>
              <!-- optional small link to signup / help (keeps everything in English) -->
              <router-link to="/help" class="text-slate-500 hover:underline hidden sm:inline">Need help?</router-link>
            </div>

            <!-- subtle footer -->
            <div class="mt-6 text-center text-xs text-slate-400">
              © <span class="font-medium">Gestion</span> • All rights reserved
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>