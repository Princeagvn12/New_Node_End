<script setup>
import { ref, onMounted, computed } from 'vue'
import departmentService from '../services/department.service'
import { useUserStore } from '../store/user.store'
import { showSuccess, showError } from '../utils/toast'
import FormField from '../components/common/FormField.vue'
import Table from '../components/common/Table.vue'

const userStore = useUserStore()
const departments = ref([])
const loading = ref(false)
const showCreate = ref(false)
const editingDept = ref(null)

const searchQuery = ref('')

const form = ref({ name: '', description: '' })

const canManage = computed(() => ['admin', 'rh'].includes(userStore.user?.role))

const columns = [
  { key: 'name', label: 'Department Name' },
  { key: 'description', label: 'Description' },
  { key: 'courses_count', label: 'Courses' }
]

const stats = computed(() => [
  { label: 'Total Departments', value: departments.value.length, icon: 'pi pi-building' },
  { label: 'Active Course Links', value: departments.value.reduce((acc, d) => acc + (d.courses?.length || 0), 0), icon: 'pi pi-link' }
])

const filteredDepts = computed(() => {
  return departments.value.filter(d => 
    !searchQuery.value || d.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const load = async () => {
  loading.value = true
  try {
    departments.value = await departmentService.getAll()
  } catch (e) {
    showError('Failed to load departments')
  } finally {
    loading.value = false
  }
}

const saveDept = async () => {
  if (!form.value.name) {
    showError('Name is required')
    return
  }
  try {
    if (editingDept.value) {
      await departmentService.update(editingDept.value._id, form.value)
      showSuccess('Department updated')
    } else {
      await departmentService.create(form.value)
      showSuccess('Department created')
    }
    resetForm()
    await load()
  } catch (e) {
    showError('Failed to save department')
  }
}

const editDept = (d) => {
  editingDept.value = d
  form.value = { name: d.name, description: d.description || '' }
  showCreate.value = true
}

const deleteDept = async (d) => {
  if (!confirm(`Delete ${d.name}?`)) return
  try {
    await departmentService.remove(d._id)
    showSuccess('Department deleted')
    await load()
  } catch (e) {
    showError('Failed to delete department')
  }
}

const resetForm = () => {
  form.value = { name: '', description: '' }
  showCreate.value = false
  editingDept.value = null
}

onMounted(load)
</script>

<template>
  <div class="departments-view">
    <!-- Header section -->
    <div class="header-section">
      <div class="header-info">
        <h1 class="page-title">Departments</h1>
        <p class="page-subtitle">Organize and manage school departments and their assigned courses.</p>
      </div>
      <div class="header-actions">
        <div class="mini-stats mr-4 hidden md:flex">
          <div v-for="s in stats" :key="s.label" class="mini-stat">
            <span class="label">{{ s.label }}</span>
            <span class="value">{{ s.value }}</span>
          </div>
        </div>
        <button v-if="canManage" @click="showCreate = true" class="btn-premium btn-primary">
          <i class="pi pi-plus"></i>
          Add Department
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar glass-card">
      <div class="search-input">
        <i class="pi pi-search"></i>
        <input v-model="searchQuery" type="text" placeholder="Search departments..." />
      </div>
    </div>

    <!-- Table -->
    <div class="table-container glass-card">
      <Table :columns="columns" :rows="filteredDepts" :loading="loading">
        <template #cell-name="{ value }">
          <span class="font-bold text-gray-800">{{ value }}</span>
        </template>
        <template #cell-description="{ value }">
          <span class="text-gray-500 text-sm italic">{{ value || 'No description' }}</span>
        </template>
        <template #cell-courses_count="{ row }">
          <span class="role-badge rh">{{ row.courses?.length || 0 }} Courses</span>
        </template>
        <template #actions="{ row }">
          <div v-if="canManage" class="actions-group">
            <button @click="editDept(row)" class="action-btn edit" title="Edit"><i class="pi pi-pencil"></i></button>
            <button @click="deleteDept(row)" class="action-btn delete" title="Delete"><i class="pi pi-trash"></i></button>
          </div>
        </template>
      </Table>
    </div>

    <!-- Modal -->
    <transition name="fade">
      <div v-if="showCreate" class="modal-overlay" @click.self="resetForm">
        <div class="modal-card glass-card slide-up tiny">
          <div class="modal-header">
            <h3>{{ editingDept ? 'Edit' : 'New' }} Department</h3>
            <button @click="resetForm" class="close-btn"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body space-y-4">
            <FormField v-model="form.name" label="Department Name" required />
            <div class="form-field">
              <label class="field-label">Description</label>
              <textarea v-model="form.description" class="field-textarea" placeholder="Enter details..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="resetForm" class="btn-premium secondary-btn">Cancel</button>
            <button @click="saveDept" class="btn-premium btn-primary">Save</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.departments-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.page-title { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); margin: 0; }
.page-subtitle { color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem; }

.header-actions { display: flex; align-items: center; }

.mini-stats { display: flex; gap: 1.5rem; border-right: 1px solid var(--surface-border); padding-right: 1.5rem; }

.mini-stat { display: flex; flex-direction: column; text-align: right; }
.mini-stat .label { font-size: 0.6rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
.mini-stat .value { font-size: 1.25rem; font-weight: 800; color: var(--text-primary); line-height: 1; }

.filters-bar { padding: 0.75rem 1.25rem; }

.search-input { display: flex; align-items: center; gap: 0.75rem; max-width: 300px; }
.search-input i { color: var(--text-muted); }
.search-input input { border: none; background: transparent; width: 100%; font-size: 0.9rem; color: var(--text-primary); outline: none; }

.actions-group { display: flex; gap: 0.5rem; justify-content: flex-end; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); backdrop-filter: blur(4px); z-index: 100; display: flex; align-items: center; justify-content: center; }
.modal-card.tiny { max-width: 450px; }
.modal-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--surface-border); display: flex; justify-content: space-between; align-items: center; }
.close-btn { background: transparent; border: none; cursor: pointer; color: var(--text-muted); font-size: 1.125rem; }
.modal-body { padding: 1.5rem; }
.modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--surface-border); display: flex; justify-content: flex-end; gap: 0.75rem; }

.field-textarea { width: 100%; height: 80px; padding: 0.625rem; border-radius: var(--radius-sm); border: 1px solid var(--surface-border); background: var(--surface-bg); outline: none; resize: none; font-size: 0.9rem; }

@media (max-width: 768px) {
  .header-section { flex-direction: column; align-items: flex-start; gap: 1rem; }
}
</style>
