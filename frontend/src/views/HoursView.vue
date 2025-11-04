<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import hourService from '../services/hour.service'
import courseService from '../services/course.service'
import StudentHoursView from '../components/student/StudentHoursView.vue'
import { useUserStore } from '../store/user.store'
import { useConfirmDialog } from '../composables/useConfirmDialog'
import { showSuccess, showError } from '../utils/toast'
import FormField from '../components/common/FormField.vue'
import Table from '../components/common/Table.vue'

const router = useRouter()
const userStore = useUserStore()
const { confirm } = useConfirmDialog()

const isStudent = computed(() => userStore.user?.role === 'etudiant')
const isTeacher = computed(() => ['formateur', 'formateur_principal'].includes(userStore.user?.role))
const isAdmin = computed(() => userStore.user?.role === 'admin')

const entries = ref([])
const loading = ref(false)
const form = ref({
  course: '',
  date: new Date().toISOString().split('T')[0],
  hours: 1,
  description: ''
})

const editingEntry = ref(null)

const canManageHours = computed(() => 
  ['formateur_principal', 'formateur'].includes(userStore.user?.role)
)

const columns = [
  { key: 'courseTitle', label: 'Course' }, 
  { key: 'hours', label: 'Hours' }, 
  { key: 'date', label: 'Date' },
  { key: 'description', label: 'Description' }
]

const courses = ref([])

const load = async () => {
  loading.value = true
  try {
    const [hoursRes, coursesRes] = await Promise.all([
      hourService.getMy(),
      courseService.getAll()
    ])
    
    courses.value = coursesRes
    entries.value = hoursRes.map(entry => {
      const entryCourseId = String(entry.course && (entry.course._id || entry.course))
      const courseObj = courses.value.find(c => String(c._id) === entryCourseId)
      return {
        ...entry,
        courseTitle: courseObj ? courseObj.title : (entry.course && entry.course.title) || 'Unknown',
        date: new Date(entry.date).toLocaleDateString()
      }
    })
  } catch (e) {
    console.error(e)
    showError('Failed to load hours entries')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.value = {
    course: '',
    date: new Date().toISOString().split('T')[0],
    hours: 1,
    description: ''
  }
  editingEntry.value = null
}

const validateForm = () => {
  if (!form.value.course) {
    showError('Please select a course')
    return false
  }
  if (!form.value.date) {
    showError('Date is required')
    return false
  }
  if (!form.value.hours || form.value.hours <= 0) {
    showError('Please enter valid hours')
    return false
  }
  return true
}

const createHourEntry = async () => {
  if (!validateForm()) return

  try {
    if (editingEntry.value) {
      await hourService.update(editingEntry.value._id, form.value)
      showSuccess('Hours entry updated successfully')
      editingEntry.value = null
    } else {
      await hourService.create(form.value)
      showSuccess('Hours entry created successfully')
    }

    resetForm()
    await load()
  } catch (e) {
    console.error(e)
    showError('Failed to save hours entry')
  }
}

const editEntry = (row) => {
  editingEntry.value = row
  form.value = {
    course: String(row.course && (row.course._id || row.course)),
    date: new Date(row.date).toISOString().split('T')[0],
    hours: row.hours,
    description: row.description || ''
  }
}

const cancelEdit = () => {
  editingEntry.value = null
  resetForm()
}

const removeEntry = async (id) => {
  try {
    const confirmed = await confirm({
      title: 'Delete Hours Entry',
      message: 'Are you sure you want to delete this hours entry? This action cannot be undone.',
      variant: 'danger'
    })

    if (!confirmed) return

    await hourService.remove(id)
    showSuccess('Entry deleted successfully')
    await load()
  } catch (e) {
    console.error(e)
    showError('Failed to delete entry')
  }
}

onMounted(async () => {
  if (isAdmin.value) {
    router.replace('/dashboard').catch(() => {})
    return
  }
  await load()
})
</script>

<template>
  <div class="space-y-8 p-6">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Hours Management</h1>
    </div>

    <!-- Vue spécifique pour les étudiants -->
    <StudentHoursView v-if="isStudent" />

    <!-- Vue standard pour les autres rôles -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Hours Entry Form -->
      <div v-if="canManageHours" class="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl border border-blue-100 dark:border-blue-900 p-6 space-y-6">
        <h2 class="text-2xl font-semibold text-slate-900 dark:text-white">Record Hours</h2>
        
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Course <span class="text-red-500">*</span>
          </label>
          <select 
            v-model="form.course"
            class="w-full px-4 py-2.5 rounded-xl border border-blue-100 dark:border-blue-900 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-700 dark:text-slate-300">
            <option value="">Select Course</option>
            <option v-for="course in courses" :key="course._id" :value="course._id">
              {{ course.title }}
            </option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-6">
          <FormField 
            v-model="form.date"
            label="Date"
            type="date"
            class="rounded-xl"
            required 
          />
          <FormField 
            v-model="form.hours"
            label="Hours"
            type="number"
            min="0"
            step="0.5"
            class="rounded-xl"
            required 
          />
        </div>

        <FormField 
          v-model="form.description" 
          label="Description" 
          type="textarea"
          class="rounded-xl"
          placeholder="Optional details about the hours" 
        />

        <div class="flex justify-end gap-4">
          <button 
            @click="cancelEdit" 
            class="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium transition-all">
            Cancel
          </button>
          <button 
            @click="createHourEntry" 
            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300">
            {{ editingEntry ? 'Update Entry' : 'Save Entry' }}
          </button>
        </div>
      </div>

      <!-- Hours Entries Table -->
      <div class="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl border border-blue-100 dark:border-blue-900 overflow-hidden">
        <div class="p-6 border-b border-blue-100 dark:border-blue-900">
          <h2 class="text-2xl font-semibold text-slate-900 dark:text-white">My Hours Entries</h2>
        </div>
        
        <Table 
          :columns="columns" 
          :rows="entries"
          :loading="loading">
          <template #cell="{ column, row }">
            <div v-if="column.key === 'courseTitle'" class="font-medium text-slate-900 dark:text-white">
              {{ row[column.key] }}
            </div>
            <div v-else-if="column.key === 'hours'" class="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm inline-block">
              {{ row[column.key] }}h
            </div>
            <div v-else-if="column.key === 'date'" class="text-slate-600 dark:text-slate-400">
              {{ row[column.key] }}
            </div>
            <div v-else>
              {{ row[column.key] }}
            </div>
          </template>
          <template #actions="{ row }">
            <div v-if="canManageHours && !isStudent" class="flex gap-3 justify-end">
              <button 
                @click="editEntry(row)" 
                class="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              <button 
                @click="removeEntry(row._id)" 
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
  </div>
</template>