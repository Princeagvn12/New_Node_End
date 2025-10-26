<script setup>
import { ref, onMounted, computed } from 'vue'
import hourService from '../services/hour.service'
import courseService from '../services/course.service'
import { useUserStore } from '../store/user.store'
import { useConfirmDialog } from '../composables/useConfirmDialog'
import { showSuccess, showError } from '../utils/toast'
import FormField from '../components/common/FormField.vue'
import Table from '../components/common/Table.vue'

const userStore = useUserStore()
const { confirm } = useConfirmDialog()

const entries = ref([])
const loading = ref(false)
const form = ref({
  course: '',
  date: new Date().toISOString().split('T')[0],
  hours: 1,
  description: ''
})

const canManageHours = computed(() => 
  ['admin', 'formateur_principal', 'formateur'].includes(userStore.user?.role)
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
    
    courses.value = coursesRes.data
    entries.value = hoursRes.data.map(entry => ({
      ...entry,
      courseTitle: courses.value.find(c => c._id === entry.course)?.title || 'Unknown Course',
      date: new Date(entry.date).toLocaleDateString()
    }))
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
    await hourService.create(form.value)
    showSuccess('Hours entry created successfully')
    resetForm()
    await load()
  } catch (e) {
    console.error(e)
    showError('Failed to create hours entry')
  }
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

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-semibold text-blue-500">Hours Management</h1>
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
          <button @click="resetForm" 
            class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 
                   dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 
                   rounded-lg transition-colors">
            Clear
          </button>
          <button @click="createHourEntry" 
            class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
            Save Hours
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
  </div>
</template>