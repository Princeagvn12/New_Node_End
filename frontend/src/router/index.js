import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/user.store'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import UsersView from '../views/UsersView.vue'
import DepartmentsView from '../views/DepartmentsView.vue'
import CoursesView from '../views/CoursesView.vue'
import HoursView from '../views/HoursView.vue'
import guards from './guards'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/users',
    name: 'Users',
    component: UsersView,
    meta: { 
      requiresAuth: true,
      allowedRoles: ['admin', 'rh', 'formateur_principal', 'formateur'] // <--- ajouté formateur* ici
    }
  },
  {
    path: '/departments',
    name: 'Departments',
    component: DepartmentsView,
    meta: { 
      requiresAuth: true,
      allowedRoles: ['admin', 'rh', 'formateur_principal', 'formateur', 'etudiant']
    }
  },
  {
    path: '/courses',
    name: 'Courses',
    component: CoursesView,
    meta: { 
      requiresAuth: true,
      allowedRoles: ['admin', 'rh', 'formateur_principal', 'formateur', 'etudiant']
    }
  },
  {
    path: '/hours',
    name: 'Hours',
    component: HoursView,
    meta: { 
      requiresAuth: true,
      allowedRoles: ['admin', 'rh', 'formateur_principal', 'formateur', 'etudiant']
    }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/ForgotPassword.vue')
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('../views/ResetPassword.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/SettingsView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => guards(to, from, next, router))


export default router