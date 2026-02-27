<script setup>
import { ref, onMounted, computed } from 'vue'
import userService from '../services/user.service'
import departmentService from '../services/department.service'
import courseService from '../services/course.service'
import { useUserStore } from '../store/user.store'
import { showSuccess, showError } from '../utils/toast'
import PageHeader from '../components/common/PageHeader.vue'
import StatCard from '../components/common/StatCard.vue'
import FormField from '../components/common/FormField.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const userStore = useUserStore()
const users = ref([])
const loading = ref(false)
const showCreate = ref(false)
const editingUser = ref(null)
const departments = ref([])
const allCourses = ref([])

const searchQuery = ref('')
const selectedRole = ref('all')

const form = ref({ name: '', email: '', password: '', role: 'etudiant', department: '' })

// Dialog states
const confirmDialog = ref({ show: false, message: '', action: null })
const assignDialog = ref({ show: false, student: null, choices: [], selected: '' })

const canManageUsers = computed(() => ['admin', 'rh'].includes(userStore.user?.role))
const isTeacherView = computed(() => ['formateur', 'formateur_principal'].includes(userStore.user?.role))

const stats = computed(() => {
  return [
    { label: 'Total Users', value: users.value.length, icon: 'pi pi-users', color: '#3B82F6' },
    { label: 'Active Now', value: users.value.filter(u => u.isActive).length, icon: 'pi pi-bolt', color: '#10B981' }
  ]
})

const filteredUsers = computed(() => {
  return users.value.filter(u => {
    const matchesSearch = !searchQuery.value || 
      u.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesRole = selectedRole.value === 'all' || u.role === selectedRole.value
    return matchesSearch && matchesRole
  })
})

const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.split(' ')
  return parts.length >= 2 
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase()
}

const idOf = (v) => (v && (v._id || v.id || v))

const load = async () => {
  loading.value = true
  try {
    if (isTeacherView.value) {
      users.value = await userService.getStudents()
      allCourses.value = await courseService.getAll() || []
    } else {
      users.value = await userService.getAll()
    }
  } catch (e) {
    showError('Failed to load users')
  } finally {
    loading.value = false
  }
}

const loadDepartments = async () => {
  try {
    departments.value = await departmentService.getAll() || []
  } catch (e) {}
}

const saveUser = async () => {
  if (!form.value.name || !form.value.email) {
    showError('Name and email are required')
    return
  }
  try {
    if (editingUser.value) {
      const payload = { ...form.value }
      if (!payload.password) delete payload.password
      await userService.update(editingUser.value._id, payload)
      showSuccess('User updated')
    } else {
      if (!form.value.password) { showError('Password is required'); return }
      await userService.create(form.value)
      showSuccess('User created')
    }
    resetForm()
    await load()
  } catch (e) {
    showError(e?.response?.data?.message || 'Failed to save user')
  }
}

const resetForm = () => {
  form.value = { name: '', email: '', password: '', role: 'etudiant', department: '' }
  showCreate.value = false
  editingUser.value = null
}

const editUser = (u) => {
  editingUser.value = u
  form.value = { 
    name: u.name, 
    email: u.email, 
    password: '', 
    role: u.role, 
    department: u.department?._id || u.department || '' 
  }
  showCreate.value = true
}

const deleteUser = (u) => {
  if (u._id === userStore.user?._id) { showError("You cannot delete yourself"); return }
  confirmDialog.value = {
    show: true,
    message: `Are you sure you want to delete ${u.name}?`,
    action: async () => {
      try {
        await userService.remove(u._id)
        showSuccess('User deleted')
        await load()
      } catch (e) { showError('Failed to delete user') }
    }
  }
}

const toggleActivate = (u) => {
  confirmDialog.value = {
    show: true,
    message: `Are you sure you want to ${u.isActive ? 'deactivate' : 'activate'} ${u.name}?`,
    action: async () => {
      try {
        await userService.activate(u._id, !u.isActive)
        showSuccess(u.isActive ? 'User deactivated' : 'User activated')
        await load()
      } catch (e) { showError('Operation failed') }
    }
  }
}

const openAssignDialog = (row) => {
  const manageable = allCourses.value.filter(c => {
    if (userStore.user?.role === 'formateur') {
      return String(idOf(c.teacher)) === String(idOf(userStore.user?._id))
    } else if (userStore.user?.role === 'formateur_principal') {
      return String(idOf(c.department)) === String(idOf(userStore.user?.department))
    }
    return false
  })
  const choices = manageable.filter(c => !(Array.isArray(c.students) && c.students.some(s => String(idOf(s)) === String(idOf(row._id)))))
  if (choices.length === 0) {
    showError('Aucun cours disponible')
    return
  }
  assignDialog.value = { show: true, student: row, choices, selected: String(idOf(choices[0]._id)) }
}

