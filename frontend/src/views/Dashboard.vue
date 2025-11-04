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
  <div class="space-y-8 p-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold bg-linear-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Dashboard</h1>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Bienvenue, <strong>{{ store.user?.name || 'Invité' }}</strong> — rôle: <span class="font-medium">{{ role }}</span></p>
      </div>
      <div class="flex items-center gap-3">
        <!-- future actions / filters can go here -->
      </div>
    </div>
    
  </div>

    <!-- Admin / RH view -->
        <section v-if="role === 'admin' || role === 'rh'" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="p-6 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl shadow-blue-500/5 border border-blue-100 dark:border-blue-900 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/50">
            <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Total Users</p>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ usersCount }}</p>
          </div>
        </div>
      </div>
      
      <div class="p-6 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl shadow-blue-500/5 border border-blue-100 dark:border-blue-900 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/50">
            <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Departments</p>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ departmentsCount }}</p>
          </div>
        </div>
      </div>
      
      <div class="p-6 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl shadow-blue-500/5 border border-blue-100 dark:border-blue-900 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/50">
            <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Courses</p>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ coursesCount }}</p>
          </div>
        </div>
      </div>
    </section>

    <section v-if="role === 'admin' || role === 'rh'" class="mt-8">
      <h2 class="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Recent Users</h2>
      <div class="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl border border-blue-100 dark:border-blue-900 overflow-hidden">
        <div class="p-6 space-y-4">
          <div v-for="user in recentUsers" :key="user._id" class="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <span class="text-blue-600 dark:text-blue-400 font-medium">{{ user.name.charAt(0) }}</span>
              </div>
              <div>
                <p class="font-medium text-slate-900 dark:text-white">{{ user.name }}</p>
                <p class="text-sm text-slate-500 dark:text-slate-400">{{ user.email }}</p>
              </div>
            </div>
            <span class="px-3 py-1 rounded-lg text-xs font-medium" :class="{
              'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400': user.role === 'admin',
              'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400': user.role === 'formateur',
              'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400': user.role === 'etudiant'
            }">
              {{ user.role }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Formateur principal view -->
    <section v-if="role === 'formateur_principal'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl border border-blue-100 dark:border-blue-900 p-6">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Mes cours (dans mon département)</h3>
        <div class="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{{ myCourses.length }} <span class="text-sm font-medium text-slate-500">cours</span></div>
        <div class="mt-4 space-y-2">
          <div v-for="course in myCourses.slice(0,5)" :key="course._id" class="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
            <div class="font-medium text-slate-900 dark:text-white">{{ course.title }}</div>
            <div class="text-sm text-slate-500 dark:text-slate-400">{{ course.code || course.department?.name || '' }}</div>
          </div>
        </div>
      </div>
      <div class="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl border border-blue-100 dark:border-blue-900 p-6">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Saisies d'heures récentes</h3>
        <div class="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{{ myHours.length }} <span class="text-sm font-medium text-slate-500">entrées</span></div>
        <div class="mt-4 space-y-2">
          <div v-for="h in myHours.slice(0,5)" :key="h._id" class="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 flex justify-between items-center">
            <div>
              <div class="font-medium text-slate-900 dark:text-white">{{ h.course?.title || 'Cours inconnu' }}</div>
              <div class="text-sm text-slate-500 dark:text-slate-400">{{ new Date(h.date).toLocaleDateString() }}</div>
            </div>
            <div class="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{{ h.hours }}h</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Formateur view -->
    <section v-if="role === 'formateur'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl border border-blue-100 dark:border-blue-900 p-6">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Mes cours</h3>
        <div class="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{{ myCourses.length }} <span class="text-sm font-medium text-slate-500">cours</span></div>
        <div class="mt-4 space-y-2">
          <div v-for="course in myCourses.slice(0,5)" :key="course._id" class="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
            <div class="font-medium text-slate-900 dark:text-white">{{ course.title }}</div>
            <div class="text-sm text-slate-500 dark:text-slate-400">{{ course.code || course.department?.name || '' }}</div>
          </div>
        </div>
      </div>
      <div class="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl border border-blue-100 dark:border-blue-900 p-6">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Mes saisies</h3>
        <div class="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{{ myHours.length }} <span class="text-sm font-medium text-slate-500">entrées</span></div>
        <div class="mt-4 space-y-2">
          <div v-for="h in myHours.slice(0,5)" :key="h._id" class="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 flex justify-between items-center">
            <div>
              <div class="font-medium text-slate-900 dark:text-white">{{ h.course?.title || 'Cours inconnu' }}</div>
              <div class="text-sm text-slate-500 dark:text-slate-400">{{ new Date(h.date).toLocaleDateString() }}</div>
            </div>
            <div class="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{{ h.hours }}h</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Étudiant view -->
    <section v-if="role === 'etudiant'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl border border-blue-100 dark:border-blue-900 p-6">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Mes cours</h3>
        <div class="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{{ myCourses.length }} <span class="text-sm font-medium text-slate-500">cours</span></div>
        <div class="mt-4">
          <ul class="space-y-3">
            <li v-for="c in myCourses" :key="c._id" class="py-2">
              <div class="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                <div>
                  <div class="font-medium text-slate-900 dark:text-white">{{ c.title || c.name || 'Cours sans titre' }}</div>
                  <div class="text-sm text-slate-500 dark:text-slate-400">{{ c.teacher?.name || c.teacher?.email || '' }} — {{ c.department?.name || '' }}</div>
                </div>
              </div>
            </li>
            <li v-if="!myCourses.length" class="py-2 text-sm text-slate-500">Vous n'êtes affecté à aucun cours pour le moment.</li>
          </ul>
        </div>
      </div>
      <div class="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl border border-blue-100 dark:border-blue-900 p-6">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Mes heures</h3>
        <div class="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{{ myHours.length }} <span class="text-sm font-medium text-slate-500">entrées</span></div>
        <div class="mt-4 space-y-2">
          <div v-for="h in myHours.slice(0,5)" :key="h._id" class="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 flex justify-between items-center">
            <div>
              <div class="font-medium text-slate-900 dark:text-white">{{ h.course?.title || 'Cours inconnu' }}</div>
              <div class="text-sm text-slate-500 dark:text-slate-400">{{ new Date(h.date).toLocaleDateString() }}</div>
            </div>
            <div class="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{{ h.hours }}h</div>
          </div>
        </div>
      </div>
    </section>
</template>
