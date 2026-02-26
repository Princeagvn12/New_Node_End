<script setup>
import { computed } from 'vue'
import { useUserStore } from '../../store/user.store'
import { useAuth } from '../../composables/useAuth'
import { toggleTheme } from '../../composables/useTheme'
import { useRouter } from 'vue-router'

const emit = defineEmits(['toggle-sidebar'])
const store = useUserStore()
const router = useRouter()
const { logout: doLogout } = useAuth()

const userName = computed(() => store.user?.name || 'User')
const userInitials = computed(() => {
  const name = store.user?.name || 'U'
  const parts = name.split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase()
})

const logout = async () => {
  await doLogout()
  router.push({ name: 'Login' })
}
</script>

<template>
  <header class="topbar">
    <div class="topbar-left">
      <!-- Removed redundant toggle button for cleaner UI -->
    </div>

    <div class="topbar-right">
      <!-- Theme toggle -->
      <button class="icon-btn" @click="toggleTheme" title="Toggle dark/light mode">
        <i class="pi pi-moon dark-icon"></i>
        <i class="pi pi-sun light-icon"></i>
      </button>

      <!-- User section -->
      <div class="user-section">
        <div class="avatar-initials">{{ userInitials }}</div>
        <span class="user-name-topbar">{{ userName }}</span>
        <button class="icon-btn logout" @click="logout" title="Logout">
          <i class="pi pi-sign-out"></i>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  height: var(--topbar-height);
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  position: sticky;
  top: 0;
  z-index: 30;
  backdrop-filter: blur(12px);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toggle-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  transition: all 0.2s ease;
}
.toggle-btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.icon-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.2s ease;
  position: relative;
}
.icon-btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}
.icon-btn.logout:hover {
  color: var(--color-danger);
}

/* Theme icon toggle */
.dark-icon { display: block; }
.light-icon { display: none; }
.dark .dark-icon { display: none; }
.dark .light-icon { display: block; }

.user-section {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding-left: 0.75rem;
  border-left: 1px solid var(--surface-border);
}

.user-name-topbar {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
}

@media (max-width: 640px) {
  .user-name-topbar {
    display: none;
  }
}
</style>
