<script setup>
import MainLayout from './components/layout/MainLayout.vue'
import ConfirmDialog from './components/common/ConfirmDialog.vue'
import { confirmState, handleConfirm, handleCancel } from './plugins/confirmPlugin'
import { useRoute } from 'vue-router'
import { computed, watch, onBeforeUnmount } from 'vue'
import { useUserStore } from './store/user.store'

const route = useRoute()
const store = useUserStore()

const noNavRoutes = ['Login', 'ForgotPassword', 'ResetPassword']

// show layout only when user is authenticated and not on auth-related routes
const showLayout = computed(() => {
  return !!store.isAuthenticated && !noNavRoutes.includes(route.name)
})

// keep page from scrolling on login/forgot/reset pages (when user not authenticated)
const applyOverflow = () => {
  const shouldHide = !showLayout.value
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
  <div class="min-h-screen" style="background: var(--surface-bg); color: var(--text-primary); transition: background-color 0.3s, color 0.3s;">
    <!-- Authenticated: sidebar + topbar layout -->
    <MainLayout v-if="showLayout">
      <router-view />
    </MainLayout>

    <!-- Unauthenticated: auth pages without layout -->
    <router-view v-else />

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
/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>