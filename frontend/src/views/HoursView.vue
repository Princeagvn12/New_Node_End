<script setup>
import { ref, onMounted, computed } from 'vue'
import hourService from '../services/hour.service'
import { useUserStore } from '../store/user.store'
import { showSuccess, showError } from '../utils/toast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Chart from 'primevue/chart'

const userStore = useUserStore()
const hours = ref([])
const courses = ref([])
const students = ref([])
const loading = ref(false)

const form = ref({ courseId: '', studentId: '', date: new Date().toISOString().split('T')[0], hours: 1, description: '' })

// Filters
const filterCourse = ref('all')
const filterStudent = ref('all')

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
      hourService.getStudentCourses(),
      hourService.getStudentHours()
    ])
    hours.value = hData || []
    courses.value = cData || []
    students.value = sData || []
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

// Chart Logic for Design
const chartData = computed(() => {
  const courseMap = {}
  hours.value.forEach(h => {
    const name = h.course?.name || 'Unknown'
    courseMap[name] = (courseMap[name] || 0) + h.hours
  })
  
  const labels = Object.keys(courseMap)
  const data = Object.values(courseMap)
  
  return {
    bar: {
      labels,
      datasets: [{
        label: 'Hours per Course',
        data,
        backgroundColor: ['#38BDF8', '#F472B6', '#94A3B8'],
        borderRadius: 8
      }]
    },
    pie: {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#38BDF8', '#F472B6', '#FACC15'],
        hoverOffset: 4
      }]
    }
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true, display: true }, x: { display: true } }
}

onMounted(load)
</script>

