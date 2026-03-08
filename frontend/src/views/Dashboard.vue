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
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

// shared store
const store = useUserStore()

// Computed values
const role = computed(() => store.user?.role || 'guest')
const userName = computed(() => store.user?.name || 'Admin Système')

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
  <div class="dashboard-v3-root">
    <div class="dashboard-content-v3 scrollable-area">
      <!-- Welcome Header -->
      <div class="welcome-banner-v3">
        <h1 class="welcome-title-v3">Welcome, {{ userName }}</h1>
        <p class="welcome-subtitle-v3">Manage your institution's departments, courses, and users from here.</p>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid-v3">
        <div class="stat-card-v3 glass-card">
          <div class="stat-icon-v3 bg-blue-100 text-blue-600">
            <i class="pi pi-users"></i>
          </div>
          <div class="stat-info-v3">
            <span class="stat-label-v3">TOTAL USERS</span>
            <span class="stat-value-v3">{{ usersCount }}</span>
          </div>
        </div>

        <div class="stat-card-v3 glass-card">
          <div class="stat-icon-v3 bg-purple-100 text-purple-600">
            <i class="pi pi-building"></i>
          </div>
          <div class="stat-info-v3">
            <span class="stat-label-v3">DEPARTMENTS</span>
            <span class="stat-value-v3">{{ departmentsCount }}</span>
          </div>
        </div>

        <div class="stat-card-v3 glass-card">
          <div class="stat-icon-v3 bg-emerald-100 text-emerald-600">
            <i class="pi pi-book"></i>
          </div>
          <div class="stat-info-v3">
            <span class="stat-label-v3">TOTAL COURSES</span>
            <span class="stat-value-v3">{{ coursesCount }}</span>
          </div>
        </div>
      </div>

      <!-- Recent Users (Borderless Table) -->
      <div class="recent-section-v3 mt-10">
        <div class="section-header-v3">
          <h3 class="section-title-v3">UTILISATEURS RÉCENTS</h3>
          <router-link to="/users" class="view-all-link">View All</router-link>
        </div>

        <div class="table-container-v3 glass-card">
          <DataTable :value="recentUsers" class="borderless-table" scrollable scrollHeight="flex">
            <Column field="name" header="USER">
              <template #body="slotProps">
                <div class="user-cell-v3">
                  <div class="user-avatar-square" :class="'avatar-color-' + (recentUsers.indexOf(slotProps.data) % 5)">
                    {{ getInitials(slotProps.data.name) }}
                  </div>
                  <span class="user-name-v3">{{ slotProps.data.name }}</span>
                </div>
              </template>
            </Column>
            <Column field="role" header="ROLE">
              <template #body="slotProps">
                <span class="role-pill-v3" :class="slotProps.data.role">
                  {{ slotProps.data.role }}
                </span>
              </template>
            </Column>
            <Column field="email" header="CONTACT">
              <template #body="slotProps">
                <span class="user-email-v3">{{ slotProps.data.email }}</span>
              </template>
            </Column>
            <Column header="ACTIONS">
              <template #body>
                <div class="action-icons-v3">
                  <i class="pi pi-pencil action-icon"></i>
                  <i class="pi pi-trash action-icon delete"></i>
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-v3-root {
  height: calc(100vh - var(--topbar-height));
  background: #F8FAFC; /* Light gray from image */
  display: flex;
  flex-direction: column;
}

.dark .dashboard-v3-root {
  background: #020617; /* Even deeper navy for background depth */
}

