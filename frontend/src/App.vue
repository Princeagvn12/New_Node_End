<script setup>
import Navbar from './components/common/Navbar.vue'
import ConfirmDialog from './components/common/ConfirmDialog.vue'
import { confirmState, handleConfirm, handleCancel } from './plugins/confirmPlugin'
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
    <Navbar />
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

/* Glassmorphic card style */
/* .glass-card {
  @apply bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-lg shadow-lg;
} */
</style>