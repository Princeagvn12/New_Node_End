<script setup>
import { ref, computed } from 'vue'
import EmptyState from './EmptyState.vue'

const props = defineProps({
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  searchable: { type: Boolean, default: true },
  emptyIcon: { type: String, default: 'pi pi-inbox' },
  emptyTitle: { type: String, default: 'No data yet' },
  emptyMessage: { type: String, default: 'There are no items to display.' }
})

const searchQuery = ref('')

const filteredRows = computed(() => {
  if (!searchQuery.value.trim()) return props.rows
  const q = searchQuery.value.toLowerCase()
  return props.rows.filter(row =>
    props.columns.some(col => {
      const val = row[col.key]
      if (val == null) return false
      return String(val).toLowerCase().includes(q)
    })
  )
})
</script>

<template>
  <div class="table-wrapper">
    <!-- Search bar -->
    <div v-if="searchable && rows.length > 0" class="table-toolbar">
      <div class="search-box">
        <i class="pi pi-search search-icon"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search..."
          class="search-input"
        />
      </div>
      <div class="table-toolbar-right">
        <slot name="toolbar" />
      </div>
    </div>

    <!-- Table -->
    <div class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.key">
              {{ col.label }}
            </th>
            <th v-if="$slots.actions" class="actions-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          <!-- Loading skeleton -->
          <tr v-if="loading">
            <td :colspan="columns.length + ($slots.actions ? 1 : 0)" class="loading-cell">
              <div class="loading-bar"></div>
              <div class="loading-bar short"></div>
              <div class="loading-bar"></div>
            </td>
          </tr>

          <!-- Data rows -->
          <template v-else-if="filteredRows.length">
            <tr v-for="row in filteredRows" :key="row._id" class="data-row">
              <td v-for="col in columns" :key="col.key + row._id">
                <slot :name="'cell-' + col.key" :row="row" :value="row[col.key]">
                  <template v-if="col.key === 'isActive'">
                    <span class="status-badge" :class="row.isActive ? 'active' : 'inactive'">
                      <span class="dot"></span>
                      {{ row.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </template>
                  <template v-else>
                    {{ row[col.key] }}
                  </template>
                </slot>
              </td>
              <td v-if="$slots.actions" class="actions-cell">
                <slot name="actions" :row="row" />
              </td>
            </tr>
          </template>

          <!-- Empty state -->
          <tr v-else>
            <td :colspan="columns.length + ($slots.actions ? 1 : 0)">
              <EmptyState
                :icon="emptyIcon"
                :title="emptyTitle"
                :message="emptyMessage"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.table-wrapper {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--surface-border);
  gap: 0.75rem;
}
.search-box {
  position: relative;
  max-width: 280px;
  width: 100%;
}
.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-size: 0.85rem;
}
.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
  background: var(--surface-bg);
  color: var(--text-primary);
  font-size: 0.8rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}
.search-input:focus {
  border-color: var(--color-primary);
}
.search-input::placeholder {
  color: var(--text-muted);
}
.table-toolbar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.table-scroll {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table thead th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--surface-bg);
  border-bottom: 1px solid var(--surface-border);
  white-space: nowrap;
}
.actions-header {
  text-align: right !important;
}
.data-row {
  transition: background 0.15s ease;
}
.data-row:hover {
  background: var(--surface-hover);
}
.data-row td {
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
  color: var(--text-primary);
  border-bottom: 1px solid var(--surface-border);
}
.actions-cell {
  text-align: right;
}
.loading-cell {
  padding: 1.5rem 1rem;
}
.loading-bar {
  height: 12px;
  background: var(--surface-hover);
  border-radius: 6px;
  margin-bottom: 0.75rem;
  animation: pulse 1.5s ease-in-out infinite;
}
.loading-bar.short {
  width: 60%;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>