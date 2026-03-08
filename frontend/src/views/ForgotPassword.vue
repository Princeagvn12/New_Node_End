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
    showSuccess('If the account exists, a reset code has been sent to the email')
    // redirect to reset page, passing email so user doesn't have to retype it
    setTimeout(() => {
      router.push({ name: 'ResetPassword', query: { email: email.value } })
    }, 1000)
  } catch (e) {
    showError(e?.response?.data?.message || 'Error while sending request')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>

    <div class="auth-card">
      <!-- Progress indicator -->
      <div class="stepper">
        <div class="step active">
          <div class="step-circle">1</div>
          <span class="step-label">Email</span>
        </div>
        <div class="step-line"></div>
        <div class="step">
          <div class="step-circle">2</div>
          <span class="step-label">Reset</span>
        </div>
      </div>

      <div class="auth-header">
        <div class="auth-icon">
          <i class="pi pi-envelope" style="font-size: 1.25rem;"></i>
        </div>
        <h2 class="auth-title">Forgot password</h2>
        <p class="auth-desc">Enter your email and we'll send instructions to reset your password.</p>
      </div>

      <div class="auth-form">
        <div class="form-group">
          <label class="form-label">Email address</label>
          <div class="input-wrapper">
            <i class="pi pi-at input-icon"></i>
            <input
              v-model="email"
              type="email"
              placeholder="your.email@example.com"
              class="form-input with-icon"
            />
          </div>
        </div>

        <button
          @click="submit"
          :disabled="loading"
          class="submit-btn"
        >
          <i v-if="loading" class="pi pi-spin pi-spinner" style="margin-right: 0.5rem;"></i>
          {{ loading ? 'Sending...' : 'Send reset email' }}
        </button>

        <div class="auth-footer">
          <router-link to="/login" class="back-link">
            <i class="pi pi-arrow-left" style="font-size: 0.75rem;"></i>
            Back to login
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #EEF2FF 0%, #DBEAFE 50%, #E0E7FF 100%);
  overflow: hidden;
}
.dark .auth-page {
  background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%);
}
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}
.blob-1 {
  width: 350px; height: 350px;
  background: rgba(99, 102, 241, 0.3);
  top: -10%; left: -5%;
}
.blob-2 {
  width: 250px; height: 250px;
  background: rgba(59, 130, 246, 0.25);
  bottom: -5%; right: -5%;
}

.auth-card {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 440px;
  margin: 0 1rem;
  padding: 2.5rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-xl);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.12);
}

/* Stepper */
.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
}
.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
}
.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--surface-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted);
  transition: all 0.3s;
}
.step.active .step-circle {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}
.step-label {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text-muted);
}
.step.active .step-label {
  color: var(--color-primary);
}
.step-line {
  width: 60px;
  height: 2px;
  background: var(--surface-border);
  margin-bottom: 1.5rem;
}

.auth-header {
  text-align: center;
  margin-bottom: 1.5rem;
}
.auth-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}
.dark .auth-icon {
  background: rgba(59, 130, 246, 0.15);
}
.auth-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}
.auth-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0.5rem 0 0;
  line-height: 1.5;
}

.auth-form {
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
.auth-footer {
  text-align: center;
}
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.825rem;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}
.back-link:hover {
  text-decoration: underline;
}
</style>