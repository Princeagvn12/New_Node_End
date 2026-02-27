<script setup>
import { ref, onMounted } from 'vue'
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
  <div class="login-view-centered">
    <div class="login-card-v2 glass-card">
      <!-- Left Branding Panel (Blue Gradient) -->
      <div class="split-brand-panel-v3">
        <div class="brand-content-v3">
          <h1 class="brand-title-v3">Gestion</h1>
          <p class="brand-subtitle-v3">Empower your educational<br/>ecosystem.</p>
          
          <p class="brand-description-v3">
            The all-in-one platform for modern school management. 
            Streamline departments, track courses, and manage users with ease.
          </p>

          <div class="feature-pills-v3">
            <div class="glass-pill-v3">
              <div class="pill-icon-v3">
                <i class="pi pi-users"></i>
              </div>
              <div class="pill-text-v3">
                <span class="pill-label-v3">Role-based</span>
                <span class="pill-sub-v3">Custom access for all</span>
              </div>
            </div>
            
            <div class="glass-pill-v3">
              <div class="pill-icon-v3">
                <i class="pi pi-chart-bar"></i>
              </div>
              <div class="pill-text-v3">
                <span class="pill-label-v3">Live Data</span>
                <span class="pill-sub-v3">Real-time insights</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Login Panel (White with High Contrast) -->
      <div class="split-form-panel-v3">
        <div class="login-container-v3">
          <div class="login-header-v3">
            <h2 class="login-title-v3">Welcome back</h2>
            <p class="login-subtitle-v3">Please enter your details to sign in.</p>
          </div>

          <form @submit.prevent="handleLogin" class="login-fields-container">
            <div class="login-field-v3">
              <label class="login-label-v3">Email Address</label>
              <div class="p-input-icon-left w-full">
                <i class="pi pi-envelope" />
                <InputText 
                  v-model="form.email" 
                  placeholder="name@uni.com" 
                  class="w-full text-black" 
                  required 
                  autocomplete="email"
                />
              </div>
            </div>

            <div class="login-field-v3">
              <div class="flex justify-between items-center mb-1">
                <label class="login-label-v3">Password</label>
                <router-link to="/forgot-password" class="forgot-link-v3">Forgot password?</router-link>
              </div>
              <div class="p-input-icon-left w-full">
                <i class="pi pi-lock" />
                <Password 
                  v-model="form.password" 
                  placeholder="••••••••" 
                  class="w-full text-black" 
                  toggleMask 
                  :feedback="false"
                  required 
                  autocomplete="current-password"
                />
              </div>
            </div>

            <div class="flex items-center gap-2 my-1">
              <input type="checkbox" id="remember" class="custom-checkbox" />
              <label for="remember" class="text-sm text-black font-semibold">Keep me signed in for 30 days</label>
            </div>

            <Button 
              type="submit" 
              label="Sign In" 
              :loading="loading" 
            />

            <div class="login-divider-v3">
              <span>Or continue with SSO</span>
            </div>

            <div class="sso-grid-v3">
              <button type="button" class="sso-btn-v3">
                <img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" alt="Google" class="w-5 h-5" />
                <span>Google</span>
              </button>
              <button type="button" class="sso-btn-v3">
                <i class="pi pi-microsoft text-blue-600"></i>
                <span>Azure AD</span>
              </button>
            </div>
          </form>

          <p class="login-footer-v3">Don't have an account? <span class="contact-v3">Contact administrator</span></p>
        </div>

        <!-- Bottom Mode Toggle (already present in parent App/TopBar, but adding footer for spacing) -->
        <div class="login-panel-footer">
          <div class="flex items-center gap-4">
             <i class="pi pi-moon text-muted p-2 rounded-full border border-surface-border cursor-pointer"></i>
             <span class="text-[10px] text-muted font-bold tracking-widest uppercase">Terms of Service • Privacy Policy</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-view-centered {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-bg);
  overflow: hidden;
  padding: 1rem;
}

.login-card-v2 {
  width: 100%;
  max-width: 1000px;
  height: 650px;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  overflow: hidden;
  border: none !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15) !important;
}

/* Left Branding Panel */
.split-brand-panel-v3 {
  background: linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  position: relative;
}

.dark .split-brand-panel-v3 {
  background: linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%);
}

