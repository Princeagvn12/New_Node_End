<script setup>
import { useAuth } from '../../composables/useAuth'
import { toggleTheme } from '../../composables/useTheme'
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'
import Button from 'primevue/button'

const router = useRouter()
const route = useRoute()
const { logout: doLogout } = useAuth()

const pageTitle = computed(() => {
  const name = route.name?.toString() || ''
  if (name === 'Dashboard') return 'Dashboard'
  if (name === 'Users') return 'Users Management'
  if (name === 'Courses') return 'Courses List'
  if (name === 'Departments') return 'Departments'
  if (name === 'Hours') return 'Hours Tracker'
  if (name === 'Settings') return 'Settings'
  return 'Dashboard'
})

const logout = async () => {
  await doLogout()
  router.push({ name: 'Login' })
}
</script>

<template>
  <header class="topbar-v2">
    <div class="topbar-left">
      <h2 class="page-context-title">{{ pageTitle }}</h2>
    </div>

    <div class="topbar-right">
      <!-- Theme toggle -->
      <button class="theme-toggle-btn" @click="toggleTheme" title="Toggle dark/light mode">
        <i class="pi pi-sun light-icon"></i>
        <i class="pi pi-moon dark-icon"></i>
      </button>

      <!-- Primary Logout Button -->
      <Button 
        label="Logout" 
        @click="logout" 
        class="logout-btn-primary" 
      />
    </div>
  </header>
</template>

<style scoped>
.topbar-v2 {
  height: var(--topbar-height);
  background: white;
  border-bottom: 1px solid #F1F5F9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  position: sticky;
  top: 0;
  z-index: 45;
}

.dark .topbar-v2 {
  background: #0F172A;
  border-bottom-color: #1E293B;
}

.page-context-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1E293B;
}

.dark .page-context-title {
  color: #F8FAFC;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.theme-toggle-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: #64748B;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  transition: color 0.2s;
}

.dark .theme-toggle-btn:hover {
  color: #60A5FA;
}

/* Theme icon toggle logic */
.light-icon { display: block; }
.dark-icon { display: none; }
.dark .light-icon { display: none; }
.dark .dark-icon { display: block; }

.logout-btn-primary {
  background: #3B82F6 !important;
  border: none !important;
  padding: 0.5rem 1.25rem !important;
  font-weight: 700 !important;
  border-radius: 0.5rem !important;
  color: white !important;
  font-size: 0.875rem !important;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
}

.logout-btn-primary:hover {
  background: #2563EB !important;
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
}

@media (max-width: 640px) {
  .page-context-title {
    font-size: 1rem;
  }
}
</style>
