<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-semibold">Mes heures de cours</h2>
      <div class="text-lg">
        Total: <span class="font-semibold">{{ totalHours }}h</span>
      </div>
    </div>

    <!-- Filtres -->
    <div class="glass-card p-4 space-y-4">
      <div class="flex justify-between items-center">
        <h3 class="font-medium">Filtres</h3>
        <button
          @click="exportToPDF"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <span>📄</span> Exporter en PDF
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm mb-1">Cours</label>
          <select
            v-model="selectedCourseId"
            class="w-full px-3 py-2 rounded border dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">Tous les cours</option>
            <option
              v-for="course in courses"
              :key="course._id"
              :value="course._id"
            >
              {{ course.title }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm mb-1">Date début</label>
          <input
            type="date"
            v-model="dateRange.start"
            class="w-full px-3 py-2 rounded border dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <label class="block text-sm mb-1">Date fin</label>
          <input
            type="date"
            v-model="dateRange.end"
            class="w-full px-3 py-2 rounded border dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      </div>
    </div>

    <!-- Graphiques -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="glass-card p-4">
        <div style="height: 300px">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <div class="glass-card p-4">
        <div style="height: 300px">
          <Pie :data="pieChartData" :options="pieOptions" />
        </div>
      </div>
    </div>

    <!-- Résumé par cours -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="(stats, courseId) in hoursByCourse"
        :key="courseId"
        class="glass-card p-4"
      >
        <h3 class="font-semibold">{{ stats.courseTitle }}</h3>
        <div class="mt-2">
          <div class="text-2xl font-bold">{{ stats.totalHours }}h</div>
          <div class="text-sm text-gray-500">
            {{ stats.entries.length }} séance(s)
          </div>
          <div class="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              class="h-full bg-blue-500"
              :style="{ width: `${(stats.totalHours / totalHours) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tableau détaillé -->
    <!-- <div class="glass-card overflow-hidden">
      <Table :columns="columns" :data="filteredEntries" :loading="loading" class="w-full" />
    </div> -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../../store/user.store'
import hourService from '../../services/hour.service'
import courseService from '../../services/course.service'
import Table from '../common/Table.vue'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { Bar, Pie } from 'vue-chartjs'
import { jsPDF } from 'jspdf'
import { showSuccess, showError } from '../../utils/toast'

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const userStore = useUserStore()
const loading = ref(false)
const entries = ref([])
const courses = ref([])
const selectedCourseId = ref('')
const dateRange = ref({ start: '', end: '' })

const normalizeCourses = (raw) => {
  if (!Array.isArray(raw)) return []
  return raw.map(c => {
    if (!c) return null
    if (typeof c === 'string') return { _id: String(c), title: String(c) }
    const id = String(c._id || c.id || '')
    return {
      _id: id,
      title: c.title || c.name || c.code || 'Cours',
      description: c.description || '',
      teacher: c.teacher || null,
      students: Array.isArray(c.students) ? c.students.map(s => (s && (s._id || s)) || s).map(String) : []
    }
  }).filter(Boolean)
}

const normalizeEntries = (raw) => {
  if (!Array.isArray(raw)) return []
  return raw.map(e => {
    const copy = { ...e }
    // unwrap hour entry shapes (axios response / backend createResponse)
    // possible shapes: { _id, course: ObjectId|{_id,title}, hours, date, description, teacher }
    // or the whole axios response object => handled upstream
    // normalize course to object with _id,title
    if (copy.course && typeof copy.course === 'object') {
      copy.course = {
        _id: String(copy.course._id || copy.course.id || ''),
        title: copy.course.title || copy.course.name || ''
      }
    } else if (copy.course) {
      copy.course = { _id: String(copy.course), title: '' }
    } else {
      copy.course = { _id: '', title: '' }
    }
    copy._id = String(copy._id || copy.id || '')
    copy.hours = Number(copy.hours || 0)
    // ensure date is a proper ISO string / Date for filtering & display
    copy.date = copy.date ? new Date(copy.date).toISOString() : new Date().toISOString()
    return copy
  })
}

// small helper to unwrap axios/backend shapes
const unwrapPayload = (res) => {
  if (!res) return []
  if (Array.isArray(res)) return res
  if (res.data && typeof res.data === 'object') {
    // backend createResponse -> res.data.data.courses or res.data.data.hours
    if (res.data.data && Array.isArray(res.data.data.courses)) return res.data.data.courses
    if (res.data.data && Array.isArray(res.data.data.hours)) return res.data.data.hours
    // some services return res.data.courses / res.data.hours
    if (Array.isArray(res.data.courses)) return res.data.courses
    if (Array.isArray(res.data.hours)) return res.data.hours
    // interceptor already unwrapped -> res.data === array
    if (Array.isArray(res.data)) return res.data
  }
  // sometimes service returns { success:true, data: { hours: [...] } }
  if (res.success && res.data) {
    if (Array.isArray(res.data.courses)) return res.data.courses
    if (Array.isArray(res.data.hours)) return res.data.hours
  }
  return []
}

// Export PDF function
const exportToPDF = async () => {
  try {
    const doc = new jsPDF()

    // Add header
    doc.setFontSize(20)
    doc.text("Relevé d'heures de cours", 20, 20)
    doc.setFontSize(12)
    doc.text(`Étudiant: ${userStore.user?.name || 'N/A'}`, 20, 30)
    doc.text(`Date d'édition: ${new Date().toLocaleDateString()}`, 20, 40)

    // Add summary
    doc.text('Résumé par cours:', 20, 60)
    let y = 70
    Object.values(hoursByCourse.value).forEach(course => {
      doc.text(`${course.courseTitle}: ${course.totalHours}h (${course.entries.length} séances)`, 30, y)
      y += 10
    })

    // Add detailed entries
    y += 10
    doc.text('Détail des séances:', 20, y)
    y += 10
    filteredEntries.value.forEach(entry => {
      const course = courses.value.find(c => c._id === (entry.course._id || entry.course))
      const line = `${new Date(entry.date).toLocaleDateString()} - ${course?.title || 'N/A'} - ${entry.hours}h`
      doc.text(line, 30, y)
      y += 7
      if (y >= 280) {
        doc.addPage()
        y = 20
      }
    })

    // Save PDF
    doc.save(`heures-${userStore.user?.name || 'etudiant'}-${new Date().toISOString().split('T')[0]}.pdf`)
    showSuccess('PDF généré avec succès')
  } catch (e) {
    console.error('Failed to generate PDF:', e)
    showError('Erreur lors de la génération du PDF')
  }
}

// Computed values for statistics
const hoursByCourse = computed(() => {
  const stats = {}
  entries.value.forEach(entry => {
    const courseId = String(entry.course && (entry.course._id || entry.course) || '')
    if (!stats[courseId]) {
      const course = courses.value.find(c => String(c._id) === courseId)
      stats[courseId] = {
        courseTitle: course?.title || (entry.course && entry.course.title) || 'Unknown Course',
        totalHours: 0,
        entries: []
      }
    }
    stats[courseId].totalHours += Number(entry.hours || 0)
    stats[courseId].entries.push(entry)
  })
  return stats
})

// Chart data
const chartData = computed(() => {
  const labels = Object.values(hoursByCourse.value).map(c => c.courseTitle)
  const data = Object.values(hoursByCourse.value).map(c => c.totalHours)
  return {
    labels: labels || [],
    datasets: [{
      label: 'Heures par cours',
      data: data || [],
      backgroundColor: Array(labels.length).fill('rgba(75, 192, 192, 0.5)'),
      borderColor: Array(labels.length).fill('rgb(75, 192, 192)'),
      borderWidth: 1
    }]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Répartition des heures par cours (graphique en barres)'
    }
  }
}

// <-- Ajout : pieChartData (assure que Pie reçoit toujours un objet) -->
const pieChartData = computed(() => {
  const labels = Object.values(hoursByCourse.value).map(c => c.courseTitle)
  const data = Object.values(hoursByCourse.value).map(c => c.totalHours)
  return {
    labels: labels || [],
    datasets: [{
      label: 'Répartition heures',
      data: data || [],
      backgroundColor: [
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 99, 132, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)'
      ].slice(0, Math.max(1, labels.length)),
      borderColor: [
        'rgb(54, 162, 235)',
        'rgb(255, 99, 132)',
        'rgb(255, 206, 86)',
        'rgb(75, 192, 192)',
        'rgb(153, 102, 255)',
        'rgb(255, 159, 64)'
      ].slice(0, Math.max(1, labels.length)),
      borderWidth: 1
    }]
  }
})

