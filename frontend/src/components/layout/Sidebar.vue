<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../../store/user.store'
import { useAuth } from '../../composables/useAuth'

const props = defineProps({
  collapsed: { type: Boolean, default: false }
})
const emit = defineEmits(['toggle'])

const store = useUserStore()
const router = useRouter()
const route = useRoute()
const { logout: doLogout } = useAuth()

const role = computed(() => store.user?.role || 'guest')
const userName = computed(() => store.user?.name || 'User')
const userInitials = computed(() => {
  const name = store.user?.name || 'U'
  const parts = name.split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase()
})

// Role-aware navigation
const navItems = computed(() => {
  const items = [
    {
      label: 'Dashboard',
      icon: 'pi pi-th-large',
      route: '/',
      roles: ['admin', 'rh', 'formateur', 'formateur_principal', 'etudiant']
    },
    {
      label: 'Departments',
      icon: 'pi pi-building',
      route: '/departments',
      roles: ['admin', 'rh', 'formateur_principal', 'formateur', 'etudiant']
    },
    {
      label: 'Courses',
      icon: 'pi pi-book',
      route: '/courses',
      roles: ['admin', 'rh', 'formateur_principal', 'formateur', 'etudiant']
    },
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      route: '/settings',
      roles: ['admin', 'rh', 'formateur_principal', 'formateur', 'etudiant']
    },
    {
      label: 'Hours',
      icon: 'pi pi-clock',
      route: '/hours',
      roles: ['formateur', 'formateur_principal', 'etudiant']
    },
    {
      label: 'Users',
      icon: 'pi pi-users',
      route: '/users',
      roles: ['admin', 'rh', 'formateur_principal', 'formateur']
    }
  ]
  return items.filter(item => item.roles.includes(role.value))
})

const isActive = (path) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const navigate = (path) => {
  router.push(path)
}

const logout = async () => {
  await doLogout()
  router.push({ name: 'Login' })
}
</script>

<template>
  <aside
    class="sidebar"
    :class="{ collapsed }"
  >
    <!-- Logo area -->
    <div class="sidebar-header">
      <div class="logo-area" @click="navigate('/')">
        <div class="logo-icon">
          <i class="pi pi-bolt" style="font-size: 1.1rem;"></i>
        </div>
        <transition name="fade">
          <span v-show="!collapsed" class="logo-text">Gestion</span>
        </transition>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-nav">
      <div
        v-for="item in navItems"
        :key="item.route"
        class="nav-item"
        :class="{ active: isActive(item.route) }"
        @click="navigate(item.route)"
        :title="collapsed ? item.label : ''"
      >
        <div class="nav-item-indicator"></div>
        <i :class="item.icon" class="nav-icon"></i>
        <transition name="fade">
          <span v-show="!collapsed" class="nav-label">{{ item.label }}</span>
        </transition>
      </div>
    </nav>

    <!-- Footer: User info -->
    <div class="sidebar-footer">
      <div class="user-info">
        <div class="avatar-initials" style="width: 34px; height: 34px; font-size: 0.75rem;">
          {{ userInitials }}
        </div>
        <transition name="fade">
          <div v-show="!collapsed" class="user-details">
            <div class="user-name">{{ userName }}</div>
            <span class="role-badge" :class="role">{{ role }}</span>
          </div>
        </transition>
      </div>
      <button
        v-show="!collapsed"
        @click="logout"
        class="logout-btn"
        title="Logout"
      >
        <i class="pi pi-sign-out"></i>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: var(--surface-card);
  border-right: 1px solid var(--surface-border);
  display: flex;
  flex-direction: column;
  z-index: 40;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
}

.sidebar-header {
  padding: 1.25rem 1rem;
  border-bottom: 1px solid var(--surface-border);
}
.logo-area {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}
.logo-icon {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.logo-text {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-primary);
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  position: relative;
  white-space: nowrap;
}
.nav-item:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}
.nav-item.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 600;
}
.dark .nav-item.active {
  background: rgba(59, 130, 246, 0.15);
  color: #93C5FD;
}
.nav-item-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  background: var(--color-primary);
  border-radius: 0 3px 3px 0;
  transition: height 0.2s ease;
}
.nav-item.active .nav-item-indicator {
  height: 60%;
}
.nav-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}
.nav-label {
  font-size: 0.875rem;
  white-space: nowrap;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--surface-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  overflow: hidden;
}
.user-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
  white-space: nowrap;
}
.user-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
}
.logout-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.logout-btn:hover {
  background: #FEE2E2;
  color: var(--color-danger);
}
.dark .logout-btn:hover {
  background: rgba(239, 68, 68, 0.15);
}

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Mobile */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }
  .sidebar:not(.collapsed) {
    transform: translateX(0);
    width: var(--sidebar-width);
    box-shadow: var(--shadow-xl);
  }
}
</style>
