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

// shared store
const store = useUserStore()

// Computed values from store (auto-unwrapped in template)
const role = computed(() => store.user?.role || 'guest')
// removed unused userName computed
const userId = computed(() => store.user?._id)

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
    // Nothing to load until we have a user
    return
  }

  loading.value = true
  try {
    // Fetch common lists in parallel
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

    // Formateur principal: backend already filters by department -> use returned list as-is
    if (role.value === 'formateur_principal') {
      myCourses.value = Array.isArray(courses) ? courses : []

      const hoursRes = await hourService.getMy().catch(err => {
        console.error('Failed to fetch hours for principal:', err)
        return []
      })
      myHours.value = hoursRes?.data ?? hoursRes ?? []
    }

    // Formateur: only show courses where teacher === current user
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

    // Étudiant: backend already filters courses for the student; use returned list but normalize just in case
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
    // Ensure store tries to hydrate the user (calls /auth/me)
    await store.init().catch(() => {})

    if (store.user) {
      await loadForRole()
    }
  } catch (err) {
    console.error('Dashboard init error:', err)
  }
})

// React to user changes (login/logout or role change)
// For students we want a periodic refresh so they see changes made by admins/principals
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

        // update student's own lists
        myCourses.value = courses.filter(c => {
          const students = c.students ?? []
          return students.some(s => (s._id ?? s) === userId.value)
        })
        myHours.value = hours
      }
    } catch (e) {
      console.error('Student polling error:', e)
    }
  }, 5000) // every 5s
}

const stopStudentPolling = () => {
  if (studentRefreshInterval) {
    clearInterval(studentRefreshInterval)
    studentRefreshInterval = null
  }
}

watch(() => store.user, (newUser) => {
  if (newUser) {
    // reload role-specific data when a user logs in or changes
    loadForRole()
    if (newUser.role === 'etudiant') startStudentPolling()
    else stopStudentPolling()
  } else {
    // clear
    usersCount.value = 0
    departmentsCount.value = 0
    coursesCount.value = 0
    myCourses.value = []
    myHours.value = []
    recentUsers.value = []
    stopStudentPolling()
  }
})

// cleanup on unmount
import { onBeforeUnmount } from 'vue'
onBeforeUnmount(() => {
  stopStudentPolling()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-blue-400">Dashboard</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">Bienvenue, <strong>{{ store.user?.name || 'Invité' }}</strong> — rôle: <span class="font-medium">{{ role }}</span></p>
      </div>
    </div>

    <!-- Admin / RH view -->
    <section v-if="role === 'admin' || role === 'rh'" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="glass-card p-4">
        <div class="text-sm text-gray-500">Utilisateurs</div>
        <div class="text-2xl font-semibold">{{ usersCount }}</div>
      </div>
      <div class="glass-card p-4">
        <div class="text-sm text-gray-500">Départements</div>
        <div class="text-2xl font-semibold">{{ departmentsCount }}</div>
      </div>
      <div class="glass-card p-4">
        <div class="text-sm text-gray-500">Cours</div>
        <div class="text-2xl font-semibold">{{ coursesCount }}</div>
      </div>
    </section>

    <section v-if="role === 'admin' || role === 'rh'" class="mt-4">
      <h2 class="text-lg font-semibold mb-2">Utilisateurs récents</h2>
      <div class="glass-card p-4">
        <ul class="divide-y">
          <li v-for="u in recentUsers" :key="u._id" class="py-2">
            <div class="flex justify-between">
              <div>
                <div class="font-medium">{{ u.name }}</div>
                <div class="text-sm text-gray-500">{{ u.email }} — {{ u.role }}</div>
              </div>
            </div>
          </li>
          <li v-if="!recentUsers.length" class="py-2 text-sm text-gray-500">Aucun utilisateur récent</li>
        </ul>
      </div>
    </section>

    <!-- Formateur principal view -->
    <section v-if="role === 'formateur_principal'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="glass-card p-4">
        <h3 class="font-semibold">Mes cours (dans mon département)</h3>
        <div class="mt-2 text-lg">{{ myCourses.length }} cours</div>
      </div>
      <div class="glass-card p-4">
        <h3 class="font-semibold">Saisies d'heures récentes</h3>
        <div class="mt-2 text-lg">{{ myHours.length }} entrées</div>
      </div>
    </section>

    <!-- Formateur view -->
    <section v-if="role === 'formateur'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="glass-card p-4">
        <h3 class="font-semibold">Mes cours</h3>
        <div class="mt-2 text-lg">{{ myCourses.length }} cours</div>
      </div>
      <div class="glass-card p-4">
        <h3 class="font-semibold">Mes saisies</h3>
        <div class="mt-2 text-lg">{{ myHours.length }} entrées</div>
      </div>
    </section>

    <!-- Étudiant view -->
    <section v-if="role === 'etudiant'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="glass-card p-4">
        <h3 class="font-semibold">Mes cours</h3>
        <div class="mt-2 text-lg">{{ myCourses.length }} cours</div>
        <div class="mt-4">
          <ul class="divide-y">
            <li v-for="c in myCourses" :key="c._id" class="py-2">
              <div class="flex justify-between items-center">
                <div>
                  <div class="font-medium">{{ c.title || c.name || 'Cours sans titre' }}</div>
                  <div class="text-sm text-gray-500">{{ c.teacher?.name || c.teacher?.email || '' }} — {{ c.department?.name || '' }}</div>
                </div>
              </div>
            </li>
            <li v-if="!myCourses.length" class="py-2 text-sm text-gray-500">Vous n'êtes affecté à aucun cours pour le moment.</li>
          </ul>
        </div>
      </div>
      <div class="glass-card p-4">
        <h3 class="font-semibold">Mes heures</h3>
        <div class="mt-2 text-lg">{{ myHours.length }} entrées</div>
      </div>
    </section>
  </div>
</template>
