<script setup>
import { ref, onMounted, computed } from 'vue'
import userService from '../services/user.service'
import Table from '../components/common/Table.vue'
import FormField from '../components/common/FormField.vue'
import departmentService from '../services/department.service'
import courseService from '../services/course.service'
import { useUserStore } from '../store/user.store'
import { showSuccess, showError } from '../utils/toast'

const userStore = useUserStore()
// local confirm dialog state (uses the inline confirmation UI in this view)
const confirmAction = (message, action) => {
  confirmDialog.value = { show: true, message, action }
}
const executeConfirmedAction = async () => {
  if (confirmDialog.value.action) {
    await confirmDialog.value.action()
  }
  confirmDialog.value = { show: false, message: '', action: null }
}
const users = ref([])
const loading = ref(false)
const confirmDialog = ref({ show: false, message: '', action: null })
const editingUser = ref(null)
const canManageUsers = computed(() => ['admin', 'rh'].includes(userStore.user?.role))
const isTeacherView = computed(() => ['formateur', 'formateur_principal'].includes(userStore.user?.role))

const showCreate = ref(false)
const form = ref({ name: '', email: '', password: '', role: 'etudiant', department: '' })
const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'department', label: 'Department' },
  { key: 'isActive', label: 'Status' }
]
const departments = ref([])
const allCourses = ref([])
const assignDialog = ref({ show: false, student: null, choices: [], selected: '' })

// helper to normalize id values (accepts object with _id or id, or raw id)
const idOf = (v) => (v && (v._id || v.id || v))

const load = async () => {
  loading.value = true
  try {
    // If teacher/formateur_principal -> only load students
    if (isTeacherView.value) {
      const res = await userService.getStudents()
      users.value = res
      // load courses to allow unassign (we'll filter per student)
      const coursesRes = await courseService.getAll()
      allCourses.value = coursesRes || []
    } else {
      const res = await userService.getAll()
      users.value = res
    }
  } catch (e) {
    console.error(e)
    showError('Failed to load users')
  } finally {
    loading.value = false
  }
}

const loadDepartments = async () => {
  try {
    const res = await departmentService.getAll()
    departments.value = res || []
    console.log(departments.value);
  } catch (e) {
    console.error(e)
  }
}

const saveUser = async () => {
  // simple validation
  if (!form.value.name || !form.value.email) {
    showError('Name and email are required')
    return
  }

  try {
    if (editingUser.value) {
      // when editing, password is optional
      const payload = { ...form.value }
      if (!payload.password) delete payload.password
      await userService.update(editingUser.value._id, payload)
      showSuccess('User updated')
    } else {
      if (!form.value.password) { showError('Password is required for new users'); return }
      await userService.create(form.value)
      showSuccess('User created')
    }

    form.value = { name: '', email: '', password: '', role: 'etudiant', department: '' }
    showCreate.value = false
    editingUser.value = null
    await load()
  } catch (e) {
    console.error(e)
    showError(e?.response?.data?.message || 'Failed to save user')
  }
}

const toggleActivate = async (row) => {
  if (row._id === userStore.user?._id) {
    showError('You cannot deactivate your own account')
    return
  }

  // If admin/rh -> use existing flow
  if (canManageUsers.value) {
    confirmAction(`Are you sure you want to ${row.isActive ? 'deactivate' : 'activate'} ${row.name}?`, async () => {
      try {
        await userService.activate(row._id, !row.isActive)
        showSuccess(row.isActive ? 'User deactivated' : 'User activated')
        await load()
      } catch (e) {
        console.error(e)
        showError('Failed to toggle activation')
      }
    })
    return
  }

  // If teacher -> limited student activation
  if (isTeacherView.value) {
    confirmAction(`Are you sure you want to ${row.isActive ? 'deactivate' : 'activate'} ${row.name}?`, async () => {
      try {
        await userService.teacherToggleStudentActive(row._id)
        showSuccess(row.isActive ? 'Student deactivated' : 'Student activated')
        await load()
      } catch (e) {
        console.error(e)
        showError(e?.response?.data?.message || 'Failed to toggle activation')
      }
    })
    return
  }
}

