<script setup>
import { ref, onMounted, computed } from 'vue'
import hourService from '../services/hour.service'
import { useUserStore } from '../store/user.store'
import { showSuccess, showError } from '../utils/toast'
import FormField from '../components/common/FormField.vue'
import Table from '../components/common/Table.vue'
import PageHeader from '../components/common/PageHeader.vue'

const userStore = useUserStore()
const hours = ref([])
const courses = ref([])
const students = ref([])
const loading = ref(false)

const form = ref({ courseId: '', studentId: '', date: new Date().toISOString().split('T')[0], hours: 1, description: '' })

// Filters
const filterCourse = ref('all')
const filterStudent = ref('all')

const columns = [
  { key: 'date', label: 'Date' },
  { key: 'student', label: 'Student' },
  { key: 'course', label: 'Course' },
  { key: 'hours_val', label: 'Hours' }
]

const stats = computed(() => [
  { label: 'Total Entries', value: hours.value.length, icon: 'pi pi-list' },
  { label: 'Sum of Hours', value: hours.value.reduce((acc, h) => acc + h.hours, 0).toFixed(1), icon: 'pi pi-clock' }
])

const filteredHours = computed(() => {
  return hours.value.filter(h => {
    const matchesCourse = filterCourse.value === 'all' || h.course?._id === filterCourse.value
    const matchesStudent = filterStudent.value === 'all' || h.student?._id === filterStudent.value
    return matchesCourse && matchesStudent
  })
})

const load = async () => {
  loading.value = true
  try {
    const [hData, cData, sData] = await Promise.all([
      hourService.getAll(),
      hourService.getStudentCourses(), // Admin version gets all for relevant depts
      hourService.getStudentHours()    // Need list of students
    ])
    // The service might need adjustment but assuming standard CRUD list
    hours.value = hData || []
    courses.value = cData || []
  } catch (e) {
    showError('Failed to load data')
  } finally {
    loading.value = false
  }
}

const submitHour = async () => {
  if (!form.value.courseId || !form.value.studentId || !form.value.hours) {
    showError('Required fields missing')
    return
  }
  try {
    await hourService.addHour(form.value)
    showSuccess('Hour entry added')
    form.value = { courseId: '', studentId: '', date: new Date().toISOString().split('T')[0], hours: 1, description: '' }
    await load()
  } catch (e) {
    showError('Failed to add entry')
  }
}

const deleteHour = async (h) => {
  if (!confirm('Delete this entry?')) return
  try {
    await hourService.remove(h._id)
    showSuccess('Entry deleted')
    await load()
  } catch (e) {
    showError('Failed to delete')
  }
}

onMounted(load)
</script>

<template>
  <div class="generic-hours-view">
    <!-- Header -->
    <div class="header-section">
      <div class="header-info">
        <h1 class="page-title">Attendance Tracking</h1>
        <p class="page-subtitle">Centralized view of all student hours and course participation.</p>
      </div>
      <div class="header-stats hidden md:flex">
        <div v-for="s in stats" :key="s.label" class="mini-stat-v2 glass-card">
          <i :class="[s.icon, 'text-blue-500 opacity-50']"></i>
          <div class="flex flex-col">
            <span class="text-[10px] uppercase font-bold text-gray-400 leading-none mb-1">{{ s.label }}</span>
            <span class="text-xl font-extrabold leading-none">{{ s.value }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="content-layout">
      <!-- Side Form -->
      <div class="form-container">
        <div class="glass-card p-6">
          <h3 class="text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
            <i class="pi pi-plus-circle text-blue-500"></i>
            Quick Log Entry
          </h3>
          <div class="space-y-4">
            <div class="form-field">
              <label>Course</label>
              <select v-model="form.courseId" class="field-select">
                <option value="">Select Course</option>
                <option v-for="c in courses" :key="c._id" :value="c._id">{{ c.name }}</option>
              </select>
            </div>
            <div class="form-field">
              <label>Student</label>
              <select v-model="form.studentId" class="field-select">
                <option value="">Select Student</option>
                <option v-for="s in students" :key="s._id" :value="s._id">{{ s.name }}</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="form-field">
                <label>Date</label>
                <input v-model="form.date" type="date" class="field-select" />
              </div>
              <div class="form-field">
                <label>Hours</label>
                <input v-model.number="form.hours" type="number" step="0.5" class="field-select" />
              </div>
            </div>
            <div class="form-field">
              <label>Description (Optional)</label>
              <textarea v-model="form.description" class="field-textarea" placeholder="Internal notes..."></textarea>
            </div>
            <button @click="submitHour" class="btn-premium btn-primary w-full">Save Registry</button>
          </div>
        </div>
      </div>

      <!-- Main Table Area -->
      <div class="table-area">
        <!-- Local Filters -->
        <div class="glass-card p-4 mb-4 flex gap-4">
          <select v-model="filterCourse" class="field-select-mini">
            <option value="all">All Courses</option>
            <option v-for="c in courses" :key="c._id" :value="c._id">{{ c.name }}</option>
          </select>
          <select v-model="filterStudent" class="field-select-mini">
            <option value="all">All Students</option>
            <option v-for="s in students" :key="s._id" :value="s._id">{{ s.name }}</option>
          </select>
        </div>

        <!-- Table -->
        <div class="glass-card overflow-hidden">
          <Table :columns="columns" :rows="filteredHours" :loading="loading">
            <template #cell-date="{ value }">{{ new Date(value).toLocaleDateString() }}</template>
            <template #cell-student="{ row }">
              <div class="flex items-center gap-2">
                <div class="avatar-initials tiny">{{ row.student?.name?.[0] || '?' }}</div>
                <span class="text-sm font-medium">{{ row.student?.name || 'Inconnu' }}</span>
              </div>
            </template>
            <template #cell-course="{ row }">
              <span class="text-xs font-bold text-gray-500 uppercase tracking-tighter">{{ row.course?.name || 'No Course' }}</span>
            </template>
            <template #cell-hours_val="{ value }">
              <span class="font-bold text-blue-600">{{ value }}h</span>
            </template>
            <template #actions="{ row }">
              <button @click="deleteHour(row)" class="action-btn delete" title="Remove Entry"><i class="pi pi-trash"></i></button>
            </template>
          </Table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.generic-hours-view { display: flex; flex-direction: column; gap: 1.5rem; padding-bottom: 2rem; }

.header-section { display: flex; justify-content: space-between; align-items: flex-end; }
.header-stats { display: flex; gap: 1rem; }

.mini-stat-v2 { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1.25rem; min-width: 150px; }

.page-title { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); margin: 0; }
.page-subtitle { color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem; }

.content-layout { display: flex; gap: 1.5rem; align-items: flex-start; }

.form-container { width: 320px; flex-shrink: 0; position: sticky; top: 100px; }
.table-area { flex: 1; }

.form-field { display: flex; flex-direction: column; gap: 0.375rem; }
.form-field label { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }

.field-select, .field-textarea, .field-select-mini { border: 1px solid var(--surface-border); background: var(--surface-bg); border-radius: var(--radius-sm); padding: 0.625rem; outline: none; font-size: 0.875rem; color: var(--text-primary); }
.field-select-mini { padding: 0.5rem; min-width: 150px; }
.field-textarea { height: 80px; resize: none; }

.avatar-initials.tiny { width: 24px; height: 24px; font-size: 0.65rem; }

@media (max-width: 1024px) {
  .content-layout { flex-direction: column; }
  .form-container { width: 100%; position: static; }
}
</style>