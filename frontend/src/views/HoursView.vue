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
  // remove 'admin' here: admins shouldn't create/edit hours
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
    console.log(hoursRes);
    console.log(coursesRes);
    
    
    courses.value = coursesRes
    entries.value = hoursRes.map(entry => {
      // entry.course may be populated object or just an id
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
      // update flow
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
  // Redirect admin away from this view
  if (isAdmin.value) {
    // Adjust route as needed — typically dashboard is '/dashboard'
    router.replace('/dashboard').catch(() => {})
    return
  }
  await load()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-semibold text-blue-500">Hours Management</h1>
    <!-- Vue spécifique pour les étudiants -->
    <StudentHoursView v-if="isStudent" />

    <!-- Vue standard pour les autres rôles -->
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Hours Entry Form -->
      <div v-if="canManageHours" class="glass-card p-6 space-y-4">
        <h2 class="text-xl font-semibold mb-4">Record Hours</h2>
        
        <div>
          <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Course <span class="text-red-500">*</span>
          </label>
          <select 
            v-model="form.course"
            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm
                   focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500">
            <option value="">Select Course</option>
            <option v-for="c in courses" 
              :key="c._id" 
              :value="c._id">
              {{ c.title }} ({{ c.code || 'No Code' }})
            </option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <FormField 
            v-model="form.date" 
            label="Date" 
            type="date"
            required 
          />
          <FormField 
            v-model.number="form.hours" 
            label="Hours" 
            type="number"
            min="0.5"
            step="0.5"
            required 
          />
        </div>

        <FormField 
          v-model="form.description" 
          label="Description" 
          type="textarea"
          placeholder="Optional details about the hours" 
        />

        <div class="flex justify-end gap-3">
          <button @click="cancelEdit" 
            class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 
                   dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 
                   rounded-lg transition-colors">
            {{ editingEntry ? 'Cancel' : 'Clear' }}
          </button>
          <button @click="createHourEntry" 
            class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
            {{ editingEntry ? 'Update' : 'Save Hours' }}
          </button>
        </div>
      </div>

      <!-- Hours Entries Table -->
      <div class="glass-card overflow-hidden">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold">My Hours Entries</h2>
        </div>
        
        <Table 
          :columns="columns" 
          :rows="entries"
          :loading="loading">
          <template #actions="{ row }">
            <div v-if="canManageHours" class="flex gap-2 justify-end">
              <button
                @click.prevent="editEntry(row)"
                class="p-1 text-blue-500 hover:text-blue-600"
                title="Edit">
                ✏️
              </button>
              <button
                @click="removeEntry(row._id)"
                class="p-1 text-red-500 hover:text-red-600">
                <span class="sr-only">Delete</span>
                🗑️
              </button>
            </div>
          </template>
        </Table>
      </div>
    </div>

    <!-- Wrap teacher-only UI with v-if -->
    <div v-if="isTeacher">
      <!-- zone de saisie / édition / suppression des heures (le formulaire et les actions) -->
      <!-- ...existing teacher hour form / action buttons ... -->
    </div>

    <!-- Always show student view / listing -->
    <!-- <div>
      <StudentHoursView />
    </div> -->
  </div>
</template>