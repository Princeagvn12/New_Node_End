<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '../store/user.store'
import departmentService from '../services/department.service'
import courseService from '../services/course.service'
import userService from '../services/user.service'
import FormField from '../components/common/FormField.vue'
import Table from '../components/common/Table.vue'
import { confirm } from '../plugins/confirmPlugin'
import { showSuccess, showError } from '../utils/toast'

const userStore = useUserStore()

const departments = ref([])
const teachers = ref([])
const loading = ref(false)
const showForm = ref(false)
const editingId = ref(null)

const form = ref({ name: '', description: '', mainTeacher: '' })

const canManageDepartments = computed(() => userStore.user?.role === 'admin')

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'mainTeacher', label: 'Main Teacher' },
  { key: 'courseCount', label: 'Courses' }
]

const resetForm = () => {
  form.value = { name: '', description: '', mainTeacher: '' }
  editingId.value = null
  showForm.value = false
}

const load = async () => {
  loading.value = true
  try {
    // Charger d'abord départements et cours (les deux routes sont publiques / auth-protected selon route)
    const [depsRes, coursesRes] = await Promise.all([
      departmentService.getAll(),
      courseService.getAll()
    ])

    // Essayer de récupérer la liste des utilisateurs (peut renvoyer 403 pour formateurs)
    let usersRes = []
    try {
      usersRes = await userService.getAll()
    } catch (ue) {
      // Si 403, on continue avec un fallback vide — le formateur ne peut pas lister tous les utilisateurs
      if (ue.response && ue.response.status === 403) {
        console.warn('User list not available for this role, falling back to limited view')
        usersRes = []
      } else {
        throw ue
      }
    }

    // services return the payload directly (unwrapped by api interceptor)
    teachers.value = (usersRes || []).filter(u => ['formateur', 'formateur_principal'].includes(u.role))

    const coursesByDept = (coursesRes || []).reduce((acc, course) => {
      const deptId = course.department && (course.department._id || course.department)
      acc[deptId] = (acc[deptId] || 0) + 1
      return acc
    }, {})

    departments.value = (depsRes || []).map(dept => ({
      ...dept,
      mainTeacher: teachers.value.find(t => t._id === (dept.mainTeacher && (dept.mainTeacher._id || dept.mainTeacher)))?.name || '-',
      courseCount: coursesByDept[dept._id] || 0
    }))
  } catch (e) {
    console.error(e)
    showError('Failed to load departments')
  } finally {
    loading.value = false
  }
}

const validateForm = () => { if (!form.value.name?.trim()) { showError('Department name is required'); return false } ; return true }

const createOrUpdateDepartment = async () => {
  if (!validateForm()) return
  try {
    if (editingId.value) {
      await departmentService.update(editingId.value, form.value)
      showSuccess('Department updated successfully')
    } else {
      await departmentService.create(form.value)
      showSuccess('Department created successfully')
    }
    resetForm()
    await load()
  } catch (e) {
    console.error(e)
    showError(e?.response?.data?.message || 'Failed to save department')
  }
}

const editDepartment = (department) => {
  editingId.value = department._id
  form.value = { name: department.name, description: department.description || '', mainTeacher: department.mainTeacher?._id || department.mainTeacher || '' }
  showForm.value = true
}

const deleteDepartment = async (department) => {
  if (!canManageDepartments.value) return
  try {
    const confirmed = await confirm({ title: 'Delete Department', message: `Are you sure you want to delete ${department.name}? This will also affect all associated courses and students.`, variant: 'danger' })
    if (!confirmed) return
    await departmentService.remove(department._id)
    showSuccess('Department deleted successfully')
    await load()
  } catch (e) {
    console.error(e)
    showError('Failed to delete department')
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-8 p-6">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Department Management</h1>
      <button v-if="canManageDepartments" 
        @click="showForm = !showForm" 
        class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300">
        {{ showForm ? 'Cancel' : 'Create Department' }}
      </button>
    </div>

    <div v-if="showForm" class="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl border border-blue-100 dark:border-blue-900 p-6 space-y-6">
      <h2 class="text-2xl font-semibold text-slate-900 dark:text-white">{{ editingId ? 'Edit Department' : 'Create New Department' }}</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField 
          v-model="form.name" 
          label="Department Name" 
          placeholder="Enter department name" 
          required 
        />
        <div>
          <label class="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Main Teacher</label>
          <select 
            v-model="form.mainTeacher" 
            class="w-full px-4 py-2.5 rounded-xl border border-blue-100 dark:border-blue-900 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-700 dark:text-slate-300">
            <option value="">Select Main Teacher</option>
            <option 
              v-for="teacher in teachers" 
              :key="teacher._id" 
              :value="teacher._id"
              >{{ teacher.name }} ({{ teacher.role }})</option>
          </select>
        </div>
        <div class="md:col-span-2">
          <FormField 
            v-model="form.description" 
            label="Description" 
            type="textarea" 
            placeholder="Department description" 
          />
        </div>
      </div>
      <div class="flex justify-end gap-4">
        <button 
          @click="resetForm" 
          class="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium transition-all">
          Clear
        </button>
        <button 
          @click="createOrUpdateDepartment" 
          class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300">
          {{ editingId ? 'Update Department' : 'Create Department' }}
        </button>
      </div>
    </div>

    <div class="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl border border-blue-100 dark:border-blue-900 overflow-hidden">
      <Table :columns="columns" :rows="departments" :loading="loading">
        <template #cell="{ column, row }">
          <div v-if="column.key === 'name'" class="font-medium text-slate-900 dark:text-white">
            {{ row[column.key] }}
          </div>
          <div v-else-if="column.key === 'mainTeacher'" class="text-blue-600 dark:text-blue-400">
            {{ row[column.key] }}
          </div>
          <div v-else-if="column.key === 'courseCount'" class="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm inline-block">
            {{ row[column.key] }} courses
          </div>
          <div v-else>
            {{ row[column.key] }}
          </div>
        </template>
        <template #actions="{ row }">
          <div v-if="canManageDepartments" class="flex gap-3 justify-end">
            <button 
              @click="editDepartment(row)" 
              class="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button 
              @click="deleteDepartment(row)" 
              class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </template>
      </Table>
    </div>
  </div>
</template>
