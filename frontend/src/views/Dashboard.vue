<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../store/user.store'
import userService from '../services/user.service'
import departmentService from '../services/department.service'
import courseService from '../services/course.service'
import hourService from '../services/hour.service'
import { showError } from '../utils/toast'

const store = useUserStore()
const role = computed(() => store.user?.role || 'guest')
const userId = computed(() => store.user?._id)

// Shared data
const usersCount = ref(0)
const departmentsCount = ref(0)
const coursesCount = ref(0)
const myCourses = ref([])
const myHours = ref([])
const recentUsers = ref([])

const loading = ref(false)

const loadForRole = async () => {
  loading.value = true
  try {
    // Fetch common lists
    const [usersRes, depsRes, coursesRes] = await Promise.all([
      userService.getAll().catch(() => ({ data: [] })),
      departmentService.getAll().catch(() => ({ data: [] })),
      courseService.getAll().catch(() => ({ data: [] }))
    ])

    usersCount.value = (usersRes.data || []).length
    departmentsCount.value = (depsRes.data || []).length
    coursesCount.value = (coursesRes.data || []).length

    // Role-specific
    if (role.value === 'admin' || role.value === 'rh') {
      recentUsers.value = (usersRes.data || []).slice(-5).reverse()
    }

    if (role.value === 'formateur' || role.value === 'formateur_principal') {
      // my courses where teacher == userId
      myCourses.value = (coursesRes.data || []).filter(c => c.teacher === userId.value || c.teacher?._id === userId.value)
      // my hours
      const hoursRes = await hourService.getMy().catch(() => ({ data: [] }))
      myHours.value = (hoursRes.data || []).filter(h => h.teacher === userId.value || h.teacher?._id === userId.value)
    }

    if (role.value === 'etudiant') {
      // courses where students includes userId
      myCourses.value = (coursesRes.data || []).filter(c => Array.isArray(c.students) && c.students.includes(userId.value) || (c.students || []).some(s => s === userId.value || s?._id === userId.value))
      const hoursRes = await hourService.getMy().catch(() => ({ data: [] }))
      myHours.value = (hoursRes.data || []).filter(h => h.teacher === userId.value || h.teacher?._id === userId.value || h.student === userId.value)
    }
  } catch (e) {
    console.error(e)
    showError('Failed to load dashboard data')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // ensure store already has user (if not, some guard should init it elsewhere)
  loadForRole()
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
      </div>
      <div class="glass-card p-4">
        <h3 class="font-semibold">Mes heures</h3>
        <div class="mt-2 text-lg">{{ myHours.length }} entrées</div>
      </div>
    </section>
  </div>
</template>