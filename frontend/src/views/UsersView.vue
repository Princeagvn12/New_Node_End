<script setup>
import { ref, onMounted, computed } from 'vue'
import userService from '../services/user.service'
import Table from '../components/common/Table.vue'
import FormField from '../components/common/FormField.vue'
import departmentService from '../services/department.service'
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

const load = async () => {
  loading.value = true
  try {
    const res = await userService.getAll()
    console.log(res);
    users.value = res
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
}

const deleteUser = async (row) => {
  if (row._id === userStore.user?._id) {
    showError('You cannot delete your own account')
    return
  }

  confirmAction(`Are you sure you want to delete ${row.name}? This action cannot be undone.`, async () => {
    try {
      await userService.remove(row._id)
      showSuccess('User deleted successfully')
      await load()
    } catch (e) {
      console.error(e)
      showError('Failed to delete user')
    }
  })
}

const changeRole = async (row, newRole) => {
  if (row._id === userStore.user?._id) {
    showError('You cannot change your own role')
    await load()
    return
  }

  try {
    await userService.patchRole(row._id, newRole)
    showSuccess('Role updated')
    await load()
  } catch (e) {
    console.error(e)
    showError('Failed to change role')
  }
}

const editUser = (row) => {
  editingUser.value = row
  form.value = { name: row.name, email: row.email, password: '', role: row.role, department: row.department?._id || row.department || '' }
  showCreate.value = true
}

onMounted(async () => { await load(); await loadDepartments() })
</script>

<template>
  <div>
    <!-- Confirmation Dialog -->
    <div v-if="confirmDialog.show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <p class="text-lg mb-4">{{ confirmDialog.message }}</p>
        <div class="flex justify-end gap-3">
          <button @click="confirmDialog.show = false" class="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">
            Cancel
          </button>
          <button @click="executeConfirmedAction" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
            Confirm
          </button>
        </div>
      </div>
    </div>

    <h1 class="text-2xl font-semibold text-blue-400">Users</h1>
    <div class="mt-4 flex justify-between items-center">
      <button v-if="canManageUsers" @click="showCreate = !showCreate" 
        class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors">
        {{ showCreate ? 'Cancel' : 'Create User' }}
      </button>
    </div>

    <div v-if="showCreate" class="mt-4 p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg shadow-md">
      <h2 class="text-xl font-semibold mb-4">{{ editingUser ? 'Edit User' : 'Create New User' }}</h2>
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
        <button @click="saveUser" class="px-3 py-1 bg-blue-400 text-white rounded">{{ editingUser ? 'Update' : 'Create' }}</button>
      </div>
    </div>
    <div v-if="loading">Loading...</div>
    <div v-else class="mt-4">
      <Table :columns="columns" :rows="users">
        <template #cell-department="{ row }">
          {{ row.department?.name || '-' }}
        </template>
        <template #actions="{ row }">
          <div v-if="canManageUsers" class="flex items-center gap-2">
            <button @click="editUser(row)" class="px-2 py-1 text-sm rounded bg-slate-200 hover:bg-slate-300">Edit</button>
            <button @click="toggleActivate(row)" class="px-2 py-1 text-sm rounded bg-amber-100 hover:bg-amber-200">
              {{ row.isActive ? 'Deactivate' : 'Activate' }}
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
          <div v-else class="text-sm text-gray-500">-</div>
        </template>
      </Table>
    </div>
  </div>
</template>
<!-- placeholder: frontend/src/views/UsersView.vue -->