const confirmAssign = async () => {
  const dlg = assignDialog.value
  try {
    await userService.teacherUpdateStudentCourse(dlg.student._id, { action: 'add', courseId: dlg.selected })
    showSuccess("Étudiant affecté")
    assignDialog.value.show = false
    await load()
  } catch (e) { showError('Failed to assign') }
}

onMounted(() => {
  load()
  loadDepartments()
})
</script>

<template>
  <div class="users-view">
    <!-- Header & Stats Row -->
    <div class="top-section">
      <div class="header-wrap">
        <h1 class="page-title">Users Management</h1>
        <p class="page-subtitle">Manage platform access, roles, and departmental assignments.</p>
      </div>
      <div class="stats-row">
        <div v-for="stat in stats" :key="stat.label" class="mini-stat-card glass-card">
          <div class="stat-info">
            <span class="stat-label">{{ stat.label.toUpperCase() }}</span>
            <span class="stat-value">{{ stat.value.toLocaleString() }}</span>
          </div>
        </div>
        <button v-if="canManageUsers" @click="showCreate = true" class="btn-premium btn-primary">
          <i class="pi pi-plus"></i>
          Create User
        </button>
      </div>
    </div>

    <!-- Search & Filters -->
    <div class="filters-card glass-card">
      <div class="search-box">
        <i class="pi pi-search"></i>
        <input v-model="searchQuery" type="text" placeholder="Search by name, email or role..." />
      </div>
      <div class="filter-actions">
        <select v-model="selectedRole" class="role-select-filter">
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="rh">RH</option>
          <option value="formateur_principal">Formateur Principal</option>
          <option value="formateur">Formateur</option>
          <option value="etudiant">Etudiant</option>
        </select>
      </div>
    </div>

    <!-- Users Table -->
    <div class="table-wrap glass-card">
      <DataTable 
        :value="filteredUsers" 
        :loading="loading" 
        stripedRows 
        removableSort
        responsiveLayout="scroll"
        class="p-datatable-sm"
      >
        <Column header="User" sortable sortField="name">
          <template #body="{ data }">
            <div class="user-info-cell">
              <div class="avatar-initials">{{ getInitials(data.name) }}</div>
              <div class="user-text">
                <span class="user-name">{{ data.name }}</span>
                <span class="user-email">{{ data.email }}</span>
              </div>
            </div>
          </template>
        </Column>

        <Column field="role" header="Role" sortable>
          <template #body="{ data }">
            <span class="role-badge" :class="data.role">{{ data.role.replace('_', ' ') }}</span>
          </template>
        </Column>

        <Column header="Department" sortable sortField="department.name">
          <template #body="{ data }">
            <span class="dept-text">{{ data.department?.name || '—' }}</span>
          </template>
        </Column>

        <Column field="isActive" header="Status" sortable>
          <template #body="{ data }">
            <span class="status-badge" :class="data.isActive ? 'active' : 'inactive'">
              {{ data.isActive ? 'Active' : 'Inactive' }}
            </span>
          </template>
        </Column>

        <Column header="Actions" headerStyle="text-align: right" bodyStyle="text-align: right">
          <template #body="{ data }">
            <div class="actions-group">
              <button v-if="canManageUsers || isTeacherView" @click="editUser(data)" class="action-btn edit" title="Edit">
                <i class="pi pi-pencil"></i>
              </button>
              <button v-if="canManageUsers || isTeacherView" @click="toggleActivate(data)" class="action-btn" title="Toggle Active">
                <i :class="data.isActive ? 'pi pi-ban' : 'pi pi-check-circle'"></i>
              </button>
              <button v-if="isTeacherView" @click="openAssignDialog(data)" class="action-btn" title="Assign Course">
                <i class="pi pi-link"></i>
              </button>
              <button v-if="canManageUsers" @click="deleteUser(data)" class="action-btn delete" title="Delete">
                <i class="pi pi-trash"></i>
              </button>
            </div>
          </template>
        </Column>

        <template #empty>
          <div class="p-4 text-center text-muted">
            <i class="pi pi-users block mb-2" style="font-size: 2rem"></i>
            No users found
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Create/Edit Dialog -->
    <transition name="fade">
      <div v-if="showCreate" class="modal-overlay" @click.self="resetForm">
        <div class="modal-card glass-card slide-up">
          <div class="modal-header">
            <h3>{{ editingUser ? 'Edit User' : 'Create New User' }}</h3>
            <button @click="resetForm" class="close-btn"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <FormField v-model="form.name" label="Full Name" placeholder="e.g. John Doe" required />
              <FormField v-model="form.email" label="Email Address" type="email" placeholder="john@example.com" required />
              <FormField v-model="form.password" label="Password" type="password" :placeholder="editingUser ? '(leave blank to keep current)' : 'Enter password'" :required="!editingUser" />
              <div class="form-field">
                <label class="field-label">Role</label>
                <select v-model="form.role" class="field-select">
                  <option value="etudiant">Student</option>
                  <option value="formateur">Teacher</option>
                  <option value="formateur_principal">Principal Teacher</option>
                  <option value="rh">RH</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div class="form-field">
                <label class="field-label">Department</label>
                <select v-model="form.department" class="field-select">
                  <option value="">No Department</option>
                  <option v-for="d in departments" :key="d._id" :value="d._id">{{ d.name }}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="resetForm" class="btn-premium secondary-btn">Cancel</button>
            <button @click="saveUser" class="btn-premium btn-primary">
              {{ editingUser ? 'Save Changes' : 'Create User' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Confirm Dialog -->
    <transition name="fade">
      <div v-if="confirmDialog.show" class="modal-overlay" @click.self="confirmDialog.show = false">
        <div class="modal-card glass-card slide-up tiny">
          <div class="confirm-body">
            <div class="confirm-icon"><i class="pi pi-exclamation-triangle"></i></div>
            <p>{{ confirmDialog.message }}</p>
          </div>
          <div class="modal-footer centered">
            <button @click="confirmDialog.show = false" class="btn-premium secondary-btn">Cancel</button>
            <button @click="confirmDialog.action(); confirmDialog.show = false" class="btn-premium btn-primary danger">Confirm</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Assign Course Dialog (Teacher only) -->
    <transition name="fade">
      <div v-if="assignDialog.show" class="modal-overlay" @click.self="assignDialog.show = false">
        <div class="modal-card glass-card slide-up tiny">
          <div class="modal-header">
            <h3>Affecter à un cours</h3>
            <button @click="assignDialog.show = false" class="close-btn"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            <p class="text-sm mb-2 text-gray-500">Choisir un cours pour <strong>{{ assignDialog.student?.name }}</strong>:</p>
            <select v-model="assignDialog.selected" class="field-select w-full">
              <option v-for="c in assignDialog.choices" :key="c._id" :value="String(idOf(c))">{{ c.name }}</option>
            </select>
          </div>
          <div class="modal-footer">
            <button @click="assignDialog.show = false" class="btn-premium secondary-btn">Annuler</button>
            <button @click="confirmAssign" class="btn-premium btn-primary">Confirmer</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.users-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 2rem;
}

.top-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1.5rem;
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

.stats-row {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.mini-stat-card {
  padding: 0.75rem 1.5rem;
  min-width: 140px;
}

.stat-label {
  display: block;
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
}

/* Filters Card */
.filters-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.25rem;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  max-width: 400px;
}

.search-box i {
  color: var(--text-muted);
  font-size: 1rem;
}

.search-box input {
  border: none;
  background: transparent;
  width: 100%;
  font-size: 0.95rem;
  color: var(--text-primary);
  outline: none;
}

.role-select-filter {
  background: var(--surface-hover);
  border: 1px solid var(--surface-border);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  outline: none;
}

/* Table Specifics */
.user-info-cell {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.user-text {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9375rem;
}

.user-email {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.dept-text {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.actions-group {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal-card {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
}

.modal-card.tiny {
  max-width: 400px;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-weight: 700;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1.25rem;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--surface-border);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.modal-footer.centered {
  justify-content: center;
}

.secondary-btn {
  background: var(--surface-hover);
  color: var(--text-secondary);
  border: 1px solid var(--surface-border);
}

.btn-primary.danger {
  background: var(--color-danger);
}

.confirm-body {
  padding: 2rem 1.5rem;
  text-align: center;
}

.confirm-icon {
  font-size: 2.5rem;
  color: var(--color-warning);
  margin-bottom: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.field-select {
  padding: 0.625rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--surface-border);
  background: var(--surface-bg);
  color: var(--text-primary);
  outline: none;
}

@media (max-width: 768px) {
  .top-section {
    flex-direction: column;
    align-items: flex-start;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>