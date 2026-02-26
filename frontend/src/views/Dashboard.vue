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
import StatCard from '../components/common/StatCard.vue'
import PageHeader from '../components/common/PageHeader.vue'

// shared store
const store = useUserStore()

// Computed values from store (auto-unwrapped in template)
const role = computed(() => store.user?.role || 'guest')
const userId = computed(() => store.user?._id)
const userName = computed(() => store.user?.name || 'User')

// today's date
const today = new Date().toLocaleDateString('fr-FR', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})

// user initials helper
const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase()
}

// Shared data for dashboard
const usersCount = ref(0)
const departmentsCount = ref(0)
const coursesCount = ref(0)
const myCourses = ref([])
const myHours = ref([])
const recentUsers = ref([])
const loading = ref(false)

async function loadForRole() {
  if (!store.user) {
    return
  }

  loading.value = true
  try {
    const [usersRes, depsRes, coursesRes] = await Promise.all([
      userService.getAll().catch(err => {
        console.error('Failed to fetch users:', err)
        return { data: [] }
      }),
      departmentService.getAll().catch(err => {
        console.error('Failed to fetch departments:', err)
        return { data: [] }
      }),
      courseService.getAll().catch(err => {
        console.error('Failed to fetch courses:', err)
        return { data: [] }
      })
    ])

    const users = usersRes?.data ?? usersRes ?? []
    const deps = depsRes?.data ?? depsRes ?? []
    const courses = coursesRes?.data ?? coursesRes ?? []

    usersCount.value = users.length
    departmentsCount.value = deps.length
    coursesCount.value = courses.length

    // Admin / RH: recent users
    if (role.value === 'admin' || role.value === 'rh') {
      recentUsers.value = users.slice(-5).reverse()
    }

    // Formateur principal
    if (role.value === 'formateur_principal') {
      myCourses.value = Array.isArray(courses) ? courses : []
      const hoursRes = await hourService.getMy().catch(err => {
        console.error('Failed to fetch hours for principal:', err)
        return []
      })
      myHours.value = hoursRes?.data ?? hoursRes ?? []
    }

    // Formateur
    if (role.value === 'formateur') {
      const uid = String(userId.value)
      myCourses.value = (courses || []).filter(c => {
        const teacherId = c.teacher?._id ?? c.teacher
        return String(teacherId) === uid
      })
      const hoursRes = await hourService.getMy().catch(err => {
        console.error('Failed to fetch hours for teacher:', err)
        return []
      })
      const hours = hoursRes?.data ?? hoursRes ?? []
      myHours.value = (hours || []).filter(h => String(h.teacher?._id ?? h.teacher) === uid)
    }

    // Étudiant
    if (role.value === 'etudiant') {
      const uid = String(userId.value)
      myCourses.value = (courses || []).filter(c => {
        const students = c.students ?? []
        return students.some(s => String(s._id ?? s) === uid)
      })
      const hoursRes = await hourService.getMy().catch(err => {
        console.error('Failed to fetch hours for student:', err)
        return []
      })
      myHours.value = hoursRes?.data ?? hoursRes ?? []
    }
  } catch (err) {
    console.error('Error loading dashboard data:', err)
    showError('Impossible de charger les données du dashboard')
  } finally {
    loading.value = false
  }
}

// Initialize store and load data on mount
onMounted(async () => {
  try {
    await store.init().catch(() => {})
    if (store.user) {
      await loadForRole()
    }
  } catch (err) {
    console.error('Dashboard init error:', err)
  }
})

let studentRefreshInterval = null
const startStudentPolling = () => {
  if (studentRefreshInterval) return
  studentRefreshInterval = setInterval(async () => {
    try {
      if (store.user?.role === 'etudiant') {
        const coursesRes = await courseService.getAll().catch(() => [])
        const hoursRes = await hourService.getMy().catch(() => [])
        const courses = coursesRes?.data ?? coursesRes ?? []
        const hours = hoursRes?.data ?? hoursRes ?? []
        myCourses.value = courses.filter(c => {
          const students = c.students ?? []
          return students.some(s => (s._id ?? s) === userId.value)
        })
        myHours.value = hours
      }
    } catch (e) {
      console.error('Student polling error:', e)
    }
  }, 5000)
}

const stopStudentPolling = () => {
  if (studentRefreshInterval) {
    clearInterval(studentRefreshInterval)
    studentRefreshInterval = null
  }
}

watch(() => store.user, (newUser) => {
  if (newUser) {
    loadForRole()
    if (newUser.role === 'etudiant') startStudentPolling()
    else stopStudentPolling()
  } else {
    usersCount.value = 0
    departmentsCount.value = 0
    coursesCount.value = 0
    myCourses.value = []
    myHours.value = []
    recentUsers.value = []
    stopStudentPolling()
  }
})

import { onBeforeUnmount } from 'vue'
onBeforeUnmount(() => {
  stopStudentPolling()
})
</script>

