<script setup>
// Give component a multi-word name to satisfy linter
defineOptions({ name: 'DashboardView' })
import { ref, computed, onMounted, watch } from 'vue'
import { useUserStore } from '../store/user.store'
import userService from '../services/user.service'
import departmentService from '../services/department.service'
import courseService from '../services/course.service'
import hourService from '../services/hour.service'
import { showError } from '../utils/toast'
import DataView from 'primevue/dataview'
import Button from 'primevue/button'

// shared store
const store = useUserStore()

// Computed values
const role = computed(() => store.user?.role || 'guest')
const userId = computed(() => store.user?._id)
const userName = computed(() => store.user?.name || 'User')

// Initials helper
const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase()
}

// Stats
const usersCount = ref(0)
const departmentsCount = ref(0)
const coursesCount = ref(0)
const recentUsers = ref([])
const loading = ref(false)

async function loadForRole() {
  if (!store.user) return
  loading.value = true
  try {
    const [usersRes, depsRes, coursesRes] = await Promise.all([
      userService.getAll().catch(() => ({ data: [] })),
      departmentService.getAll().catch(() => ({ data: [] })),
      courseService.getAll().catch(() => ({ data: [] }))
    ])

    const users = usersRes?.data ?? usersRes ?? []
    const deps = depsRes?.data ?? depsRes ?? []
    const courses = coursesRes?.data ?? coursesRes ?? []

    usersCount.value = users.length
    departmentsCount.value = deps.length
    coursesCount.value = courses.length

    if (role.value === 'admin' || role.value === 'rh') {
      recentUsers.value = users.slice(-5).reverse()
    }
  } catch (err) {
    showError('Impossible de charger les données')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  store.init().then(() => {
    if (store.user) loadForRole()
  })
})

watch(() => store.user, (u) => u && loadForRole())

</script>

<template>
  <div class="dashboard-v2-container">
    <!-- Top Contextual Header -->
    <div class="dashboard-top-header">
      <h1 class="dashboard-simple-title">Dashboard Overview</h1>
    </div>

    <div class="dashboard-main-body scrollable-content">
      <!-- Simple Welcome Greeting -->
      <div class="welcome-section-v2">
        <h2 class="welcome-text-huge">Welcome, {{ userName }}</h2>
        <p class="welcome-sub-text">Manage your institution's departments, courses, and users from here.</p>
      </div>

      <!-- Stats Section -->
      <div class="dashboard-stats-v2">
        <div class="stat-card-v2 glass-card">
          <div class="stat-icon-circle bg-blue-50 text-blue-500">
            <i class="pi pi-users"></i>
          </div>
          <div class="stat-content-v2">
            <span class="stat-label-v2">TOTAL USERS</span>
            <span class="stat-value-v2">{{ usersCount }}</span>
          </div>
        </div>

        <div class="stat-card-v2 glass-card">
          <div class="stat-icon-circle bg-purple-50 text-purple-500">
            <i class="pi pi-building"></i>
          </div>
          <div class="stat-content-v2">
            <span class="stat-label-v2">DEPARTMENTS</span>
            <span class="stat-value-v2">{{ departmentsCount }}</span>
          </div>
        </div>

        <div class="stat-card-v2 glass-card">
          <div class="stat-icon-circle bg-emerald-50 text-emerald-500">
            <i class="pi pi-book"></i>
          </div>
          <div class="stat-content-v2">
            <span class="stat-label-v2">TOTAL COURSES</span>
            <span class="stat-value-v2">{{ coursesCount }}</span>
          </div>
        </div>
      </div>

      <!-- Recent Users (DataView style) -->
      <div class="section-v2 mt-8">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-sm font-bold uppercase tracking-widest text-muted">UTILISATEURS RÉCENTS</h3>
          <router-link to="/users" class="text-blue-500 font-bold text-sm">View All</router-link>
        </div>

        <div class="glass-card overflow-hidden">
          <DataView :value="recentUsers" class="recent-users-dataview">
            <template #list="slotProps">
              <div class="grid grid-cols-1">
                <div v-for="(u, index) in slotProps.items" :key="index" class="list-item-user">
                  <div class="flex items-center gap-4 flex-1">
                    <div class="avatar-circle-v2">
                      {{ getInitials(u.name) }}
                    </div>
                    <div class="user-info-v2">
                      <span class="user-name-v2">{{ u.name }}</span>
                      <span class="user-email-v2">{{ u.email }}</span>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-8">
                    <span class="role-pill-v2" :class="u.role">{{ u.role }}</span>
                    <span class="text-sm text-muted font-medium hidden md:block">{{ u.email }}</span>
                    <div class="flex gap-2">
                       <i class="pi pi-pencil p-2 hover:bg-surface-hover rounded cursor-pointer text-muted"></i>
                       <i class="pi pi-trash p-2 hover:bg-surface-hover rounded cursor-pointer text-muted"></i>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <template #empty>
              <div class="p-12 text-center text-muted">
                Aucun utilisateur récent
              </div>
            </template>
          </DataView>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-v2-container {
  height: calc(100vh - var(--topbar-height));
  background: var(--surface-bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dashboard-top-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
  flex-shrink: 0;
}

.dashboard-simple-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
}

.dashboard-main-body {
  flex: 1;
  padding: 2rem 2rem;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

.scrollable-content {
  overflow-y: auto;
}

.welcome-section-v2 {
  margin-bottom: 2.5rem;
}

.welcome-text-huge {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -1px;
}

.welcome-sub-text {
  font-size: 1.1rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
}

.dashboard-stats-v2 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.stat-card-v2 {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.stat-icon-circle {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-content-v2 {
  display: flex;
  flex-direction: column;
}

.stat-label-v2 {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 1px;
}

.stat-value-v2 {
  font-size: 2.25rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.1;
}

/* User List DataView */
.list-item-user {
  display: flex;
  align-items: center;
  padding: 1.25rem 2rem;
  border-bottom: 1px solid var(--surface-border);
  transition: background 0.2s;
}

.list-item-user:hover {
  background: var(--surface-hover);
}

.list-item-user:last-child {
  border-bottom: none;
}

.avatar-circle-v2 {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #EFF6FF;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
}

.user-info-v2 {
  display: flex;
  flex-direction: column;
}

.user-name-v2 {
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-primary);
}

.user-email-v2 {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.role-pill-v2 {
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: lowercase;
}

.role-pill-v2.admin { background: #FEF3C7; color: #92400E; }
.role-pill-v2.rh { background: #E0F2FE; color: #075985; }
.role-pill-v2.formateur_principal { background: #F5F3FF; color: #5B21B6; }
.role-pill-v2.formateur { background: #ECFDF5; color: #065F46; }
.role-pill-v2.etudiant { background: #F1F5F9; color: #475569; }

@media (max-width: 768px) {
  .dashboard-stats-v2 {
    grid-template-columns: 1fr;
  }
}
</style>