const filteredEntries = computed(() => {
  let filtered = (entries.value || []).slice()

  if (dateRange.value.start) {
    const start = new Date(dateRange.value.start)
    filtered = filtered.filter(entry => new Date(entry.date) >= start)
  }
  if (dateRange.value.end) {
    const end = new Date(dateRange.value.end)
    filtered = filtered.filter(entry => new Date(entry.date) <= end)
  }
  if (selectedCourseId.value) {
    filtered = filtered.filter(entry => {
      const courseId = (entry.course && (entry.course._id || entry.course)) || ''
      return String(courseId) === String(selectedCourseId.value)
    })
  }

  return filtered
})

const totalHours = computed(() => {
  // sum totals from hoursByCourse (fallback to entries if empty)
  const byCourse = Object.values(hoursByCourse.value || {})
  if (byCourse.length) {
    return byCourse.reduce((s, c) => s + Number(c.totalHours || 0), 0)
  }
  return (entries.value || []).reduce((s, e) => s + Number(e.hours || 0), 0)
})

// Table columns configuration
const columns = [
  {
    key: 'courseTitle',
    label: 'Cours',
    formatter: (_, entry) => {
      const courseId = entry.course._id || entry.course
      const course = courses.value.find(c => c._id === courseId)
      return course?.title || 'Cours inconnu'
    }
  },
  {
    key: 'hours',
    label: 'Heures',
    formatter: (value) => `${value}h`
  },
  {
    key: 'date',
    label: 'Date',
    formatter: (value) => new Date(value).toLocaleDateString()
  },
  { key: 'description', label: 'Description' }
]

