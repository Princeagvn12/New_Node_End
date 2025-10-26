import { createRouter, createWebHistory } from 'vue-router'
import guards from './guards'

const routes = [
  { path: '/', name: 'Home', redirect: { name: 'Dashboard' } },
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  { path: '/dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { requiresAuth: true } },
  { path: '/users', name: 'Users', component: () => import('../views/UsersView.vue'), meta: { requiresAuth: true, roles: ['admin','rh'] } },
  { path: '/departments', name: 'Departments', component: () => import('../views/DepartmentsView.vue'), meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/courses', name: 'Courses', component: () => import('../views/CoursesView.vue'), meta: { requiresAuth: true, roles: ['formateur_principal','admin'] } },
  { path: '/hours', name: 'Hours', component: () => import('../views/HoursView.vue'), meta: { requiresAuth: true, roles: ['formateur','formateur_principal'] } },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => guards(to, from, next, router))

export default router
