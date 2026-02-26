<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import hourService from '../../services/hour.service'
import { showSuccess, showError } from '../../utils/toast'
import { Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement
} from 'chart.js'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement)

const hours = ref([])
const courses = ref([])
const loading = ref(false)
const form = ref({ courseId: '', date: new Date().toISOString().split('T')[0], hours: 1, description: '' })

// Filters
const filterCourse = ref('all')
const startDate = ref('')
const endDate = ref('')

const loadData = async () => {
  loading.value = true
  try {
    const [hData, cData] = await Promise.all([
      hourService.getStudentHours(),
      hourService.getStudentCourses()
    ])
    hours.value = hData
    courses.value = cData
  } catch (e) {
    showError('Fails to load dashboard')
  } finally {
    loading.value = false
  }
}

const filteredHours = computed(() => {
  return hours.value.filter(h => {
    const matchesCourse = filterCourse.value === 'all' || h.course?._id === filterCourse.value
    const matchesStart = !startDate.value || new Date(h.date) >= new Date(startDate.value)
    const matchesEnd = !endDate.value || new Date(h.date) <= new Date(endDate.value)
    return matchesCourse && matchesStart && matchesEnd
  })
})

const totalHoursValue = computed(() => {
  return filteredHours.value.reduce((acc, curr) => acc + curr.hours, 0)
})

const courseStats = computed(() => {
  const stats = {}
  courses.value.forEach(c => {
    stats[c._id] = { name: c.name, hours: 0, color: c.color || '#3B82F6' }
  })
  hours.value.forEach(h => {
    if (stats[h.course?._id]) stats[h.course?._id].hours += h.hours
  })
  return Object.values(stats)
})

// Chart Data
const barData = computed(() => ({
  labels: courseStats.value.map(s => s.name),
  datasets: [{
    label: 'Heures par cours',
    data: courseStats.value.map(s => s.hours),
    backgroundColor: courseStats.value.map(s => s.color + 'CC'),
    borderColor: courseStats.value.map(s => s.color),
    borderWidth: 1,
    borderRadius: 6
  }]
}))

const donutData = computed(() => ({
  labels: courseStats.value.map(s => s.name),
  datasets: [{
    data: courseStats.value.map(s => s.hours),
    backgroundColor: courseStats.value.map(s => s.color + 'CC'),
    borderColor: 'white',
    borderWidth: 2
  }]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: { beginAtZero: true, grid: { display: true, color: '#E2E8F0' } },
    x: { grid: { display: false } }
  }
}

const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
  },
  cutout: '70%'
}

const submitHour = async () => {
  if (!form.value.courseId || !form.value.hours) {
    showError('Veuillez remplir les champs requis')
    return
  }
  try {
    await hourService.addHour(form.value)
    showSuccess('Heures enregistrées')
    form.value = { courseId: '', date: new Date().toISOString().split('T')[0], hours: 1, description: '' }
    await loadData()
  } catch (e) {
    showError('Erreur lors de l\'ajout')
  }
}

const exportPDF = () => {
  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text('Rapport d\'Heures de Cours', 14, 22)
  doc.setFontSize(11)
  doc.text(`Total: ${totalHoursValue.value}h`, 14, 30)

  const tableData = filteredHours.value.map(h => [
    new Date(h.date).toLocaleDateString(),
    h.course?.name || 'Inconnu',
    h.hours + 'h',
    h.description || '—'
  ])

  doc.autoTable({
    startY: 35,
    head: [['Date', 'Cours', 'Heures', 'Description']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] }
  })

  doc.save('mes-heures.pdf')
}

onMounted(loadData)
</script>

