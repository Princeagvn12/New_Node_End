<script setup>
const props = defineProps({
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})
</script>

<template>
  <div class="overflow-x-auto bg-white/60 dark:bg-slate-800/60 rounded-lg shadow-sm">
    <table class="min-w-full">
      <thead>
        <tr class="border-b border-gray-200 dark:border-gray-700">
          <th v-for="col in columns" :key="col.key" 
            class="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-300">
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading" class="animate-pulse">
          <td :colspan="columns.length" class="p-4 text-center text-gray-500">
            Loading...
          </td>
        </tr>
        <template v-else>
          <tr v-for="row in rows" :key="row._id" 
            class="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
            <td v-for="col in columns" :key="col.key + row._id" class="p-4 text-sm">
              <slot :name="'cell-' + col.key" :row="row" :value="row[col.key]">
                <template v-if="col.key === 'isActive'">
                  <span :class="row.isActive ? 'text-green-500' : 'text-red-500'">
                    {{ row.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </template>
                <template v-else>
                  {{ row[col.key] }}
                </template>
              </slot>
            </td>
            <td v-if="$slots.actions" class="p-4 text-sm">
              <slot name="actions" :row="row" />
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td :colspan="columns.length" class="p-4 text-center text-gray-500">
              No data available
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
table { border-collapse: collapse; width: 100%; }
thead th { background: transparent; }
</style>
<!-- placeholder: frontend/src/components/common/Table.vue -->