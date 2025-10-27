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
    const [depsRes, usersRes, coursesRes] = await Promise.all([
      departmentService.getAll(),
      userService.getAll(),
      courseService.getAll()
    ])

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
    const confirmed = await confirm({ title: 'Delete Department', message: `Are you sure you want to delete \"${department.name}\"? This will also affect all associated courses and students.`, variant: 'danger' })
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
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-semibold text-blue-500">Department Management</h1>
      <button v-if="canManageDepartments" @click="showForm = !showForm" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">{{ showForm ? 'Cancel' : 'Create Department' }}</button>
    </div>

    <div v-if="showForm" class="glass-card p-6 space-y-6">
      <h2 class="text-xl font-semibold">{{ editingId ? 'Edit Department' : 'Create New Department' }}</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField v-model="form.name" label="Department Name" placeholder="Enter department name" required />
        <div>
          <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Main Teacher</label>
          <select v-model="form.mainTeacher" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500">
            <option value="">Select Main Teacher</option>
            <option v-for="teacher in teachers" :key="teacher._id" :value="teacher._id">{{ teacher.name }} ({{ teacher.role }})</option>
          </select>
        </div>
        <div class="md:col-span-2"><FormField v-model="form.description" label="Description" type="textarea" placeholder="Department description" /></div>
      </div>
      <div class="flex justify-end gap-3">
        <button @click="resetForm" class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors">Clear</button>
        <button @click="createOrUpdateDepartment" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">{{ editingId ? 'Update Department' : 'Create Department' }}</button>
      </div>
    </div>

    <div class="glass-card overflow-hidden">
      <Table :columns="columns" :rows="departments" :loading="loading">
        <template #actions="{ row }">
          <div v-if="canManageDepartments" class="flex gap-2 justify-end">
            <button @click="editDepartment(row)" class="p-1 text-blue-500 hover:text-blue-600">📝</button>
            <button @click="deleteDepartment(row)" class="p-1 text-red-500 hover:text-red-600">🗑️</button>
          </div>
        </template>
      </Table>
    </div>
  </div>
</template>
