<script setup>
import { ref, onMounted, computed } from 'vue'
import departmentService from '../services/department.service'
import { useUserStore } from '../store/user.store'
import { showSuccess, showError } from '../utils/toast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'

const userStore = useUserStore()
const departments = ref([])
const loading = ref(false)
const showCreate = ref(false)
const editingDept = ref(null)

const searchQuery = ref('')
const form = ref({ name: '', description: '' })

const canManage = computed(() => ['admin', 'rh'].includes(userStore.user?.role))

const stats = computed(() => [
  { label: 'Total Departments', value: departments.value.length },
  { label: 'Courses Linked', value: departments.value.reduce((acc, d) => acc + (d.courses?.length || 0), 0) }
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
  <div class="px-8 py-6 min-h-screen bg-white dark:bg-[#0F172A] transition-colors duration-300">
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
      <div>
        <h1 class="text-3xl font-extrabold text-[#111827] dark:text-[#F8FAFC] tracking-tight mb-1">Department Management</h1>
        <p class="text-[#6B7280] dark:text-[#94A3B8] text-sm">Organize and manage your academic structure efficiently.</p>
      </div>
      <div class="flex items-center gap-6">
        <div v-for="stat in stats" :key="stat.label" class="flex flex-col items-end">
          <span class="text-[10px] uppercase font-bold text-[#6B7280] dark:text-[#94A3B8] tracking-widest">{{ stat.label }}</span>
          <span class="text-2xl font-black text-[#111827] dark:text-[#F8FAFC]">{{ stat.value }}</span>
        </div>
        <Button 
          v-if="canManage" 
          @click="showCreate = true" 
          label="Create Dept" 
          icon="pi pi-plus" 
          class="p-button-primary rounded-lg px-6 font-bold shadow-md hover:shadow-lg transform transition-all active:scale-95"
        />
      </div>
    </div>

    <!-- Search Row -->
    <div class="p-4 mb-6 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#1E293B] rounded-xl shadow-sm">
      <div class="relative w-full">
        <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280] dark:text-[#94A3B8]"></i>
        <InputText 
          v-model="searchQuery" 
          placeholder="Search by department name..." 
          class="w-full pl-11 !border-none !bg-transparent dark:text-[#F8FAFC] focus:ring-0" 
        />
      </div>
    </div>

    <!-- Departments Table -->
    <DataTable 
      :value="filteredDepts" 
      :loading="loading" 
      class="p-datatable-modern"
      responsiveLayout="scroll"
      removableSort
      stripedRows
    >
      <Column header="DEPARTMENT NAME" sortable field="name">
        <template #body="{ data }">
          <span class="font-bold text-[#111827] dark:text-[#F8FAFC] text-[15px]">{{ data.name }}</span>
        </template>
      </Column>

      <Column header="DESCRIPTION" field="description">
        <template #body="{ data }">
          <p class="text-sm text-[#6B7280] dark:text-[#94A3B8] line-clamp-1 max-w-xs">
            {{ data.description || 'No description provided' }}
          </p>
        </template>
      </Column>

      <Column header="COURSES LINKED" sortable sortField="courses.length">
        <template #body="{ data }">
          <span class="text-sm font-semibold text-[#3B82F6] dark:text-[#60A5FA]">
            {{ data.courses?.length || 0 }} Courses
          </span>
        </template>
      </Column>

      <Column header="ACTIONS" headerStyle="text-align: right" bodyStyle="text-align: right">
        <template #body="{ data }">
          <div v-if="canManage" class="flex items-center justify-end gap-4 mr-2">
            <button @click="editDept(data)" class="text-[#6B7280] dark:text-[#94A3B8] hover:text-[#3B82F6] transition-colors" title="Edit">
              <i class="pi pi-pencil"></i>
            </button>
            <button @click="deleteDept(data)" class="text-[#6B7280] dark:text-[#94A3B8] hover:text-[#EF4444] transition-colors" title="Delete">
              <i class="pi pi-trash"></i>
            </button>
          </div>
        </template>
      </Column>

      <template #footer>
        <div class="py-2 text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider">
          Total Departments: {{ filteredDepts.length }}
        </div>
      </template>

      <template #empty>
        <div class="py-12 border-2 border-dashed border-[#E5E7EB] dark:border-[#334155] rounded-xl flex flex-col items-center">
          <i class="pi pi-building text-4xl text-[#E5E7EB] dark:text-[#334155] mb-2"></i>
          <p class="text-[#6B7280] dark:text-[#94A3B8] font-medium">No departments found.</p>
        </div>
      </template>
    </DataTable>

    <!-- Create/Edit Dialog -->
    <Dialog 
      v-model:visible="showCreate" 
      :header="editingDept ? 'Edit Department' : 'New Department'" 
      modal 
      class="p-fluid max-w-md w-full"
    >
      <div class="flex flex-col gap-6 pt-2">
        <div class="flex flex-col gap-2">
          <label class="text-xs font-bold text-[#374151] dark:text-[#CBD5E1] uppercase tracking-wider">Dept name</label>
          <InputText v-model="form.name" placeholder="Informatique" class="!bg-[#F9FAFB] dark:!bg-[#334155] !border-none rounded-lg" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-xs font-bold text-[#374151] dark:text-[#CBD5E1] uppercase tracking-wider">Description</label>
          <Textarea v-model="form.description" rows="4" placeholder="Briefly describe the department..." class="!bg-[#F9FAFB] dark:!bg-[#334155] !border-none rounded-lg" />
        </div>
      </div>
      <template #footer>
        <div class="flex gap-3 justify-end mt-2">
          <Button label="Cancel" @click="resetForm" class="p-button-text p-button-secondary font-bold" />
          <Button label="Save Dept" @click="saveDept" class="p-button-primary rounded-lg px-8 font-bold shadow-md" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style>
/* Reusing shared table styles from main.css if possible, or local override */
.p-datatable-modern .p-datatable-thead > tr > th {
  background: transparent !important;
  color: #6B7280 !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.1em !important;
  border-bottom: 2px solid #F3F4F6 !important;
  padding: 1rem 0.5rem !important;
}

.dark .p-datatable-modern .p-datatable-thead > tr > th {
  color: #94A3B8 !important;
  border-bottom: 2px solid #334155 !important;
}

.p-datatable-modern .p-datatable-tbody > tr {
  background: transparent !important;
  border-bottom: 1px solid #F9FAFB !important;
}

.dark .p-datatable-modern .p-datatable-tbody > tr {
  border-bottom: 1px solid #334155 !important;
}

.p-datatable-modern .p-datatable-tbody > tr:hover {
  background: #F9FAFB !important;
}

.dark .p-datatable-modern .p-datatable-tbody > tr:hover {
  background: #334155 !important;
}

.p-datatable-modern .p-datatable-tbody > tr > td {
  border: none !important;
  padding: 1.25rem 0.5rem !important;
}
</style>