const unassignStudentFromCourse = async (row) => {
  // Build list of courses where this student is enrolled and that the teacher can manage
  const studentCourses = allCourses.value.filter(c => Array.isArray(c.students) && c.students.some(s => String(idOf(s)) === String(idOf(row._id))))
  const manageable = studentCourses.filter(c => {
    if (userStore.user?.role === 'formateur') {
      return String(idOf(c.teacher)) === String(idOf(userStore.user?._id))
    } else if (userStore.user?.role === 'formateur_principal') {
      return String(idOf(c.department)) === String(idOf(userStore.user?.department))
    }
    return false
  })

  if (manageable.length === 0) {
    showError('Aucun cours disponible pour désaffectation pour cet étudiant')
    return
  }

  // Prefill assignDialog to allow selection of which course to remove
  assignDialog.value = {
    show: true,
    student: row,
    choices: manageable,
    selected: manageable.length === 1 ? String(idOf(manageable[0]._id)) : String(idOf(manageable[0]._id))
  }
}

const confirmUnassign = async () => {
  const dlg = assignDialog.value
  if (!dlg.student || !dlg.selected) return
  try {
    await userService.teacherUpdateStudentCourse(dlg.student._id, { action: 'remove', courseId: dlg.selected })
    showSuccess("Étudiant désaffecté du cours")
    assignDialog.value = { show: false, student: null, choices: [], selected: '' }
    await load()
  } catch (e) {
    console.error(e)
    showError(e?.response?.data?.message || 'Failed to unassign student')
  }
}

const openAssignDialog = (row) => {
  // Build list of courses that the teacher/principal can manage
  const manageable = allCourses.value.filter(c => {
    if (userStore.user?.role === 'formateur') {
      return String(idOf(c.teacher)) === String(idOf(userStore.user?._id))
    } else if (userStore.user?.role === 'formateur_principal') {
      return String(idOf(c.department)) === String(idOf(userStore.user?.department))
    }
    return false
  })

  // filter out courses where student is already enrolled
  const choices = manageable.filter(c => !(Array.isArray(c.students) && c.students.some(s => String(idOf(s)) === String(idOf(row._id)))))
  if (choices.length === 0) {
    showError('Aucun cours disponible pour affectation pour cet étudiant')
    return
  }

  assignDialog.value = { show: true, student: row, choices, selected: String(idOf(choices[0]._id)) }
}

const confirmAssign = async () => {
  const dlg = assignDialog.value
  if (!dlg.student || !dlg.selected) return
  try {
    await userService.teacherUpdateStudentCourse(dlg.student._id, { action: 'add', courseId: dlg.selected })
    showSuccess("Étudiant affecté au cours")
    assignDialog.value = { show: false, student: null, choices: [], selected: '' }
    await load()
  } catch (e) {
    console.error(e)
    showError(e?.response?.data?.message || 'Failed to assign student')
  }
}

const editUser = (row) => {
  editingUser.value = row
  form.value = { name: row.name, email: row.email, password: '', role: row.role, department: row.department?._id || row.department || '' }
  showCreate.value = true
}

const changeRole = async (row, newRole) => {
  if (!newRole || newRole === row.role) return
  confirmAction(`Change role of ${row.name} to ${newRole}?`, async () => {
    try {
      await userService.patchRole(row._id, newRole)
      showSuccess('Role updated')
      await load()
    } catch (e) {
      console.error(e)
      showError(e?.response?.data?.message || 'Failed to change role')
    }
  })
}

const deleteUser = async (row) => {
  if (row._id === userStore.user?._id) { showError("You cannot delete your own account"); return }
  confirmAction(`Delete user ${row.name}?`, async () => {
    try {
      await userService.remove(row._id)
      showSuccess('User deleted')
      await load()
    } catch (e) {
      console.error(e)
      showError(e?.response?.data?.message || 'Failed to delete user')
    }
  })
}

onMounted(async () => { await load(); await loadDepartments() })
</script>