<template>
  <div class="dashboard">
    <!-- Welcome Banner -->
    <div class="welcome-banner">
      <div>
        <h1 class="welcome-title">
          Welcome back, <span class="welcome-name">{{ userName }}</span> 👋
        </h1>
        <p class="welcome-date">{{ today }}</p>
      </div>
      <span class="role-badge" :class="role">{{ role }}</span>
    </div>

    <!-- Admin / RH view -->
    <template v-if="role === 'admin' || role === 'rh'">
      <div class="stats-grid">
        <StatCard
          icon="pi pi-users"
          label="Users"
          :value="usersCount"
          accent-color="#3B82F6"
        />
        <StatCard
          icon="pi pi-building"
          label="Departments"
          :value="departmentsCount"
          accent-color="#6366F1"
        />
        <StatCard
          icon="pi pi-book"
          label="Courses"
          :value="coursesCount"
          accent-color="#10B981"
        />
      </div>

      <div class="section">
        <PageHeader title="Recent Users" subtitle="Last 5 registered users" />
        <div class="glass-card">
          <div class="recent-users-table">
            <table class="data-table-simple">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="u in recentUsers" :key="u._id" class="data-row">
                  <td>
                    <div class="user-cell">
                      <div class="avatar-initials">{{ getInitials(u.name) }}</div>
                      <span class="user-cell-name">{{ u.name }}</span>
                    </div>
                  </td>
                  <td class="email-cell">{{ u.email }}</td>
                  <td><span class="role-badge" :class="u.role">{{ u.role }}</span></td>
                </tr>
                <tr v-if="!recentUsers.length">
                  <td colspan="3" class="empty-cell">
                    <div class="empty-inline">
                      <i class="pi pi-users" style="color: var(--text-muted);"></i>
                      <span>No recent users</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <!-- Formateur principal view -->
    <template v-if="role === 'formateur_principal'">
      <div class="stats-grid cols-2">
        <StatCard
          icon="pi pi-book"
          label="My Courses"
          :value="myCourses.length"
          accent-color="#3B82F6"
        />
        <StatCard
          icon="pi pi-clock"
          label="Hours Entries"
          :value="myHours.length"
          accent-color="#6366F1"
        />
      </div>
    </template>

    <!-- Formateur view -->
    <template v-if="role === 'formateur'">
      <div class="stats-grid cols-2">
        <StatCard
          icon="pi pi-book"
          label="My Courses"
          :value="myCourses.length"
          accent-color="#3B82F6"
        />
        <StatCard
          icon="pi pi-clock"
          label="My Entries"
          :value="myHours.length"
          accent-color="#6366F1"
        />
      </div>
    </template>

    <!-- Étudiant view -->
    <template v-if="role === 'etudiant'">
      <div class="stats-grid cols-2">
        <StatCard
          icon="pi pi-book"
          label="My Courses"
          :value="myCourses.length"
          accent-color="#3B82F6"
        />
        <StatCard
          icon="pi pi-clock"
          label="My Hours"
          :value="myHours.length"
          accent-color="#10B981"
        />
      </div>

      <div class="section">
        <PageHeader title="My Courses" />
        <div class="courses-grid">
          <div v-for="c in myCourses" :key="c._id" class="course-card glass-card">
            <div class="course-card-icon">
              <i class="pi pi-book"></i>
            </div>
            <div class="course-card-info">
              <div class="course-card-title">{{ c.title || c.name || 'Untitled Course' }}</div>
              <div class="course-card-meta">
                <span v-if="c.teacher?.name">{{ c.teacher.name }}</span>
                <span v-if="c.department?.name">• {{ c.department.name }}</span>
              </div>
            </div>
          </div>
          <div v-if="!myCourses.length" class="empty-courses glass-card">
            <i class="pi pi-book" style="font-size: 1.5rem; color: var(--text-muted);"></i>
            <p>No courses assigned yet.</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Welcome banner */
.welcome-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-radius: var(--radius-lg);
  background: var(--color-primary-light); /* Softer light background */
  color: var(--text-primary); /* Use theme primary color (black on light) */
  border: 1px solid var(--surface-border);
}

.dark .welcome-banner {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  color: white;
  border: none;
}

.welcome-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}
.welcome-name {
  font-weight: 800;
}
.welcome-date {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0.25rem 0 0;
  text-transform: capitalize;
}
.dark .welcome-date {
  color: white;
  opacity: 0.85;
}
.welcome-banner .role-badge {
  font-size: 0.8rem;
  padding: 0.25rem 0.85rem;
}
.dark .welcome-banner .role-badge {
  background: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
}

/* Stats grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
.stats-grid.cols-2 {
  grid-template-columns: repeat(2, 1fr);
}
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

.section {
  margin-top: 0.5rem;
}

/* Recent users table */
.recent-users-table {
  overflow-x: auto;
}
.data-table-simple {
  width: 100%;
  border-collapse: collapse;
}
.data-table-simple thead th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--surface-bg);
  border-bottom: 1px solid var(--surface-border);
}
.data-row {
  transition: background 0.15s;
}
.data-row:hover {
  background: var(--surface-hover);
}
.data-row td {
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
  color: var(--text-primary);
  border-bottom: 1px solid var(--surface-border);
}
.user-cell {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}
.user-cell-name {
  font-weight: 500;
}
.email-cell {
  color: var(--text-secondary);
}
.empty-cell {
  text-align: center;
  padding: 2rem 1rem !important;
}
.empty-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--text-muted);
  font-size: 0.85rem;
}

/* Courses grid */
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}
.course-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
}
.course-card-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}
.dark .course-card-icon {
  background: rgba(59, 130, 246, 0.15);
}
.course-card-info {
  min-width: 0;
}
.course-card-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
}
.course-card-meta {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 0.2rem;
}
.empty-courses {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem;
  gap: 0.5rem;
  color: var(--text-muted);
  font-size: 0.85rem;
}
</style>
