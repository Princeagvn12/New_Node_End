import { useUserStore } from '../store/user.store'

// guard function to be used in router.beforeEach
export default async function (to, from, next, router) {
  const store = useUserStore()

  // If route doesn't require auth, continue
  if (!to.meta?.requiresAuth) return next()

  // If already authenticated, check role if needed
  if (store.isAuthenticated) {
    if (to.meta.roles && !to.meta.roles.includes(store.user?.role)) {
      return next({ name: 'Dashboard' })
    }
    return next()
  }

  // Not authenticated yet: try to hydrate from server
  try {
    await store.init()
    if (to.meta.roles && !to.meta.roles.includes(store.user?.role)) {
      return next({ name: 'Dashboard' })
    }
    return next()
  } catch (err) {
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }
}
// placeholder: frontend/src/router/guards.js