// Load data
const load = async () => {
  loading.value = true
  try {
    // Récupère heures et cours (service unwrap déjà tolérant)
    const [rawHoursRes, rawCoursesRes] = await Promise.all([
      hourService.getMy().catch(() => []),
      courseService.getAll().catch(() => [])
    ])

    const rawHours = unwrapPayload(rawHoursRes)
    const rawCourses = unwrapPayload(rawCoursesRes)

    // Normalise les cours reçus
    let normalizedCourses = normalizeCourses(rawCourses)

    // Fallback : si aucun cours retourné (ou liste incomplète), refetch full list
    if (!normalizedCourses.length) {
      const fallbackRes = await courseService.getAll().catch(() => [])
      normalizedCourses = normalizeCourses(unwrapPayload(fallbackRes))
    }

    // Normalise les entrées d'heures
    const allEntries = normalizeEntries(rawHours)

    // Récupère les ids de cours référencés par les entrées d'heures
    const courseIdsFromEntries = new Set(allEntries.map(e => String((e.course && (e.course._id || e.course)) || '')).filter(Boolean))

    // Pour chaque id manquant, tente de récupérer le cours via getById (pour assurer présence dans la liste)
    const missingIds = [...courseIdsFromEntries].filter(id => !normalizedCourses.some(c => String(c._id) === id))
    if (missingIds.length) {
      const fetched = await Promise.all(missingIds.map(id => courseService.getById(id).catch(() => null)))
      const fetchedNorm = normalizeCourses(fetched.filter(Boolean))
      normalizedCourses = normalizedCourses.concat(fetchedNorm)
    }

    // Si l'utilisateur est étudiant, filtre côté client (sécurité/fallback)
    if (userStore.user?.role === 'etudiant') {
      const uid = String(userStore.user?._id || userStore.user?.id || '')
      normalizedCourses = normalizedCourses.filter(c =>
        Array.isArray(c.students) && c.students.some(s => String(s) === uid)
      )
    }

    courses.value = normalizedCourses

    // Garde seulement les entrées liées aux cours qu'on expose à l'étudiant
    const validCourseIds = new Set(courses.value.map(c => String(c._id)))
    entries.value = allEntries.filter(e => {
      const cid = String((e.course && (e.course._id || e.course)) || '')
      return validCourseIds.has(cid)
    })

    // Assure que tous les cours affectés apparaissent dans le graphe même s'il n'y a pas d'heures (ajoute des entrées 0h)
    const existingCourseIds = new Set(entries.value.map(e => String((e.course && (e.course._id || e.course)) || '')))
    courses.value.forEach(c => {
      if (!existingCourseIds.has(String(c._id))) {
        entries.value.push({
          _id: `zero-${c._id}`,
          course: { _id: String(c._id), title: c.title },
          hours: 0,
          date: new Date().toISOString(),
          description: ''
        })
      }
    })
  } catch (e) {
    console.error('Failed to load student hours:', e)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.glass-card {
  background-color: rgba(255,255,255,0.6);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  border: 1px solid rgba(229,231,235,1);
  backdrop-filter: blur(6px);
}

.chart-container {
  position: relative;
  height: 300px;
}

.form-input,
.form-select {
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  background-color: white;
}

.bg-blue-500 { background-color: #3b82f6; }
.bg-blue-600 { background-color: #2563eb; }
.hover\:bg-blue-600:hover { background-color: #2563eb; }

</style>