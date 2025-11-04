<script setup>
import { ref, onMounted, computed } from 'vue'
import courseService from '../services/course.service.js'
import FormField from '../components/common/FormField.vue'
import Table from '../components/common/Table.vue'
import departmentService from '../services/department.service.js'
import userService from '../services/user.service.js'
import { useConfirmDialog } from '../composables/useConfirmDialog.js'
import { showSuccess, showError } from '../utils/toast.js'
import { useUserStore } from '../store/user.store.js'

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
    const [coursesRes, depsRes] = await Promise.all([
      courseService.getAll(),
      departmentService.getAll()
    ])

    let studentsList = []
    try {
      studentsList = await userService.getStudents()
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.warn('Student list not available for this role')
        studentsList = []
      } else {
        throw err
      }
    }

    let teachersList = []
    try {
      if (userStore.user?.role === 'formateur_principal') {
        teachersList = await userService.getTeachers()
      } else {
        const allUsers = await userService.getAll()
        teachersList = allUsers.filter(x => ['formateur', 'formateur_principal'].includes(x.role))
      }
    } catch {
      teachersList = []
    }

    departments.value = depsRes
    teachers.value = teachersList
    students.value = studentsList

    courses.value = coursesRes
      .filter(Boolean)
      .map(course => ({
        ...course,
        department: departments.value.find(d => d._id === (course.department && (course.department._id || course.department)))?.name || '-',
        teacher: teachers.value.find(t => t._id === (course.teacher && (course.teacher._id || course.teacher)))?.name || '-',
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
    showForm.value = false
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

let studentCoursesInterval = null
const startStudentCoursesPolling = () => {
  if (studentCoursesInterval) return
  studentCoursesInterval = setInterval(async () => {
    try {
      await load()
    } catch (e) {
      console.error('Polling courses error', e)
    }
  }, 5000)
}
const stopStudentCoursesPolling = () => { if (studentCoursesInterval) { clearInterval(studentCoursesInterval); studentCoursesInterval = null } }

import { watch, onBeforeUnmount } from 'vue'
watch(() => userStore.user?.role, (role) => {
  if (role === 'etudiant') startStudentCoursesPolling()
  else stopStudentCoursesPolling()
})
onBeforeUnmount(() => stopStudentCoursesPolling())
</script>

<template>
  <div class="space-y-8 p-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Course Management</h1>
      <button v-if="canManageCourses" 
        @click="showForm = !showForm" 
        class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300">
        {{ showForm ? 'Cancel' : 'Create Course' }}
      </button>
    </div>

    <!-- Course Form -->
    <div v-if="showForm" class="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl border border-blue-100 dark:border-blue-900 p-6 space-y-6">
      <h2 class="text-2xl font-semibold text-slate-900 dark:text-white">{{ editingId ? 'Edit Course' : 'Create New Course' }}</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField 
          v-model="form.title" 
          label="Course Title" 
          placeholder="Enter course title"
          required 
        />
        
        <FormField 
          v-model="form.code" 
          label="Course Code" 
          placeholder="Enter course code"
          required 
        />

        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Department <span class="text-red-500">*</span>
          </label>
          <select 
            v-model="form.department" 
            class="w-full px-4 py-2.5 rounded-xl border border-blue-100 dark:border-blue-900 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-700 dark:text-slate-300">
            <option value="">Select Department</option>
            <option v-for="dept in departments" :key="dept._id" :value="dept._id">
              {{ dept.name }}
            </option>
          </select>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Teacher <span class="text-red-500">*</span>
          </label>
          <select 
            v-model="form.teacher" 
            class="w-full px-4 py-2.5 rounded-xl border border-blue-100 dark:border-blue-900 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-700 dark:text-slate-300">
            <option value="">Select Teacher</option>
            <option v-for="teacher in teachers" :key="teacher._id" :value="teacher._id">
              {{ teacher.name }}
            </option>
          </select>
        </div>

        <div class="md:col-span-2">
          <FormField 
            v-model="form.description" 
            label="Description" 
            type="textarea"
            placeholder="Course description" 
          />
        </div>

        <div v-if="students.length" class="md:col-span-2 space-y-2">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Students</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <label v-for="student in students" :key="student._id" 
              class="flex items-center p-3 rounded-xl border border-blue-100 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors">
              <input 
                type="checkbox" 
                :value="student._id" 
                v-model="form.students"
                class="w-4 h-4 text-blue-600 rounded border-blue-300 focus:ring-blue-500"
              >
              <span class="ml-3 text-sm text-slate-700 dark:text-slate-300">{{ student.name }}</span>
            </label>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-4">
        <button 
          @click="resetForm" 
          class="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium transition-all">
          Clear
        </button>
        <button 
          @click="createOrUpdateCourse" 
          class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300">
          {{ editingId ? 'Update Course' : 'Create Course' }}
        </button>
      </div>
    </div>

    <!-- Courses Table -->
    <div class="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl border border-blue-100 dark:border-blue-900 overflow-hidden">
      <Table 
        :columns="columns" 
        :rows="courses" 
        :loading="loading">
        <template #cell="{ column, row }">
          <div v-if="column.key === 'title'" class="font-medium text-slate-900 dark:text-white">
            {{ row[column.key] }}
            <div class="text-sm text-slate-500 dark:text-slate-400">{{ row.code }}</div>
          </div>
          <div v-else-if="column.key === 'teacher'" class="text-blue-600 dark:text-blue-400">
            {{ row[column.key] }}
          </div>
          <div v-else-if="column.key === 'studentsCount'" class="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm inline-block">
            {{ row[column.key] }} students
          </div>
          <div v-else>
            {{ row[column.key] }}
          </div>
        </template>
        <template #actions="{ row }">
          <div v-if="canManageCourses" class="flex gap-3 justify-end">
            <button 
              @click="editCourse(row)" 
              class="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button 
              @click="deleteCourse(row)" 
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