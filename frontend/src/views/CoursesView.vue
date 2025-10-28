<script setup>
import { ref, onMounted, computed } from 'vue'
import courseService from '../services/course.service'
import FormField from '../components/common/FormField.vue'
import Table from '../components/common/Table.vue'
// import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import departmentService from '../services/department.service'
import userService from '../services/user.service'
import { useConfirmDialog } from '../composables/useConfirmDialog'
import { showSuccess, showError } from '../utils/toast'
import { useUserStore } from '../store/user.store'

const userStore = useUserStore()
const { confirm } = useConfirmDialog()

const courses = ref([])
const showForm = ref(false)
const loading = ref(false)
const editingId = ref(null)
const students = ref([])

const form = ref({
  title: '',
  code: '',
  description: '',
  department: '',
  teacher: '',
  students: []
})

const resetForm = () => {
  form.value = {
    title: '',
    code: '',
    description: '',
    department: '',
    teacher: '',
    students: []
  }
  editingId.value = null
}

const canManageCourses = computed(() => 
  ['admin', 'formateur_principal'].includes(userStore.user?.role)
)

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'code', label: 'Code' },
  { key: 'department', label: 'Department' },
  { key: 'teacher', label: 'Teacher' },
  { key: 'studentsCount', label: 'Students' }
]

const departments = ref([])
const teachers = ref([])

const load = async () => {
  loading.value = true
  try {
    // Charger cours et départements
    const [coursesRes, depsRes] = await Promise.all([
      courseService.getAll(),
      departmentService.getAll()
    ])

    // Essayer de récupérer la liste des utilisateurs (peut renvoyer 403 pour formateurs)
    let allUsers = []
    try {
      allUsers = await userService.getAll()
    } catch (ue) {
      if (ue.response && ue.response.status === 403) {
        console.warn('User list not available for this role, falling back to minimal users list')
        allUsers = []
      } else {
        throw ue
      }
    }

    departments.value = depsRes 
    teachers.value = allUsers.filter(x => ['formateur', 'formateur_principal'].includes(x.role))
    students.value = allUsers.filter(x => x.role === 'etudiant')

    courses.value = coursesRes.map(course => ({
      ...course,
      department: departments.value.find(d => d._id === course.department._id)?.name || '-',
      teacher: teachers.value.find(t => t._id === course.teacher._id)?.name || '-',
      studentsCount: course.students?.length || 0
    }))
  } catch (e) {
    console.error(e)
    showError('Failed to load data')
  } finally {
    loading.value = false
  }
}

const validateForm = () => {
  if (!form.value.title?.trim()) {
    showError('Course title is required')
    return false
  }
  if (!form.value.code?.trim()) {
    showError('Course code is required')
    return false
  }
  if (!form.value.department) {
    showError('Department is required')
    return false
  }
  if (!form.value.teacher) {
    showError('Teacher is required')
    return false
  }
  return true
}

const createOrUpdateCourse = async () => {
  if (!validateForm()) return

  try {
    if (editingId.value) {
      await courseService.update(editingId.value, form.value)
      showSuccess('Course updated successfully')
    } else {
      await courseService.create(form.value)
      showSuccess('Course created successfully')
    }
    resetForm()
    await load()
  } catch (e) {
    console.error(e)
    showError(e?.response?.data?.message || 'Failed to save course')
  }
}

const editCourse = (course) => {
  editingId.value = course._id
  form.value = {
    title: course.title,
    code: course.code,
    description: course.description || '',
    department: course.department?._id || course.department,
    teacher: course.teacher?._id || course.teacher,
    students: course.students || []
  }
  showForm.value = true
}

const deleteCourse = async (course) => {
  try {
    const confirmed = await confirm({
      title: 'Delete Course',
      message: `Are you sure you want to delete "${course.title}"? This action cannot be undone.`,
      variant: 'danger'
    })
    
    if (confirmed) {
      await courseService.remove(course._id)
      showSuccess('Course deleted successfully')
      await load()
    }
  } catch (e) {
    console.error(e)
    showError('Failed to delete course')
  }
}

onMounted(async () => { await load() })
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-semibold text-blue-500">Course Management</h1>
      <button v-if="canManageCourses" 
        @click="showForm = !showForm" 
        class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
        {{ showForm ? 'Cancel' : 'Create Course' }}
      </button>
    </div>

    <!-- Course Form -->
    <div v-if="showForm" class="glass-card p-6 space-y-6">
      <h2 class="text-xl font-semibold">{{ editingId ? 'Edit Course' : 'Create New Course' }}</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField 
          v-model="form.title" 
          label="Course Title" 
          placeholder="Enter course title"
          required 
        />
        <FormField 
          v-model="form.code" 
          label="Course Code" 
          placeholder="e.g., CS101"
          required 
        />
        
        <div class="md:col-span-2">
          <FormField 
            v-model="form.description" 
            label="Description" 
            type="textarea"
            placeholder="Brief course description" 
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Department
            <span class="text-red-500">*</span>
          </label>
          <select 
            v-model="form.department"
            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm
                   focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500">
            <option value="">Select Department</option>
            <option v-for="dept in departments" 
              :key="dept._id" 
              :value="dept._id">
              {{ dept.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Teacher
            <span class="text-red-500">*</span>
          </label>
          <select 
            v-model="form.teacher"
            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm
                   focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500">
            <option value="">Select Teacher</option>
            <option v-for="teacher in teachers" 
              :key="teacher._id" 
              :value="teacher._id">
              {{ teacher.name }} ({{ teacher.role }})
            </option>
          </select>
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Students
          </label>
          <select 
            v-model="form.students"
            multiple
            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm
                   focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                   min-h-[120px]">
            <option v-for="student in students" 
              :key="student._id" 
              :value="student._id">
              {{ student.name }} — {{ student.email }}
            </option>
          </select>
          <p class="mt-1 text-sm text-gray-500">Hold Ctrl/Cmd to select multiple students</p>
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <button @click="resetForm" 
          class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 
                 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 
                 rounded-lg transition-colors">
          Clear Form
        </button>
        <button @click="createOrUpdateCourse" 
          class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
          {{ editingId ? 'Update Course' : 'Create Course' }}
        </button>
      </div>
    </div>

    <!-- Courses Table -->
    <div class="glass-card overflow-hidden">
      <Table 
        :columns="columns" 
        :rows="courses"
        :loading="loading">
        <template #actions="{ row }">
          <div class="flex gap-2 justify-end">
            <button v-if="canManageCourses"
              @click="editCourse(row)"
              class="p-1 text-blue-500 hover:text-blue-600">
              <span class="sr-only">Edit</span>
              📝
            </button>
            <button v-if="canManageCourses"
              @click="deleteCourse(row)"
              class="p-1 text-red-500 hover:text-red-600">
              <span class="sr-only">Delete</span>
              🗑️
            </button>
          </div>
        </template>
      </Table>
    </div>
  </div>
</template>
<!-- placeholder: frontend/src/views/CoursesView.vue -->