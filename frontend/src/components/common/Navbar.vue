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

const isAdmin = computed(() => store.user?.role === 'admin' || store.user?.role === 'rh')
</script>

<template>
  <nav class="w-full p-4 flex items-center justify-between bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-lg">
    <div class="flex items-center gap-4">
      <button @click="goHome" class="text-2xl font-semibold text-blue-400">Gestion</button>
      <div class="hidden md:flex gap-3 text-sm">
        <router-link to="/departments" class="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">Departments</router-link>
        <router-link to="/courses" class="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">Courses</router-link>
        <router-link to="/hours" class="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">Hours</router-link>
        <router-link v-if="isAdmin" to="/users" class="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">Users</router-link>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <button @click="toggleTheme" title="Toggle theme" class="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-700 dark:text-slate-200" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zM4.22 4.22a1 1 0 011.42 0L6.64 5.22a1 1 0 11-1.42 1.42L4.22 5.64a1 1 0 010-1.42zM2 10a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zM14.36 6.64a1 1 0 011.42-1.42l1 1a1 1 0 11-1.42 1.42l-1-1zM17 9a1 1 0 110 2h-1a1 1 0 110-2h1zM4.22 15.78a1 1 0 000 1.42l1 1a1 1 0 001.42-1.42l-1-1a1 1 0 00-1.42 0zM10 15a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM14.36 13.36a1 1 0 011.42 1.42l-1 1a1 1 0 11-1.42-1.42l1-1z" />
        </svg>
      </button>

      <div class="flex items-center gap-2">
        <div class="text-sm">
          <div v-if="store.isAuthenticated">{{ store.user?.name }}</div>
          <div v-else>Guest</div>
        </div>
        <button v-if="store.isAuthenticated" @click="logout" class="px-3 py-1 rounded bg-blue-400 text-white text-sm">Logout</button>
        <router-link v-else to="/login" class="px-3 py-1 rounded bg-blue-400 text-white text-sm">Login</router-link>
      </div>
    </div>
  </nav>
</template>

<!-- Navbar component -->