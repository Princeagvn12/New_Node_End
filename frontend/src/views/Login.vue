<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { showSuccess, showError } from '../utils/toast'

const router = useRouter()
const route = useRoute()
const { login } = useAuth()

const form = ref({
  email: '',
  password: ''
})

const loading = ref(false)
const showPassword = ref(false)

// new: control the welcome splash
const showSplash = ref(true)

onMounted(() => {
  // duration of the splash before showing the form (ms)
  setTimeout(() => {
    showSplash.value = false
  }, 2000)
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
  <div class="login-page">
    <!-- Animated background blobs -->
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>
    <div class="blob blob-3"></div>

    <!-- Splash Welcome -->
    <transition name="splash-fade">
      <div v-if="showSplash" class="splash-overlay">
        <div class="splash-content">
          <div class="splash-logo">
            <div class="splash-logo-icon">
              <i class="pi pi-bolt" style="font-size: 2rem;"></i>
            </div>
          </div>
          <h1 class="splash-title">Welcome to Gestion</h1>
          <p class="splash-subtitle">Your modern school management platform</p>
          <div class="splash-loader">
            <div class="splash-loader-bar"></div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Login Card -->
    <transition name="card-appear">
      <div v-show="!showSplash" class="login-card">
        <!-- Left branding panel -->
        <div class="brand-panel">
          <div class="brand-overlay"></div>
          <div class="brand-content">
            <div class="brand-logo">
              <div class="brand-logo-icon">
                <i class="pi pi-bolt" style="font-size: 1.25rem;"></i>
              </div>
              <span class="brand-name">Gestion</span>
            </div>

            <h2 class="brand-heading">Sign in to your<br>account</h2>
            <p class="brand-desc">Access your dashboard, follow your courses and manage your hours — fast and secure.</p>

            <ul class="brand-features">
              <li>
                <div class="feature-icon"><i class="pi pi-book"></i></div>
                <span>Access courses and resources</span>
              </li>
              <li>
                <div class="feature-icon"><i class="pi pi-clock"></i></div>
                <span>Track attendance and hours</span>
              </li>
              <li>
                <div class="feature-icon"><i class="pi pi-user"></i></div>
                <span>Manage your profile</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Right form panel -->
        <div class="form-panel">
          <div class="form-inner">
            <div class="form-header">
              <h1 class="form-title">Welcome back</h1>
              <p class="form-subtitle">Sign in to continue to your dashboard</p>
            </div>

            <form @submit.prevent="handleLogin" class="login-form">
              <div class="form-group">
                <label class="form-label">Email</label>
                <div class="input-wrapper">
                  <i class="pi pi-envelope input-icon"></i>
                  <input
                    v-model="form.email"
                    type="email"
                    placeholder="your.email@example.com"
                    required
                    autocomplete="email"
                    class="form-input with-icon"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Password</label>
                <div class="input-wrapper">
                  <i class="pi pi-lock input-icon"></i>
                  <input
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="••••••••"
                    required
                    autocomplete="current-password"
                    class="form-input with-icon"
                  />
                  <button
                    type="button"
                    class="password-toggle"
                    @click="showPassword = !showPassword"
                    tabindex="-1"
                  >
                    <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                :disabled="loading"
                class="submit-btn"
              >
                <i v-if="loading" class="pi pi-spin pi-spinner" style="margin-right: 0.5rem;"></i>
                {{ loading ? 'Signing in...' : 'Sign in' }}
              </button>
            </form>

            <div class="form-footer">
              <router-link to="/forgot-password" class="link">Forgot password?</router-link>
            </div>

            <div class="form-copyright">
              © <span class="font-medium">Gestion</span> • All rights reserved
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.login-page {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #EEF2FF 0%, #DBEAFE 50%, #E0E7FF 100%);
  overflow: hidden;
}
.dark .login-page {
  background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%);
}

/* Animated blobs */
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: float 8s ease-in-out infinite;
}
.blob-1 {
  width: 400px; height: 400px;
  background: rgba(99, 102, 241, 0.3);
  top: -10%; left: -5%;
  animation-delay: 0s;
}
.blob-2 {
  width: 300px; height: 300px;
  background: rgba(59, 130, 246, 0.25);
  bottom: -5%; right: -5%;
  animation-delay: -3s;
}
.blob-3 {
  width: 200px; height: 200px;
  background: rgba(14, 165, 233, 0.2);
  top: 30%; right: 15%;
  animation-delay: -5s;
}
@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -20px) scale(1.05); }
  66% { transform: translate(-20px, 15px) scale(0.95); }
}