<template>
  <div class="px-8 py-6 min-h-screen bg-white dark:bg-[#0F172A] transition-colors duration-300">
    <!-- Hero Banner -->
    <div class="mb-8 p-8 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-2xl shadow-sm relative overflow-hidden">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
        <div>
          <h1 class="text-3xl font-extrabold text-[#111827] dark:text-[#F8FAFC] tracking-tight mb-2">Mes heures de cours</h1>
          <p class="text-[#6B7280] dark:text-[#94A3B8] text-sm">Record and track your daily learning activities and participation.</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg">
            <span class="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-widest block mb-1">Total Logged Hours</span>
            <span class="text-4xl font-black text-[#111827] dark:text-[#F8FAFC]">{{ stats[1].value }}h</span>
          </div>
          <Button icon="pi pi-file-pdf" label="Exporter en PDF" class="p-button-outlined p-button-secondary rounded-lg font-bold" />
        </div>
      </div>
      <div class="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl"></div>
    </div>

    <!-- Filters Row -->
    <div class="flex flex-wrap gap-4 mb-8 items-center bg-[#F9FAFB] dark:bg-[#1E293B] p-4 rounded-xl border border-[#E5E7EB] dark:border-[#334155]">
      <span class="text-xs font-black text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-tighter mr-2">Filtres</span>
      <Select v-model="filterCourse" :options="[{name: 'Tous les cours', _id: 'all'}, ...courses]" optionLabel="name" optionValue="_id" class="!bg-white dark:!bg-[#0F172A] !border-[#E5E7EB] dark:!border-[#334155] rounded-lg w-48 text-sm" />
      <DatePicker v-model="filterStudent" placeholder="Date début" class="!bg-white dark:!bg-[#0F172A] !border-[#E5E7EB] dark:!border-[#334155] rounded-lg w-40 text-sm" />
      <DatePicker placeholder="Date fin" class="!bg-white dark:!bg-[#0F172A] !border-[#E5E7EB] dark:!border-[#334155] rounded-lg w-40 text-sm" />
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div class="p-6 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-xl shadow-sm">
        <h3 class="text-xs font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider mb-6">Répartition des heures (Bâtons)</h3>
        <div class="h-64">
          <Chart type="bar" :data="chartData.bar" :options="chartOptions" />
        </div>
      </div>
      <div class="p-6 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-xl shadow-sm">
        <h3 class="text-xs font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider mb-6">Aperçu global (Cercle)</h3>
        <div class="h-64 flex justify-center">
          <Chart type="doughnut" :data="chartData.pie" :options="{ ...chartOptions, scales: { x: { display: false }, y: { display: false } } }" class="w-full max-w-[200px]" />
        </div>
      </div>
    </div>

    <!-- Content Layout: Form & Table -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Left: Record Hours Form -->
      <div class="lg:col-span-4">
        <div class="p-6 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-xl shadow-sm sticky top-6">
          <div class="flex items-center gap-2 mb-6">
            <i class="pi pi-plus-circle text-blue-500"></i>
            <h2 class="text-lg font-bold text-[#111827] dark:text-[#F8FAFC]">Log New Hours</h2>
          </div>
          <div class="flex flex-col gap-5">
            <div class="flex flex-col gap-2">
              <label class="text-[10px] font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-widest">Course</label>
              <Select v-model="form.courseId" :options="courses" optionLabel="name" optionValue="_id" placeholder="Select a course" class="!bg-[#F9FAFB] dark:!bg-[#0F172A] !border-none rounded-lg" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-2">
                <label class="text-[10px] font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-widest">Date</label>
                <DatePicker v-model="form.date" showIcon class="!bg-[#F9FAFB] dark:!bg-[#0F172A] !border-none rounded-lg text-sm" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-[10px] font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-widest">Hours</label>
                <InputNumber v-model="form.hours" :min="0.5" :step="0.5" mode="decimal" class="!bg-[#F9FAFB] dark:!bg-[#0F172A] !border-none rounded-lg" />
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-[10px] font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-widest">Description (Optional)</label>
              <Textarea v-model="form.description" rows="3" placeholder="What did you work on?" class="!bg-[#F9FAFB] dark:!bg-[#0F172A] !border-none rounded-lg" />
            </div>
            <Button label="Save Entry" icon="pi pi-check" @click="submitHour" class="p-button-primary rounded-lg font-bold py-3 mt-2 shadow-lg hover:shadow-xl transform transition-all active:scale-95" />
          </div>
        </div>
      </div>

      <!-- Right: Entries Table -->
      <div class="lg:col-span-8">
        <div class="p-6 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-xl shadow-sm min-h-[500px]">
          <h2 class="text-xs font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider mb-6">Recent Entries</h2>
          <DataTable 
            :value="filteredHours" 
            :loading="loading" 
            class="p-datatable-modern"
            responsiveLayout="scroll"
            removableSort
            stripedRows
          >
            <Column header="COURSE" sortable sortField="course.name">
              <template #body="{ data }">
                <span class="text-sm font-bold text-[#111827] dark:text-[#F8FAFC]">{{ data.course?.name || 'No Course' }}</span>
              </template>
            </Column>

            <Column field="hours" header="HOURS" sortable>
              <template #body="{ data }">
                <span class="p-1 px-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg font-black text-sm">{{ data.hours }}h</span>
              </template>
            </Column>

            <Column header="DATE" sortable field="date">
              <template #body="{ data }">
                <span class="text-sm text-[#6B7280] dark:text-[#94A3B8]">{{ new Date(data.date).toLocaleDateString() }}</span>
              </template>
            </Column>

            <Column header="DESCRIPTION" field="description">
              <template #body="{ data }">
                <span class="text-xs text-[#6B7280] dark:text-[#94A3B8] italic line-clamp-1 max-w-[150px]">{{ data.description || '—' }}</span>
              </template>
            </Column>

            <Column header="ACTIONS" headerStyle="text-align: right" bodyStyle="text-align: right">
              <template #body="{ data }">
                <div class="flex items-center justify-end gap-4 mr-2">
                  <button @click="deleteHour(data)" class="text-[#6B7280] dark:text-[#94A3B8] hover:text-[#EF4444] transition-colors" title="Delete">
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </template>
            </Column>

            <template #empty>
              <div class="py-12 flex flex-col items-center">
                <i class="pi pi-clock text-4xl text-[#E5E7EB] dark:text-[#334155] mb-2"></i>
                <p class="text-[#6B7280] dark:text-[#94A3B8] font-medium">No hours logged yet.</p>
              </div>
            </template>
          </DataTable>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* PrimeVue Modern DataTable Overrides */
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