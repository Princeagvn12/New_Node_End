<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../../store/user.store'

const props = defineProps({
  collapsed: { type: Boolean, default: false }
})

const store = useUserStore()
const router = useRouter()
const route = useRoute()

const role = computed(() => store.user?.role || 'guest')
const userName = computed(() => store.user?.name || 'Admin Système')
const userEmail = computed(() => store.user?.email || 'admin@gestion.com')
const userInitials = computed(() => {
  const name = store.user?.name || 'AS'
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
      label: 'Users',
      icon: 'pi pi-users',
      route: '/users',
      roles: ['admin', 'rh', 'formateur_principal', 'formateur']
    },
    {
      label: 'Hours',
      icon: 'pi pi-clock',
      route: '/hours',
      roles: ['formateur', 'formateur_principal', 'etudiant']
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
</script>

<template>
  <aside class="sidebar-v2" :class="{ collapsed }">
    <!-- Brand Header -->
    <div class="sidebar-brand" @click="navigate('/')">
      <h1 class="brand-text">Gestion</h1>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-nav-v2">
      <div
        v-for="item in navItems"
        :key="item.route"
        class="nav-link"
        :class="{ active: isActive(item.route) }"
        @click="navigate(item.route)"
      >
        <i :class="item.icon" class="link-icon"></i>
        <transition name="fade">
          <span v-show="!collapsed" class="link-label">{{ item.label }}</span>
        </transition>
      </div>
    </nav>

    <!-- User Profile (Bottom) -->
    <div class="sidebar-profile">
      <div class="profile-container">
        <div class="profile-avatar">
          {{ userInitials }}
        </div>
        <transition name="fade">
          <div v-show="!collapsed" class="profile-details">
            <span class="profile-name">{{ userName }}</span>
            <span class="profile-email">{{ userEmail }}</span>
          </div>
        </transition>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-v2 {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: white;
  border-right: 1px solid #F1F5F9;
  display: flex;
  flex-direction: column;
  z-index: 50;
  transition: width 0.3s var(--ease-out-expo);
}

.dark .sidebar-v2 {
  background: #0F172A;
  border-right-color: #1E293B;
}

.sidebar-v2.collapsed {
  width: var(--sidebar-collapsed-width);
}

.sidebar-brand {
  height: var(--topbar-height);
  display: flex;
  align-items: center;
  padding: 0 2rem;
  cursor: pointer;
}

.brand-text {
  font-size: 1.5rem;
  font-weight: 900;
  color: #3B82F6;
  letter-spacing: -0.5px;
}

.sidebar-nav-v2 {
  flex: 1;
  padding: 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1.25rem;
  border-radius: 0.75rem;
  color: #64748B;
  font-weight: 500;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-link:hover {
  background: #F8FAFC;
  color: #1E293B;
}

.dark .nav-link:hover {
  background: #1E293B;
  color: #F8FAFC;
}

.nav-link.active {
  background: #EFF6FF;
  color: #3B82F6;
  font-weight: 700;
}

.dark .nav-link.active {
  background: rgba(59, 130, 246, 0.15);
  color: #60A5FA;
}

.link-icon {
  font-size: 1.125rem;
  width: 20px;
  text-align: center;
}

.sidebar-profile {
  padding: 1.5rem;
  border-top: 1px solid #F1F5F9;
}

.dark .sidebar-profile {
  border-top-color: #1E293B;
}

.profile-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.profile-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3B82F6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.profile-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.profile-name {
  font-weight: 700;
  font-size: 0.875rem;
  color: #1E293B;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dark .profile-name {
  color: #F8FAFC;
}

.profile-email {
  font-size: 0.75rem;
  color: #94A3B8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 768px) {
  .sidebar-v2 {
    transform: translateX(-100%);
  }
}
</style>
