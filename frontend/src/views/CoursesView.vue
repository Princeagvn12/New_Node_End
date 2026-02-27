<script setup>
import { ref, onMounted, computed } from 'vue'
import courseService from '../services/course.service'
import departmentService from '../services/department.service'
import userService from '../services/user.service'
import { useUserStore } from '../store/user.store'
import { showSuccess, showError } from '../utils/toast'
import PageHeader from '../components/common/PageHeader.vue'
import FormField from '../components/common/FormField.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const userStore = useUserStore()
const courses = ref([])
const departments = ref([])
const teachers = ref([])
const loading = ref(false)
const showCreate = ref(false)
const editingCourse = ref(null)

// Search & Filters
const searchQuery = ref('')
const selectedDept = ref('all')
const selectedCredits = ref('all')

const form = ref({ name: '', code: '', description: '', department: '', teacher: '', credits: 1 })

const canManage = computed(() => ['admin', 'rh', 'formateur_principal'].includes(userStore.user?.role))

const stats = computed(() => [
  { label: 'Active Courses', value: courses.value.length, icon: 'pi pi-book', trend: '+2 from last semester', trendType: 'up' },
  { label: 'Student Enrollment', value: '1,240', icon: 'pi pi-users', trend: 'Stable growth', trendType: 'neutral' },
  { label: 'Pending Assignments', value: '4', icon: 'pi pi-id-card', trend: 'Action required', trendType: 'warning' }
])

const filteredCourses = computed(() => {
  return courses.value.filter(c => {
    const matchesSearch = !searchQuery.value || 
      c.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesDept = selectedDept.value === 'all' || (c.department?._id || c.department) === selectedDept.value
    const matchesCredits = selectedCredits.value === 'all' || String(c.credits) === selectedCredits.value
    return matchesSearch && matchesDept && matchesCredits
  })
})

const getInitials = (name) => {
  if (!name) return '??'
  const parts = name.split(' ')
  return parts.length >= 2 
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase()
}

const load = async () => {
  loading.value = true
  try {
    courses.value = await courseService.getAll()
    departments.value = await departmentService.getAll()
    teachers.value = await userService.getTeachers()
  } catch (e) {
    showError('Failed to load data')
  } finally {
    loading.value = false
  }
}

const saveCourse = async () => {
  if (!form.value.name || !form.value.code) {
    showError('Name and code are required')
    return
  }
  try {
    if (editingCourse.value) {
      await courseService.update(editingCourse.value._id, form.value)
      showSuccess('Course updated')
    } else {
      await courseService.create(form.value)
      showSuccess('Course created')
    }
    resetForm()
    await load()
  } catch (e) {
    showError('Failed to save course')
  }
}

const editCourse = (c) => {
  editingCourse.value = c
  form.value = { 
    name: c.name, 
    code: c.code, 
    description: c.description || '', 
    department: c.department?._id || c.department || '', 
    teacher: c.teacher?._id || c.teacher || '',
    credits: c.credits || 1
  }
  showCreate.value = true
}

const deleteCourse = async (c) => {
  if (!confirm(`Delete ${c.name}?`)) return
  try {
    await courseService.remove(c._id)
    showSuccess('Course deleted')
    await load()
  } catch (e) {
    showError('Failed to delete course')
  }
}

const resetForm = () => {
  form.value = { name: '', code: '', description: '', department: '', teacher: '', credits: 1 }
  showCreate.value = false
  editingCourse.value = null
}

onMounted(load)
</script>