/* Splash */
.splash-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.3);
}
.dark .splash-overlay {
  background: rgba(15, 23, 42, 0.5);
}
.splash-content {
  text-align: center;
  animation: slideUp 0.8s ease-out;
}
.splash-logo-icon {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
}
.splash-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}
.splash-subtitle {
  font-size: 1rem;
  color: var(--text-muted);
  margin: 0.5rem 0 2rem;
}
.splash-loader {
  width: 120px;
  height: 3px;
  background: var(--surface-border);
  border-radius: 3px;
  margin: 0 auto;
  overflow: hidden;
}
.splash-loader-bar {
  width: 40%;
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  border-radius: 3px;
  animation: load 1.8s ease-in-out infinite;
}
@keyframes load {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Splash transition */
.splash-fade-leave-active { transition: opacity 0.5s ease; }
.splash-fade-leave-to { opacity: 0; }

/* Card appear transition */
.card-appear-enter-active { transition: opacity 0.6s ease, transform 0.6s ease; }
.card-appear-enter-from { opacity: 0; transform: scale(0.95) translateY(20px); }

/* Login card */
.login-card {
  position: relative;
  z-index: 20;
  width: 100%;
  max-width: 960px;
  margin: 0 1rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  background: var(--surface-card);
}

/* Brand panel */
.brand-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 3rem;
  background: linear-gradient(135deg, #4F46E5, #3B82F6, #0EA5E9);
  color: white;
  overflow: hidden;
}
.brand-overlay {
  position: absolute;
  inset: 0;
}
.brand-overlay::before {
  content: '';
  position: absolute;
  width: 300px; height: 300px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  top: -80px; left: -60px;
  filter: blur(40px);
}
.brand-overlay::after {
  content: '';
  position: absolute;
  width: 200px; height: 200px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  bottom: -40px; right: -20px;
  filter: blur(30px);
}
.brand-content {
  position: relative;
  z-index: 2;
}
.brand-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
}
.brand-logo-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.brand-name {
  font-size: 1rem;
  font-weight: 700;
}
.brand-heading {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1.2;
  margin: 0 0 1rem;
}
.brand-desc {
  font-size: 0.9rem;
  opacity: 0.9;
  line-height: 1.6;
  margin: 0 0 2rem;
}
.brand-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.brand-features li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  opacity: 0.9;
}
.feature-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  flex-shrink: 0;
}

/* Form panel */
.form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.5rem;
}
.form-inner {
  width: 100%;
  max-width: 380px;
}
.form-header {
  text-align: center;
  margin-bottom: 2rem;
}
.form-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}
.form-subtitle {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin: 0.5rem 0 0;
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}
.input-wrapper {
  position: relative;
}
.input-icon {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-size: 0.9rem;
}
.form-input {
  width: 100%;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
  background: var(--surface-card);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.form-input.with-icon {
  padding-left: 2.5rem;
}
.form-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}
.form-input::placeholder {
  color: var(--text-muted);
}
.password-toggle {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem;
  font-size: 0.9rem;
  transition: color 0.2s;
}
.password-toggle:hover {
  color: var(--text-primary);
}
.submit-btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.25rem;
}
.submit-btn:hover:not(:disabled) {
  opacity: 0.92;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.35);
  transform: translateY(-1px);
}
.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.form-footer {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}
.link {
  font-size: 0.825rem;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;
}
.link:hover {
  opacity: 0.8;
  text-decoration: underline;
}
.form-copyright {
  text-align: center;
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: 2rem;
}

/* Responsive */
@media (max-width: 768px) {
  .login-card {
    grid-template-columns: 1fr;
    max-width: 420px;
  }
  .brand-panel {
    display: none;
  }
  .form-panel {
    padding: 2rem 1.5rem;
  }
}
</style>