<template>
  <div class="student-hours">
    <div class="side-panel">
      <!-- Title Section -->
      <div class="mb-6">
        <h1 class="page-title">Hours Management</h1>
        <p class="page-subtitle">Record your daily learning activities.</p>
      </div>

      <!-- Log New Hours Form -->
      <div class="glass-card p-6 mb-6">
        <div class="flex items-center gap-2 mb-4">
          <i class="pi pi-plus-circle text-blue-500 font-bold"></i>
          <h2 class="text-lg font-bold">Log New Hours</h2>
        </div>
        <div class="space-y-4">
          <div class="form-field">
            <label>Course</label>
            <select v-model="form.courseId" class="field-select">
              <option value="">Select a course</option>
              <option v-for="c in courses" :key="c._id" :value="c._id">{{ c.name }}</option>
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
            <textarea v-model="form.description" class="field-textarea" placeholder="What did you work on?"></textarea>
          </div>
          <button @click="submitHour" class="btn-premium btn-primary w-full">Save Entry</button>
        </div>
      </div>

      <!-- Total Hours Mini Card -->
      <div class="glass-card p-6 flex flex-col gap-2 relative overflow-hidden stats-accent-blue">
        <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Logged Hours</span>
        <span class="text-4xl font-extrabold text-blue-600">{{ totalHoursValue }}h</span>
        <i class="pi pi-clock absolute right-6 top-1/2 -translate-y-1/2 text-4xl opacity-10"></i>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="main-panel">
      <!-- Top Actions -->
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-extrabold">Mes heures de cours</h2>
        <button @click="exportPDF" class="btn-premium export-btn">
          <i class="pi pi-file-pdf"></i>
          Exporter en PDF
        </button>
      </div>

      <!-- Filters Row -->
      <div class="glass-card p-6 mb-6 flex flex-wrap gap-6">
        <div class="flex-1 min-w-[200px]">
          <div class="flex items-center gap-2 mb-2">
            <i class="pi pi-filter text-xs text-gray-400"></i>
            <label class="text-xs font-bold text-gray-500 uppercase">Cours</label>
          </div>
          <select v-model="filterCourse" class="field-select text-sm p-2">
            <option value="all">Tous les cours</option>
            <option v-for="c in courses" :key="c._id" :value="c._id">{{ c.name }}</option>
          </select>
        </div>
        <div class="flex-1 min-w-[150px]">
          <label class="text-xs font-bold text-gray-500 uppercase block mb-2">Date Début</label>
          <input v-model="startDate" type="date" class="field-select text-sm p-2" />
        </div>
        <div class="flex-1 min-w-[150px]">
          <label class="text-xs font-bold text-gray-500 uppercase block mb-2">Date Fin</label>
          <input v-model="endDate" type="date" class="field-select text-sm p-2" />
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="glass-card p-6 h-[350px] flex flex-col">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xs font-bold text-gray-500 uppercase">Répartition des heures (Bâtons)</h3>
            <i class="pi pi-chart-bar text-gray-300"></i>
          </div>
          <div class="flex-1 relative">
            <Bar :data="barData" :options="chartOptions" />
          </div>
        </div>
        <div class="glass-card p-6 h-[350px] flex flex-col">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xs font-bold text-gray-500 uppercase">Aperçu Global (Cercle)</h3>
            <i class="pi pi-chart-pie text-gray-300"></i>
          </div>
          <div class="flex-1 relative">
            <Doughnut :data="donutData" :options="donutOptions" />
          </div>
        </div>
      </div>

      <!-- Course Progress Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="stat in courseStats" :key="stat.name" class="glass-card p-6 flex flex-col gap-3 relative overflow-hidden group">
          <div class="accent-top" :style="{ backgroundColor: stat.color }"></div>
          <div class="flex flex-col">
            <span class="text-sm font-bold text-gray-700">{{ stat.name }}</span>
            <span class="text-2xl font-extrabold" :style="{ color: stat.color }">{{ stat.hours }}h</span>
          </div>
          <div class="w-full bg-gray-100 rounded-full h-1.5 mt-2">
            <div class="h-full rounded-full transition-all duration-500" 
                 :style="{ width: Math.min((stat.hours/100)*100, 100) + '%', backgroundColor: stat.color }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.student-hours {
  display: flex;
  gap: 2rem;
  padding-bottom: 3rem;
  align-items: flex-start;
}

.side-panel {
  width: 320px;
  flex-shrink: 0;
  position: sticky;
  top: 100px;
}

.main-panel {
  flex: 1;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-select, .field-textarea {
  border: 1px solid var(--surface-border);
  background: var(--surface-bg);
  border-radius: var(--radius-sm);
  padding: 0.625rem;
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
  width: 100%;
}

.field-textarea {
  height: 100px;
  resize: none;
}

.stats-accent-blue::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0; width: 4px;
  background: var(--color-primary);
}

.export-btn {
  background: #EFF6FF;
  color: var(--color-primary);
  border: 1px solid #BFDBFE;
}

.accent-top {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 4px;
}

@media (max-width: 1280px) {
  .student-hours { flex-direction: column; }
  .side-panel { width: 100%; position: static; }
}

@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
}
</style>