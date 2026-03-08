<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../store/user.store'
import { showSuccess, showError } from '../utils/toast'
import FormField from '../components/common/FormField.vue'
import departmentService from '../services/department.service'

const userStore = useUserStore()
const departments = ref([])
const loading = ref(false)

const personalForm = ref({
  name: userStore.user?.name || '',
  email: userStore.user?.email || '',
  department: userStore.user?.department?._id || userStore.user?.department || ''
})

const securityForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const preferences = ref({
  emailNotifications: true,
  directMessages: true,
  language: 'English (US)'
})

const loadDepartments = async () => {
  try {
    departments.value = await departmentService.getAll()
  } catch (e) {}
}

const savePersonal = async () => {
  showSuccess('Personal information updated')
}

const updatePassword = async () => {
  if (securityForm.value.newPassword !== securityForm.value.confirmPassword) {
    showError('Passwords do not match')
    return
  }
  showSuccess('Password updated successfully')
  securityForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
}

const deleteAccount = () => {
  if (confirm('Are you absolutely sure? This action is permanent.')) {
    showError('Account deletion is disabled for demo purposes')
  }
}

const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
}

onMounted(loadDepartments)
</script>

<template>
  <div class="settings-view">
    <div class="header-section">
      <h1 class="page-title">Account Settings</h1>
      <p class="page-subtitle">Manage your profile, security preferences, and account settings.</p>
    </div>

    <div class="settings-container">
      <!-- Personal Information -->
      <div class="glass-card mb-6">
        <div class="card-header">
          <h2 class="section-title">Personal Information</h2>
          <span class="last-updated">Last updated: 2 days ago</span>
        </div>
        <div class="card-body">
          <div class="profile-upload-section">
            <div class="avatar-big">
              {{ getInitials(personalForm.name) }}
              <div class="edit-badge"><i class="pi pi-pencil"></i></div>
            </div>
            <div class="upload-info">
              <span class="font-bold">Profile Photo</span>
              <span class="text-xs text-gray-400">PNG, JPG or GIF. Max 2MB.</span>
            </div>
          </div>

          <div class="form-grid">
            <FormField v-model="personalForm.name" label="Full Name" />
            <FormField v-model="personalForm.email" label="Email Address" />
            <div class="form-field">
              <label class="field-label">Role</label>
              <input :value="userStore.user?.role" disabled class="field-input disabled" />
            </div>
            <div class="form-field">
              <label class="field-label">Department</label>
              <select v-model="personalForm.department" class="field-select">
                <option v-for="d in departments" :key="d._id" :value="d._id">{{ d.name }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <button @click="savePersonal" class="btn-premium btn-primary">Save Changes</button>
        </div>
      </div>

      <!-- Security -->
      <div class="glass-card mb-6">
        <div class="card-header">
          <h2 class="section-title">Security</h2>
        </div>
        <div class="card-body">
          <!-- 2FA Banner -->
          <div class="tfa-banner mb-6">
            <div class="flex items-center gap-4">
              <div class="tfa-icon"><i class="pi pi-shield"></i></div>
              <div>
                <p class="font-bold text-sm">Two-factor Authentication</p>
                <p class="text-xs text-gray-500">Add an extra layer of security to your account.</p>
              </div>
            </div>
            <button class="text-blue-600 text-xs font-bold hover:underline">Enable</button>
          </div>

          <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Change Password</h3>
          <div class="form-stack">
            <FormField v-model="securityForm.currentPassword" label="Current Password" type="password" />
            <div class="form-grid pt-2">
              <FormField v-model="securityForm.newPassword" label="New Password" type="password" />
              <FormField v-model="securityForm.confirmPassword" label="Confirm New Password" type="password" />
            </div>
          </div>
        </div>
        <div class="card-footer justify-between items-center flex">
          <button class="text-gray-400 text-sm hover:text-gray-600">Reset</button>
          <button @click="updatePassword" class="btn-premium btn-primary">Update Password</button>
        </div>
      </div>

      <!-- Notifications & Preferences -->
      <div class="glass-card mb-6">
        <div class="card-header">
          <h2 class="section-title">Notifications & Preferences</h2>
        </div>
        <div class="card-body space-y-6">
          <div class="preference-row">
            <div>
              <p class="font-bold text-sm">Email Notifications</p>
              <p class="text-xs text-gray-500">Receive weekly reports and system alerts.</p>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="preferences.emailNotifications">
              <span class="slider round"></span>
            </label>
          </div>
          <div class="preference-row">
            <div>
              <p class="font-bold text-sm">Direct Messages</p>
              <p class="text-xs text-gray-500">Allow other admins to message you directly.</p>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="preferences.directMessages">
              <span class="slider round"></span>
            </label>
          </div>
          <div class="preference-row pt-2">
            <div>
              <p class="font-bold text-sm">Language Preference</p>
              <p class="text-xs text-gray-500">Primary language for the interface.</p>
            </div>
            <select v-model="preferences.language" class="field-select max-w-[150px]">
              <option>English (US)</option>
              <option>Français (FR)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="danger-zone-card shadow-sm mb-12">
        <div class="p-6">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="text-red-600 font-bold mb-1">Danger Zone</h3>
              <p class="text-xs text-gray-500">Permanently delete your account and all associated data.</p>
            </div>
            <button @click="deleteAccount" class="delete-btn">Delete Account</button>
          </div>
        </div>
      </div>

      <div class="text-center text-xs text-gray-300 pb-10">
        © Gestion 2024 • All rights reserved
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  max-width: 800px;
  margin: 0 auto;
}

.header-section {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin-top: 0.25rem;
}

.card-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.last-updated {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.card-body {
  padding: 1.5rem;
}

.card-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--surface-border);
  display: flex;
  justify-content: flex-end;
}

/* Profile Photo Section */
.profile-upload-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.avatar-big {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  color: #3B82F6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  font-weight: 800;
  position: relative;
}

.edit-badge {
  position: absolute;
  bottom: 0px;
  right: 0px;
  width: 24px;
  height: 24px;
  background: var(--color-primary);
  border: 2px solid white;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
}

.upload-info {
  display: flex;
  flex-direction: column;
}

/* Form Styles */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.field-input, .field-select {
  padding: 0.625rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--surface-border);
  background: var(--surface-bg);
  color: var(--text-primary);
  outline: none;
}

.field-input.disabled {
  background: #F1F5F9;
  color: var(--text-muted);
  cursor: not-allowed;
}

/* Security */
.tfa-banner {
  background: #F8FAFC;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tfa-icon {
  width: 40px;
  height: 40px;
  background: white;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

/* Preference Row */
.preference-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Toggle Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 22px;
}
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #E2E8F0;
  transition: .4s;
}
.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
}
input:checked + .slider { background-color: var(--color-primary); }
input:checked + .slider:before { transform: translateX(22px); }
.slider.round { border-radius: 34px; }
.slider.round:before { border-radius: 50%; }

/* Danger Zone */
.danger-zone-card {
  background: #FEF2F2;
  border: 1px solid #F87171;
  border-radius: var(--radius-lg);
}

.delete-btn {
  background: #EF4444;
  color: white;
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
}
.delete-btn:hover { background: #DC2626; }

@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
  .profile-upload-section { flex-direction: column; text-align: center; }
}
</style>
