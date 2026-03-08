<script setup>
defineProps({
  icon: { type: String, default: 'pi pi-inbox' },
  title: { type: String, default: 'No data yet' },
  message: { type: String, default: 'There are no items to display at this time.' }
})
</script>

<template>
  <div class="empty-state">
    <div class="empty-icon">
      <i :class="icon"></i>
    </div>
    <h3 class="empty-title">{{ title }}</h3>
    <p class="empty-message">{{ message }}</p>
    <slot />
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
}
.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--surface-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
}
.empty-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem;
}
.empty-message {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
  max-width: 300px;
}
</style>