<template>
  <div>
    <!-- Confirmation Dialog -->
    <div v-if="confirmDialog.show" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div class="w-full max-w-md">
        <div class="rounded-2xl bg-white/90 dark:bg-slate-800/90 p-6 shadow-2xl border border-blue-100 dark:border-blue-900">
          <p class="text-lg mb-4 text-slate-900 dark:text-white">{{ confirmDialog.message }}</p>
          <div class="flex justify-end gap-3">
            <button @click="confirmDialog.show = false" class="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300">Cancel</button>
            <button @click="executeConfirmedAction" class="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600">Confirm</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Assign/Unassign Dialog -->
    <div v-if="assignDialog.show" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div class="w-full max-w-md">
        <div class="rounded-2xl bg-white/90 dark:bg-slate-800/90 p-6 shadow-2xl border border-blue-100 dark:border-blue-900">
          <h3 class="text-lg font-semibold mb-3 text-slate-900 dark:text-white">Affectation / Désaffectation</h3>
          <p class="mb-3 text-slate-700 dark:text-slate-300">Étudiant: <strong>{{ assignDialog.student?.name }}</strong></p>
          <div>
            <label class="block text-sm mb-1 text-slate-700 dark:text-slate-300">Choisir un cours</label>
            <select v-model="assignDialog.selected" class="w-full p-2 rounded-lg border">
              <option v-for="c in assignDialog.choices" :key="c._id" :value="String(c._id)">{{ c.title }}</option>
            </select>
          </div>
          <div class="flex justify-end gap-3 mt-4">
            <button @click="assignDialog.show = false" class="px-4 py-2 rounded-lg bg-slate-200">Cancel</button>
            <button @click="confirmAssign" class="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">Assign</button>
            <button @click="confirmUnassign" class="px-4 py-2 rounded-lg bg-red-500 text-white">Unassign</button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold bg-linear-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Users</h1>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Gestion des utilisateurs</p>
      </div>
      <div>
        <button v-if="canManageUsers" @click="showCreate = !showCreate" 
          class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-md transition-all">
          {{ showCreate ? 'Cancel' : 'Create User' }}
        </button>
      </div>
    </div>

    <div v-if="showCreate" class="mt-4 p-6 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-blue-100 dark:border-blue-900 shadow-xl">
      <h2 class="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">{{ editingUser ? 'Edit User' : 'Create New User' }}</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField v-model="form.name" label="Name" required />
        <FormField v-model="form.email" label="Email" type="email" required />
        <FormField v-model="form.password" label="Password" type="password" :required="!editingUser" />
        <div>
          <label class="block text-sm mb-1">Role</label>
          <select v-model="form.role" class="w-full p-2 rounded border">
            <option value="admin">admin</option>
            <option value="rh">rh</option>
            <option value="formateur_principal">formateur_principal</option>
            <option value="formateur">formateur</option>
            <option value="etudiant">etudiant</option>
          </select>
        </div>
        <div>
          <label class="block text-sm mb-1">Department</label>
          <select v-model="form.department" class="w-full p-2 rounded border">
            <option value="">-- none --</option>
            <option v-for="d in departments" :key="d._id" :value="d._id">{{ d.name }}</option>
          </select>
        </div>
      </div>
      <div class="mt-3 text-right">
        <button @click="saveUser" class="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-md">{{ editingUser ? 'Update' : 'Create' }}</button>
      </div>
    </div>
    <div v-if="loading">Loading...</div>
    <div v-else class="mt-6">
      <div class="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-blue-100 dark:border-blue-900 overflow-hidden shadow-xl">
        <Table :columns="columns" :rows="users">
        <template #cell-department="{ row }">
          {{ row.department?.name || '-' }}
        </template>
        <!-- In the actions slot, show teacher-specific buttons -->
        <template #actions="{ row }">
          <div v-if="canManageUsers" class="flex items-center gap-2">
            <button @click="editUser(row)" class="px-2 py-1 text-sm rounded bg-slate-200 hover:bg-slate-300">Edit</button>
            <button @click="toggleActivate(row)" class="px-2 py-1 text-sm rounded bg-amber-100 hover:bg-amber-200">
              {{ row.isActive ? 'Desactivate' : 'Activate' }}
            </button>
            <select :value="row.role" @change.prevent="changeRole(row, $event.target.value)" class="p-1 rounded border text-sm" :disabled="row._id === userStore.user?._id">
              <option value="admin">admin</option>
              <option value="rh">rh</option>
              <option value="formateur_principal">formateur_principal</option>
              <option value="formateur">formateur</option>
              <option value="etudiant">etudiant</option>
            </select>
            <button @click="deleteUser(row)" class="px-2 py-1 text-sm rounded bg-red-100 hover:bg-red-200">Delete</button>
          </div>
          <div v-else-if="isTeacherView" class="flex items-center gap-2">
            <button @click="openAssignDialog(row)" class="px-2 py-1 text-sm rounded bg-green-100 hover:bg-green-200">Affecter</button>
            <button @click="unassignStudentFromCourse(row)" class="px-2 py-1 text-sm rounded bg-amber-100 hover:bg-amber-200">Désaffecter</button>
            <button @click="toggleActivate(row)" class="px-2 py-1 text-sm rounded bg-red-100 hover:bg-red-200">
              {{ row.isActive ? 'Désactiver' : 'Activer' }}
            </button>
          </div>
          <div v-else class="text-sm text-gray-500">-</div>
        </template>
        </Table>
      </div>
    </div>
  </div>
</template>
<!-- placeholder: frontend/src/views/UsersView.vue -->