.dashboard-content-v3 {
  flex: 1;
  padding: 3rem 2.5rem;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

.scrollable-area {
  overflow-y: auto;
}

.welcome-banner-v3 {
  margin-bottom: 2.5rem;
}

.welcome-title-v3 {
  font-size: 2.5rem;
  font-weight: 800;
  color: #0F172A;
  margin-bottom: 0.5rem;
}

.dark .welcome-title-v3 {
  color: #F8FAFC;
}

.welcome-subtitle-v3 {
  font-size: 1.125rem;
  color: #64748B;
  font-weight: 500;
}

.dark .welcome-subtitle-v3 {
  color: #94A3B8;
}

.stats-grid-v3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.stat-card-v3 {
  padding: 2.5rem 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.stat-icon-v3 {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-info-v3 {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label-v3 {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #64748B;
  letter-spacing: 0.5px;
}

.dark .stat-label-v3 {
  color: #94A3B8;
}

.stat-value-v3 {
  font-size: 2.5rem;
  font-weight: 800;
  color: #0F172A;
  line-height: 1;
}

.dark .stat-value-v3 {
  color: #F8FAFC;
}

.section-header-v3 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 0 0.5rem;
}

.section-title-v3 {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #1E293B;
  letter-spacing: 1px;
}

.dark .section-title-v3 {
  color: #CBD5E1;
}

.view-all-link {
  font-size: 0.875rem;
  font-weight: 700;
  color: #3B82F6;
  text-decoration: none;
}

.table-container-v3 {
  background: white;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.dark .table-container-v3 {
  background: #1E293B;
}

/* Borderless style table */
:deep(.borderless-table.p-datatable) {
  border: none !important;
}

:deep(.borderless-table .p-datatable-thead > tr > th) {
  background: white !important;
  color: #94A3B8 !important;
  font-weight: 600 !important;
  font-size: 0.75rem !important;
  text-transform: uppercase !important;
  border-bottom: 1px solid #F1F5F9 !important;
  padding: 1.25rem 2rem !important;
}

.dark :deep(.borderless-table .p-datatable-thead > tr > th) {
  background: #1E293B !important;
  color: #94A3B8 !important;
  border-bottom: 1px solid #334155 !important;
}

:deep(.borderless-table .p-datatable-tbody > tr) {
  background: white !important;
  border-bottom: 1px solid #F8FAFC !important;
}

.dark :deep(.borderless-table .p-datatable-tbody > tr) {
  background: #1E293B !important;
  border-bottom: 1px solid #334155 !important;
}

:deep(.borderless-table .p-datatable-tbody > tr > td) {
  padding: 1.25rem 2rem !important;
  border: none !important;
}

.user-cell-v3 {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.user-avatar-square {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
}

/* Specific avatar backgrouns colors like image */
.avatar-color-0 { background: #EFF6FF; color: #3B82F6; }
.avatar-color-1 { background: #FDF4FF; color: #A855F7; }
.avatar-color-2 { background: #F0FDFA; color: #0D9488; }
.avatar-color-3 { background: #FFF7ED; color: #EA580C; }
.avatar-color-4 { background: #FEF2F2; color: #EF4444; }

.user-name-v3 {
  font-weight: 700;
  color: #1E293B;
  font-size: 0.9375rem;
}

.dark .user-name-v3 {
  color: #F8FAFC;
}

.role-pill-v3 {
  padding: 0.375rem 1rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.role-pill-v3.admin { background: #DBEAFE; color: #1D4ED8; }
.role-pill-v3.rh { background: #DCFCE7; color: #15803D; }
.role-pill-v3.formateur { background: #F3E8FF; color: #7E22CE; }
.role-pill-v3.formateur_principal { background: #FEF3C7; color: #B45309; }
.role-pill-v3.etudiant { background: #E0F2FE; color: #0369A1; }

.user-email-v3 {
  color: #64748B;
  font-weight: 500;
}

.dark .user-email-v3 {
  color: #94A3B8;
}

.action-icons-v3 {
  display: flex;
  gap: 1.5rem;
}

.action-icon {
  color: #94A3B8;
  cursor: pointer;
  font-size: 1rem;
  transition: color 0.15s;
}

.dark .action-icon {
  color: #64748B;
}

.action-icon:hover { color: #3B82F6; }
.dark .action-icon:hover { color: #60A5FA; }
.action-icon.delete:hover { color: #EF4444; }

@media (max-width: 1024px) {
  .stats-grid-v3 { grid-template-columns: 1fr; }
}
</style>
