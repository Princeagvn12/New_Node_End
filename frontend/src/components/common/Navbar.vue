<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../store/user.store'
import { toggleTheme } from '../../composables/useTheme'
import { useAuth } from '../../composables/useAuth'

const store = useUserStore()
const router = useRouter()
const { logout: doLogout } = useAuth()

const goHome = () => router.push({ name: 'Dashboard' })
const logout = async () => {
  await doLogout()
  router.push({ name: 'Login' })
}

// remplace isAdmin par canAccessUsers pour inclure les formateurs
const canAccessUsers = computed(() => {
  const role = store.user?.role
  return !!role && ['admin', 'rh', 'formateur_principal', 'formateur'].includes(role)
})

// Nouveau: controle d'accès pour la vue Hours (admins/rh n'y ont pas accès)
const canViewHours = computed(() => {
  const role = store.user?.role
  return !!role && ['formateur', 'formateur_principal', 'etudiant'].includes(role)
})
</script>

<template>
  <nav class="w-full p-4 flex items-center justify-between bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-lg rounded-xl">
    <div class="flex items-center gap-6">
      <button @click="goHome" class="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent hover:from-blue-600 hover:to-blue-700 transition-all">Gestion</button>
      <div class="hidden md:flex gap-4 text-sm font-medium">
        <router-link to="/departments" class="px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all">Departments</router-link>
        <router-link to="/courses" class="px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all">Courses</router-link>
        <router-link v-if="canViewHours" to="/hours" class="px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all">Hours</router-link>
        <router-link v-if="canAccessUsers" to="/users" class="px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all">Users</router-link>
      </div>
    </div>

    <div class="flex items-center gap-4">
      <button @click="toggleTheme" title="Toggle theme" class="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zM4.22 4.22a1 1 0 011.42 0L6.64 5.22a1 1 0 11-1.42 1.42L4.22 5.64a1 1 0 010-1.42zM2 10a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zM14.36 6.64a1 1 0 011.42-1.42l1 1a1 1 0 11-1.42 1.42l-1-1zM17 9a1 1 0 110 2h-1a1 1 0 110-2h1zM4.22 15.78a1 1 0 000 1.42l1 1a1 1 0 001.42-1.42l-1-1a1 1 0 00-1.42 0zM10 15a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM14.36 13.36a1 1 0 011.42 1.42l-1 1a1 1 0 11-1.42-1.42l1-1z" />
        </svg>
      </button>

      <div class="flex items-center gap-3">
        <div class="text-sm font-medium text-slate-600 dark:text-slate-300">
          <div v-if="store.isAuthenticated">{{ store.user?.name }}</div>
          <div v-else>Guest</div>
        </div>
        <button v-if="store.isAuthenticated" @click="logout" class="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium shadow-sm hover:shadow transition-all">
          Logout
        </button>
        <router-link v-else to="/login" class="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium shadow-sm hover:shadow transition-all">
          Login
        </router-link>
      </div>
    </div>
  </nav>
</template>

<!-- Navbar component -->