<template>
  <div class="courses-view">
    <!-- Header -->
    <div class="header-section">
      <div class="header-info">
        <h1 class="page-title">Course Management</h1>
        <p class="page-subtitle">Manage and organize school curriculum</p>
      </div>
      <button v-if="canManage" @click="showCreate = true" class="btn-premium btn-primary">
        <i class="pi pi-plus"></i>
        Create New Course
      </button>
    </div>

    <!-- Filters Bar -->
    <div class="filters-bar glass-card">
      <div class="search-input">
        <i class="pi pi-search"></i>
        <input v-model="searchQuery" type="text" placeholder="Search by course name, code or teacher..." />
      </div>
      <div class="filters-group">
        <select v-model="selectedDept" class="filter-select">
          <option value="all">All Departments</option>
          <option v-for="d in departments" :key="d._id" :value="d._id">{{ d.name }}</option>
        </select>
        <select v-model="selectedCredits" class="filter-select">
          <option value="all">Credits</option>
          <option v-for="n in 10" :key="n" :value="String(n)">{{ n }} ECTS</option>
        </select>
        <button class="filter-btn-more"><i class="pi pi-filter"></i> More Filters</button>
      </div>
    </div>

    <!-- Courses Table -->
    <div class="table-container glass-card">
      <DataTable 
        :value="filteredCourses" 
        :loading="loading" 
        stripedRows 
        removableSort
        responsiveLayout="scroll"
        class="p-datatable-sm"
      >
        <Column header="Course Details" sortable sortField="name">
          <template #body="{ data }">
            <div class="course-cell">
              <div class="initials-square">{{ getInitials(data.name) }}</div>
              <div class="course-text">
                <span class="course-name">{{ data.name }}</span>
                <span class="course-code">{{ data.code }} - {{ data.description?.substring(0, 20) }}...</span>
              </div>
            </div>
          </template>
        </Column>

        <Column header="Department" sortable sortField="department.name">
          <template #body="{ data }">
            <span class="role-badge etudiant">{{ data.department?.name || 'Unassigned' }}</span>
          </template>
        </Column>

        <Column header="Assigned Teacher" sortable sortField="teacher.name">
          <template #body="{ data }">
            <div class="teacher-cell" v-if="data.teacher">
              <div class="avatar-initials tiny">{{ getInitials(data.teacher.name || '') }}</div>
              <span class="teacher-name">{{ data.teacher.name }}</span>
            </div>
            <span v-else class="unassigned-text">Unassigned</span>
          </template>
        </Column>

        <Column field="credits" header="Credits" sortable>
          <template #body="{ data }">
            <span class="credits-text">{{ data.credits }} ECTS</span>
          </template>
        </Column>

        <Column header="Status" sortable sortField="teacher">
          <template #body="{ data }">
            <span class="status-badge" :class="data.teacher ? 'active' : 'inactive'">
              {{ data.teacher ? 'Active' : 'Draft' }}
            </span>
          </template>
        </Column>

        <Column header="Actions" headerStyle="text-align: right" bodyStyle="text-align: right">
          <template #body="{ data }">
            <div v-if="canManage" class="actions-group">
              <button @click="editCourse(data)" class="action-btn edit" title="Edit"><i class="pi pi-pencil"></i></button>
              <button @click="deleteCourse(data)" class="action-btn delete" title="Delete"><i class="pi pi-trash"></i></button>
            </div>
          </template>
        </Column>

        <template #empty>
          <div class="p-4 text-center text-muted">
            <i class="pi pi-book block mb-2" style="font-size: 2rem"></i>
            No courses found
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Bottom Stats Grid -->
    <div class="stats-grid">
      <div v-for="stat in stats" :key="stat.label" class="premium-stat-card glass-card">
        <div class="stat-top">
          <span class="stat-label">{{ stat.label }}</span>
          <i :class="[stat.icon, 'stat-icon']"></i>
        </div>
        <div class="stat-body">
          <span class="stat-value">{{ stat.value }}</span>
          <div class="stat-footer" :class="stat.trendType">
            <i v-if="stat.trendType === 'up'" class="pi pi-arrow-up-right"></i>
            <i v-if="stat.trendType === 'warning'" class="pi pi-exclamation-circle"></i>
            <span>{{ stat.trend }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Form -->
    <transition name="fade">
      <div v-if="showCreate" class="modal-overlay" @click.self="resetForm">
        <div class="modal-card glass-card slide-up">
          <div class="modal-header">
            <h3>{{ editingCourse ? 'Edit Course' : 'Create New Course' }}</h3>
            <button @click="resetForm" class="close-btn"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <FormField v-model="form.name" label="Course Name" placeholder="e.g. Advanced JavaScript" required />
              <FormField v-model="form.code" label="Course Code" placeholder="e.g. CS101" required />
              <div class="form-field full">
                <label class="field-label">Description</label>
                <textarea v-model="form.description" class="field-textarea" placeholder="Enter course description..."></textarea>
              </div>
              <div class="form-field">
                <label class="field-label">Department</label>
                <select v-model="form.department" class="field-select">
                  <option value="">Select Department</option>
                  <option v-for="d in departments" :key="d._id" :value="d._id">{{ d.name }}</option>
                </select>
              </div>
              <div class="form-field">
                <label class="field-label">Teacher</label>
                <select v-model="form.teacher" class="field-select">
                  <option value="">Select Teacher</option>
                  <option v-for="t in teachers" :key="t._id" :value="t._id">{{ t.name }}</option>
                </select>
              </div>
              <FormField v-model.number="form.credits" label="ECTS Credits" type="number" min="1" max="60" required />
            </div>
          </div>
          <div class="modal-footer">
            <button @click="resetForm" class="btn-premium secondary-btn">Cancel</button>
            <button @click="saveCourse" class="btn-premium btn-primary">
              {{ editingCourse ? 'Save Changes' : 'Create Course' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.courses-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 3rem;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin-top: 0.25rem;
}

.filters-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.25rem;
  gap: 1.5rem;
}

.search-input {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  max-width: 450px;
}

.search-input i {
  color: var(--text-muted);
}

.search-input input {
  border: none;
  background: transparent;
  width: 100%;
  font-size: 0.95rem;
  color: var(--text-primary);
  outline: none;
}

.filters-group {
  display: flex;
  gap: 0.75rem;
}

.filter-select {
  background: var(--surface-bg);
  border: 1px solid var(--surface-border);
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.875rem;
  outline: none;
  cursor: pointer;
}

.filter-btn-more {
  background: var(--surface-bg);
  border: 1px solid var(--surface-border);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

/* Table Cells */
.course-cell {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.course-text {
  display: flex;
  flex-direction: column;
}

.course-name {
  font-weight: 700;
  color: var(--text-primary);
  font-size: 0.9375rem;
}

.course-code {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.teacher-cell {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.avatar-initials.tiny {
  width: 28px;
  height: 28px;
  font-size: 0.65rem;
}

.teacher-name {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.unassigned-text {
  font-style: italic;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.credits-text {
  font-weight: 600;
  color: var(--text-primary);
}

.actions-group {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

/* Bottom Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 1rem;
}

.premium-stat-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stat-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.stat-icon {
  color: var(--color-primary);
  font-size: 1.25rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
}

.stat-footer {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 0.25rem;
}

.stat-footer.up { color: var(--color-success); }
.stat-footer.warning { color: var(--color-warning); }
.stat-footer.neutral { color: var(--text-muted); }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-card {
  width: 100%;
  max-width: 650px;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn { background: transparent; border: none; font-size: 1.25rem; cursor: pointer; color: var(--text-muted); }

.modal-body { padding: 1.5rem; }

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.form-field.full { grid-column: span 2; }

.field-textarea {
  width: 100%;
  height: 80px;
  padding: 0.625rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--surface-border);
  background: var(--surface-bg);
  color: var(--text-primary);
  outline: none;
  resize: none;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--surface-border);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.secondary-btn { background: var(--surface-hover); color: var(--text-secondary); border: 1px solid var(--surface-border); }

@media (max-width: 1024px) {
  .stats-grid { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .filters-bar { flex-direction: column; align-items: stretch; }
  .form-grid { grid-template-columns: 1fr; }
  .form-field.full { grid-column: span 1; }
}
</style>