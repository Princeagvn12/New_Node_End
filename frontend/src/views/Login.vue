<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { showSuccess, showError } from '../utils/toast'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'

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
  <div class="login-page-v2">
    <div class="login-card-container animate-fade-in">
      <!-- Left Panel: Vibrant Branding -->
      <div class="brand-panel">
        <div class="brand-header">
          <div class="brand-logo">G</div>
          <span class="brand-name">Gestion</span>
        </div>

        <div class="brand-body">
          <h1 class="main-title">Sign in to your account</h1>
          <p class="main-description">
            Access your dashboard, follow your courses and manage your hours — fast and secure.
          </p>

          <ul class="feature-list">
            <li><span class="dot"></span> Access courses and resources</li>
            <li><span class="dot"></span> Track attendance and hours</li>
            <li><span class="dot"></span> Manage your profile</li>
          </ul>
        </div>
      </div>

      <!-- Right Panel: Clean Form -->
      <div class="form-panel">
        <div class="form-content">
          <div class="form-header">
            <h2 class="welcome-title">Welcome back</h2>
            <p class="welcome-subtitle">Sign in to continue to your dashboard</p>
          </div>

          <form @submit.prevent="handleLogin" class="auth-form">
            <div class="field">
              <label for="email" class="field-label">Email</label>
              <InputText 
                id="email"
                v-model="form.email" 
                placeholder="moi@gmail.com" 
                class="custom-input" 
                required 
              />
            </div>

            <div class="field">
              <label for="password" class="field-label">Password</label>
              <Password 
                id="password"
                v-model="form.password" 
                placeholder="••••••••••••" 
                class="custom-input custom-password" 
                toggleMask 
                :feedback="false"
                required 
              />
            </div>

            <Button 
              type="submit" 
              label="Sign in" 
              :loading="loading" 
              class="signin-btn"
            />

            <div class="form-footer-v2">
              <router-link to="/forgot-password" class="footer-link-blue">Forgot password?</router-link>
              <span class="footer-link-grey">Need help?</span>
            </div>
          </form>

          <div class="copyright-v2">
             © Gestion • All rights reserved
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page-v2 {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F1F4F9; /* Subtle light background */
  padding: 1.5rem;
  overflow: hidden;
}

.dark .login-page-v2 {
  background-color: #0F172A;
}

.login-card-container {
  width: 100%;
  max-width: 1050px;
  height: 580px;
  display: flex;
  background: white;
  border-radius: 2rem;
  overflow: hidden;
  box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.12);
}

.dark .login-card-container {
  background: #1E293B;
  box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.4);
}

/* Left Panel */
.brand-panel {
  flex: 1.1;
  background: linear-gradient(135deg, #6366F1 0%, #4F46E5 30%, #06B6D4 100%);
  padding: 4rem;
  display: flex;
  flex-direction: column;
  color: white;
  position: relative;
}

.brand-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 5rem;
}

.brand-logo {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.9rem;
}

.brand-name {
  font-weight: 700;
  font-size: 1rem;
}

.main-title {
  font-size: 2.75rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  letter-spacing: -1px;
}

.main-description {
  font-size: 1.05rem;
  opacity: 0.9;
  line-height: 1.5;
  margin-bottom: 2.5rem;
  font-weight: 500;
}

.feature-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.95rem;
  font-weight: 500;
}

.dot {
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  opacity: 0.8;
}

/* Right Panel */
.form-panel {
  flex: 0.9;
  background: white;
  padding: 4rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.dark .form-panel {
  background: #1E293B;
}

.form-content {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.form-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.welcome-title {
  font-size: 2rem;
  font-weight: 800;
  color: #000000; /* Pure black */
  margin-bottom: 0.5rem;
}

.dark .welcome-title { color: white; }

.welcome-subtitle {
  font-size: 1rem;
  color: #334155; /* Darker slate for readability */
  font-weight: 500;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label {
  font-weight: 700;
  font-size: 0.85rem;
  color: #000000; /* Pure black labels */
}

.dark .field-label { color: #CBD5E1; }

.custom-input {
  width: 100%;
  background-color: #F8FAFC !important;
  border: 1.5px solid #E2E8F0 !important;
  color: #000000 !important;
  padding: 0.75rem 1rem !important;
  border-radius: 0.5rem !important;
  font-weight: 600;
}

.dark .custom-input {
  background-color: #0F172A !important;
  border-color: #334155 !important;
  color: #FFFFFF !important;
}

:deep(.p-password-input) {
  width: 100%;
  background-color: transparent !important;
  border: none !important;
  padding: 0 !important;
}

.signin-btn {
  background: #2563EB !important; /* Vibrant primary blue */
  border: none !important;
  padding: 0.875rem !important;
  font-weight: 700 !important;
  border-radius: 0.5rem !important;
  color: white !important;
  box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2) !important;
  font-size: 1rem !important;
  margin-top: 0.5rem;
}

.form-footer-v2 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.footer-link-blue {
  font-size: 0.85rem;
  color: #2563EB;
  text-decoration: none;
  font-weight: 700;
}

.footer-link-grey {
  font-size: 0.85rem;
  color: #64748B;
  font-weight: 600;
}

.copyright-v2 {
  margin-top: 3rem;
  text-align: center;
  font-size: 0.75rem;
  color: #94A3B8;
  font-weight: 600;
}

/* Animations */
.animate-fade-in {
  animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responsive */
@media (max-width: 900px) {
  .login-card-container {
    height: auto;
    flex-direction: column;
    max-width: 450px;
  }
  .brand-panel {
    padding: 2.5rem;
    min-height: 250px;
  }
  .brand-header { margin-bottom: 2rem; }
  .main-title { font-size: 2rem; }
  .form-panel {
    padding: 2.5rem;
  }
}
</style>