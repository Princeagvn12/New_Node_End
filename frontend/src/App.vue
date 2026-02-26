<script setup>
import Navbar from './components/common/Navbar.vue'
import ConfirmDialog from './components/common/ConfirmDialog.vue'
import { confirmState, handleConfirm, handleCancel } from './plugins/confirmPlugin'
import { useRoute } from 'vue-router'
import { computed, watch, onBeforeUnmount } from 'vue'
import { useUserStore } from './store/user.store'

const route = useRoute()
const store = useUserStore()

const noNavRoutes = ['Login', 'ForgotPassword', 'ResetPassword']

// show navbar only when user is authenticated and not on auth-related routes
const showNavbar = computed(() => {
  return !!store.isAuthenticated && !noNavRoutes.includes(route.name)
})

// keep page from scrolling on login/forgot/reset pages (when user not authenticated)
const applyOverflow = () => {
  const shouldHide = !showNavbar.value
  document.documentElement.style.overflow = shouldHide ? 'hidden' : ''
  document.body.style.overflow = shouldHide ? 'hidden' : ''
}

watch(
  () => [route.name, store.isAuthenticated],
  applyOverflow,
  { immediate: true }
)

onBeforeUnmount(() => {
  // restore overflow on unmount
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
    <Navbar v-if="showNavbar" />
    <main class="container mx-auto px-4 py-6">
      <router-view />
    </main>

    <ConfirmDialog
      v-model="confirmState.isOpen"
      :title="confirmState.title"
      :message="confirmState.message"
      :variant="confirmState.variant"
      :confirm-text="confirmState.confirmText"
      :cancel-text="confirmState.cancelText"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
  </div>
</template>

<style scoped>
/* Global styles for transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Note: no extra CSS for layout — Tailwind only in components */
</style>