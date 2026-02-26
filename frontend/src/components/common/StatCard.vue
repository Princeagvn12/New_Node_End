<script setup>
defineProps({
  icon: { type: String, default: 'pi pi-chart-bar' },
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  accentColor: { type: String, default: 'var(--color-primary)' },
  trend: { type: String, default: '' }
})
</script>

<template>
  <div class="stat-card glass-card" :style="{ '--accent': accentColor }">
    <div class="stat-card-inner">
      <div class="stat-icon-wrap">
        <i :class="icon"></i>
      </div>
      <div class="stat-info">
        <span class="stat-label">{{ label }}</span>
        <div class="stat-value">{{ value }}</div>
        <span v-if="trend" class="stat-trend">{{ trend }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  position: relative;
  overflow: hidden;
  padding: 1.25rem;
}
.stat-card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0; width: 4px;
  background: var(--accent);
}
.stat-card-inner {
  display: flex;
  align-items: center; /* Center icon with text block */
  gap: 1.25rem;
}
.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}
.stat-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.stat-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}
.stat-trend {
  font-size: 0.75rem;
  color: var(--color-success);
  font-weight: 500;
}
.stat-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  flex-shrink: 0;
}
</style>
