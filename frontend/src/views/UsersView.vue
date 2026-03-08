<script setup>
import { ref, onMounted, computed } from 'vue'
import userService from '../services/user.service'
import departmentService from '../services/department.service'
import courseService from '../services/course.service'
import { useUserStore } from '../store/user.store'
import { showSuccess, showError } from '../utils/toast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import Avatar from 'primevue/avatar'

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
    { label: 'Total Users', value: users.value.length },
    { label: 'Active Now', value: users.value.filter(u => u.isActive).length }
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

const avatarColors = [
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
  '#F59E0B', '#14B8A6', '#10B981', '#F43F5E'
]
const getAvatarColor = (name) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
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
  <div class="px-8 py-6 min-h-screen bg-white dark:bg-[#0F172A] transition-colors duration-300">
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
      <div>
        <h1 class="text-3xl font-extrabold text-[#111827] dark:text-[#F8FAFC] tracking-tight mb-1">Users Management</h1>
        <p class="text-[#6B7280] dark:text-[#94A3B8] text-sm">Manage platform access, roles, and departmental assignments.</p>
      </div>
      <div class="flex items-center gap-6">
        <div v-for="stat in stats" :key="stat.label" class="flex flex-col items-end">
          <span class="text-[10px] uppercase font-bold text-[#6B7280] dark:text-[#94A3B8] tracking-widest">{{ stat.label }}</span>
          <span class="text-2xl font-black text-[#111827] dark:text-[#F8FAFC]">{{ stat.value }}</span>
        </div>
        <Button 
          v-if="canManageUsers" 
          @click="showCreate = true" 
          label="Create User" 
          icon="pi pi-plus" 
          class="p-button-primary rounded-lg px-6 font-bold shadow-md hover:shadow-lg transform transition-all active:scale-95"
        />
      </div>
    </div>

    <!-- Search & Filters Container -->
    <div class="p-4 mb-6 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#1E293B] rounded-xl flex flex-col md:flex-row gap-4 shadow-sm">
      <div class="relative flex-1">
        <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280] dark:text-[#94A3B8]"></i>
        <InputText 
          v-model="searchQuery" 
          placeholder="Search for a name or email..." 
          class="w-full pl-11 !border-none !bg-transparent dark:text-[#F8FAFC] focus:ring-0" 
        />
      </div>
      <div class="h-10 w-[1px] bg-[#E5E7EB] dark:bg-[#334155] hidden md:block"></div>
      <Select 
        v-model="selectedRole" 
        :options="[
          {label: 'All Roles', value: 'all'},
          {label: 'Admin', value: 'admin'},
          {label: 'RH', value: 'rh'},
          {label: 'Principal Teacher', value: 'formateur_principal'},
          {label: 'Teacher', value: 'formateur'},
          {label: 'Student', value: 'etudiant'}
        ]"
        optionLabel="label"
        optionValue="value"
        placeholder="Filter by Role"
        class="w-full md:w-56 !border-none !bg-transparent dark:text-[#F8FAFC] focus:ring-0"
      />
    </div>

    <!-- DataTable -->
    <DataTable 
      :value="filteredUsers" 
      :loading="loading" 
      class="p-datatable-modern"
      responsiveLayout="scroll"
      removableSort
      stripedRows
    >
      <Column header="USER" sortable sortField="name">
        <template #body="{ data }">
          <div class="flex items-center gap-4 py-1">
            <div 
              class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
              :style="{ backgroundColor: getAvatarColor(data.name) }"
            >
              {{ getInitials(data.name) }}
            </div>
            <div class="flex flex-col">
              <span class="font-bold text-[#111827] dark:text-[#F8FAFC] text-[15px]">{{ data.name }}</span>
              <span class="text-[#6B7280] dark:text-[#94A3B8] text-xs font-medium">{{ data.email }}</span>
            </div>
          </div>
        </template>
      </Column>

      <Column field="role" header="ROLE" sortable>
        <template #body="{ data }">
          <span class="text-sm font-medium text-[#374151] dark:text-[#CBD5E1] capitalize">
            {{ data.role.replace('_', ' ') }}
          </span>
        </template>
      </Column>

      <Column header="DEPARTMENT" sortable sortField="department.name">
        <template #body="{ data }">
          <span class="text-sm text-[#6B7280] dark:text-[#94A3B8]">
            {{ data.department?.name || '—' }}
          </span>
        </template>
      </Column>

      <Column header="STATUS" sortable field="isActive">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <div class="w-1.5 h-1.5 rounded-full" :class="data.isActive ? 'bg-[#22C55E]' : 'bg-[#EF4444]'"></div>
            <span class="text-sm font-medium" :class="data.isActive ? 'text-[#22C55E]' : 'text-[#EF4444]'">
              {{ data.isActive ? 'Active' : 'Deactivated' }}
            </span>
          </div>
        </template>
      </Column>

      <Column header="ACTIONS" headerStyle="text-align: center" bodyStyle="text-align: center">
        <template #body="{ data }">
          <div class="flex items-center justify-center gap-4">
            <button v-if="canManageUsers || isTeacherView" @click="editUser(data)" class="text-[#6B7280] dark:text-[#94A3B8] hover:text-[#3B82F6] transition-colors" title="Edit">
              <i class="pi pi-pencil"></i>
            </button>
            <button v-if="canManageUsers || isTeacherView" @click="toggleActivate(data)" class="text-[#6B7280] dark:text-[#94A3B8] hover:text-[#F59E0B] transition-colors" title="Deactivate">
              <i class="pi pi-ban"></i>
            </button>
            <button v-if="isTeacherView" @click="openAssignDialog(data)" class="text-[#6B7280] dark:text-[#94A3B8] hover:text-[#6366F1] transition-colors" title="Assign Course">
              <i class="pi pi-link"></i>
            </button>
            <button v-if="canManageUsers" @click="deleteUser(data)" class="text-[#6B7280] dark:text-[#94A3B8] hover:text-[#EF4444] transition-colors" title="Delete">
              <i class="pi pi-trash"></i>
            </button>
          </div>
        </template>
      </Column>

      <template #footer>
        <div class="py-2 text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider">
          Total Users: {{ filteredUsers.length }}
        </div>
      </template>

      <template #empty>
        <div class="py-12 border-2 border-dashed border-[#E5E7EB] dark:border-[#334155] rounded-xl flex flex-col items-center">
          <i class="pi pi-users text-4xl text-[#E5E7EB] dark:text-[#334155] mb-2"></i>
          <p class="text-[#6B7280] dark:text-[#94A3B8] font-medium">No platform users found.</p>
        </div>
      </template>
    </DataTable>

    <!-- Create/Edit User Dialog -->
    <Dialog 
      v-model:visible="showCreate" 
      :header="editingUser ? 'Edit User Profile' : 'Create New User'" 
      modal 
      class="p-fluid max-w-lg w-full"
      :breakpoints="{'960px': '75vw', '641px': '90vw'}"
    >
      <div class="grid grid-cols-1 gap-6 pt-2">
        <div class="flex flex-col gap-2">
          <label class="text-xs font-bold text-[#374151] dark:text-[#CBD5E1] uppercase tracking-wider">Full Name</label>
          <InputText v-model="form.name" placeholder="John Doe" class="!bg-[#F9FAFB] dark:!bg-[#334155] !border-none rounded-lg" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-xs font-bold text-[#374151] dark:text-[#CBD5E1] uppercase tracking-wider">Email Address</label>
          <InputText v-model="form.email" type="email" placeholder="john.doe@university.com" class="!bg-[#F9FAFB] dark:!bg-[#334155] !border-none rounded-lg" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-xs font-bold text-[#374151] dark:text-[#CBD5E1] uppercase tracking-wider">Password</label>
          <InputText v-model="form.password" type="password" :placeholder="editingUser ? '(Leave empty to keep current)' : '••••••••'" class="!bg-[#F9FAFB] dark:!bg-[#334155] !border-none rounded-lg" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-xs font-bold text-[#374151] dark:text-[#CBD5E1] uppercase tracking-wider">Role</label>
            <Select 
              v-model="form.role" 
              :options="[
                {label: 'Student', value: 'etudiant'},
                {label: 'Teacher', value: 'formateur'},
                {label: 'Principal Teacher', value: 'formateur_principal'},
                {label: 'RH', value: 'rh'},
                {label: 'Admin', value: 'admin'}
              ]"
              optionLabel="label"
              optionValue="value"
              class="!bg-[#F9FAFB] dark:!bg-[#334155] !border-none rounded-lg"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-xs font-bold text-[#374151] dark:text-[#CBD5E1] uppercase tracking-wider">Department</label>
            <Select 
              v-model="form.department" 
              :options="departments"
              optionLabel="name"
              optionValue="_id"
              placeholder="Select Dept"
              class="!bg-[#F9FAFB] dark:!bg-[#334155] !border-none rounded-lg"
            />
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex gap-3 justify-end mt-2">
          <Button label="Cancel" @click="resetForm" class="p-button-text p-button-secondary font-bold" />
          <Button @click="saveUser" :label="editingUser ? 'Save Changes' : 'Create User'" class="p-button-primary rounded-lg px-8 font-bold shadow-md" />
        </div>
      </template>
    </Dialog>

    <!-- Generic Confirm Dialog Overlay -->
    <Dialog v-model:visible="confirmDialog.show" modal header="Confirmation Required" class="max-w-md w-full">
      <div class="flex flex-col items-center text-center p-4">
        <i class="pi pi-exclamation-triangle text-4xl text-[#F59E0B] mb-4"></i>
        <p class="text-[#374151] dark:text-[#CBD5E1] font-medium">{{ confirmDialog.message }}</p>
      </div>
      <template #footer>
        <div class="flex justify-center gap-3">
          <Button label="Cancel" @click="confirmDialog.show = false" class="p-button-text font-bold" />
          <Button label="Confirm Action" @click="confirmDialog.action(); confirmDialog.show = false" class="p-button-danger rounded-lg px-8 font-bold shadow-md" />
        </div>
      </template>
    </Dialog>
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