.brand-content-v3 {
  max-width: 440px;
}

.brand-title-v3 {
  font-size: 4.5rem;
  font-weight: 900;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
  letter-spacing: -2px;
}

.brand-subtitle-v3 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #000000;
  line-height: 1.1;
  margin-bottom: 1.5rem;
}
.dark .brand-subtitle-v3 { color: #FFFFFF; }

.brand-description-v3 {
  font-size: 1rem;
  color: #1E293B;
  line-height: 1.6;
  margin-bottom: 2.5rem;
  font-weight: 500;
}
.dark .brand-description-v3 { color: var(--text-muted); }

.feature-pills-v3 {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.glass-pill-v3 {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  padding: 0.875rem 1.25rem;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.dark .glass-pill-v3 {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.pill-icon-v3 {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pill-text-v3 { display: flex; flex-direction: column; }
.pill-label-v3 { font-weight: 800; font-size: 0.85rem; color: #000000; }
.dark .pill-label-v3 { color: #FFFFFF; }
.pill-sub-v3 { font-size: 0.7rem; color: #475569; font-weight: 600; }
.dark .pill-sub-v3 { color: var(--text-muted); }

/* Right Panel */
.split-form-panel-v3 {
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  position: relative;
}

.dark .split-form-panel-v3 {
  background: #1E293B;
}

.login-container-v3 {
  width: 100%;
  max-width: 380px;
}

.login-header-v3 { margin-bottom: 2rem; }
.login-title-v3 { font-size: 2.25rem; font-weight: 900; color: #000000; letter-spacing: -1px; margin-bottom: 0.25rem; }
.dark .login-title-v3 { color: #FFFFFF; }
.login-subtitle-v3 { color: #64748B; font-size: 0.95rem; font-weight: 500; }

.login-fields-container { display: flex; flex-direction: column; gap: 1.25rem; }
.login-field-v3 { display: flex; flex-direction: column; gap: 0.375rem; }
.login-label-v3 { font-weight: 700; font-size: 0.8rem; color: #000000; text-transform: uppercase; letter-spacing: 0.5px; }
.dark .login-label-v3 { color: #CBD5E1; }

.forgot-link-v3 { font-size: 0.8rem; color: var(--color-primary); text-decoration: none; font-weight: 700; }

:deep(.p-inputtext) {
  padding-left: 2.75rem !important;
  border-radius: var(--radius-md) !important;
  background: #F8FAFC !important;
  border: 1px solid #E2E8F0 !important;
}

.p-input-icon-left i { left: 1rem; color: #64748B; }

.login-btn-v3 {
  background: var(--color-primary) !important;
  border: none !important;
  padding: 0.875rem !important;
  font-weight: 800 !important;
  border-radius: var(--radius-md) !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
}

.login-divider-v3 {
  display: flex;
  align-items: center;
  text-align: center;
  color: #94A3B8;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  margin: 0.5rem 0;
}
.login-divider-v3::before, .login-divider-v3::after { content: ''; flex: 1; border-bottom: 1px solid #E2E8F0; }
.login-divider-v3:not(:empty)::before { margin-right: 1rem; }
.login-divider-v3:not(:empty)::after { margin-left: 1rem; }

.sso-grid-v3 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.sso-btn-v3 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: var(--radius-md);
  padding: 0.625rem;
  font-weight: 700;
  font-size: 0.8rem;
  color: #000000;
  cursor: pointer;
  transition: all 0.2s;
}
.dark .sso-btn-v3 { background: #334155; border-color: #475569; color: #F8FAFC; }
.sso-btn-v3:hover { background: #F8FAFC; }
.dark .sso-btn-v3:hover { background: #475569; }

.login-footer-v3 { margin-top: 1.5rem; text-align: center; font-size: 0.85rem; color: #64748B; font-weight: 500; }
.contact-v3 { color: var(--color-primary); font-weight: 800; cursor: pointer; }

.login-panel-footer { position: absolute; bottom: 1.5rem; display: flex; justify-content: center; width: 100%; }

@media (max-width: 900px) {
  .login-card-v2 { grid-template-columns: 1fr; height: auto; max-width: 450px; }
  .split-brand-panel-v3 { display: none; }
  .split-form-panel-v3 { padding: 3rem 1.5rem; }
}
</style>