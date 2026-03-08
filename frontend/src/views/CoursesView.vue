<script setup>
import { ref, onMounted, computed } from 'vue'
import courseService from '../services/course.service'
import departmentService from '../services/department.service'
import userService from '../services/user.service'
import { useUserStore } from '../store/user.store'
import { showSuccess, showError } from '../utils/toast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import MultiSelect from 'primevue/multiselect'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import Avatar from 'primevue/avatar'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'

const userStore = useUserStore()
const courses = ref([])
const departments = ref([])
const teachers = ref([])
const studentsList = ref([])
const loading = ref(false)
const showCreate = ref(false)
const editingCourse = ref(null)

// Search & Filters
const searchQuery = ref('')
const selectedDept = ref('all')
const selectedCredits = ref('all')

const form = ref({ title: '', code: '', description: '', department: '', teacher: '', credits: 1, students: [] })

const canManage = computed(() => ['admin', 'rh', 'formateur_principal'].includes(userStore.user?.role))

const stats = computed(() => [
  { 
    label: 'Active Courses', 
    value: courses.value.length, 
    icon: 'pi pi-book', 
    trend: 'Total listed', 
    trendType: 'neutral' 
  },
  { 
    label: 'Total Enrollment', 
    value: courses.value.reduce((acc, c) => acc + (c.students?.length || 0), 0), 
    icon: 'pi pi-users', 
    trend: 'Active students', 
    trendType: 'up' 
  },
  { 
    label: 'Unassigned Courses', 
    value: courses.value.filter(c => !c.teacher).length, 
    icon: 'pi pi-exclamation-circle', 
    trend: 'Action required', 
    trendType: 'warning' 
  }
])

const filteredCourses = computed(() => {
  return courses.value.filter(c => {
    const matchesSearch = !searchQuery.value || 
      c.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesDept = selectedDept.value === 'all' || (c.department?._id || c.department) === selectedDept.value
    const matchesCredits = selectedCredits.value === 'all' || String(c.credits) === selectedCredits.value
    return matchesSearch && matchesDept && matchesCredits
  })
})

const avatarColors = ['#6366F1', '#8B5CF6', '#EC4899', '#3B82F6', '#14B8A6']
const getAvatarColor = (index) => avatarColors[index % avatarColors.length]
const getInitials = (name) => {
  if (!name) return '??'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const load = async () => {
  loading.value = true
  try {
    courses.value = await courseService.getAll()
    departments.value = await departmentService.getAll()
    teachers.value = await userService.getTeachers()
    studentsList.value = await userService.getStudents()
  } catch (e) {
    showError('Failed to load data')
  } finally {
    loading.value = false
  }
}

const saveCourse = async () => {
  if (!form.value.title || !form.value.code) {
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
    title: c.title, 
    code: c.code, 
    description: c.description || '', 
    department: c.department?._id || c.department || '', 
    teacher: c.teacher?._id || c.teacher || '',
    credits: c.credits || 0,
    students: Array.isArray(c.students) ? c.students.map(s => s._id || s) : []
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
  form.value = { title: '', code: '', description: '', department: '', teacher: '', credits: 1, students: [] }
  showCreate.value = false
  editingCourse.value = null
}

onMounted(load)
</script>

<template>
  <div class="px-8 py-6 min-h-screen bg-white dark:bg-[#0F172A] transition-colors duration-300">
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
      <div>
        <h1 class="text-3xl font-extrabold text-[#111827] dark:text-[#F8FAFC] tracking-tight mb-1">Course Management</h1>
        <p class="text-[#6B7280] dark:text-[#94A3B8] text-sm">Manage and organize school curriculum.</p>
      </div>
      <Button 
        v-if="canManage" 
        @click="showCreate = true" 
        label="Create New Course" 
        icon="pi pi-plus" 
        class="p-button-primary rounded-lg px-6 font-bold shadow-md hover:shadow-lg transform transition-all active:scale-95"
      />
    </div>

    <!-- Search & Filters Container -->
    <div class="p-4 mb-6 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#1E293B] rounded-xl flex flex-col md:flex-row gap-4 shadow-sm items-center">
      <div class="relative flex-1">
        <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280] dark:text-[#94A3B8]"></i>
        <InputText 
          v-model="searchQuery" 
          placeholder="Search by course name, code or teacher..." 
          class="w-full pl-11 !border-none !bg-transparent dark:text-[#F8FAFC] focus:ring-0 text-sm" 
        />
      </div>
      <div class="h-10 w-[1px] bg-[#E5E7EB] dark:bg-[#334155] hidden md:block"></div>
      <Select 
        v-model="selectedDept" 
        :options="[{name: 'All Departments', _id: 'all'}, ...departments]"
        optionLabel="name"
        optionValue="_id"
        placeholder="All Departments"
        class="w-full md:w-56 !border-none !bg-transparent dark:text-[#F8FAFC] focus:ring-0 text-sm"
      />
      <div class="h-10 w-[1px] bg-[#E5E7EB] dark:bg-[#334155] hidden md:block"></div>
      <Select 
        v-model="selectedCredits" 
        :options="[{label: 'Credits', value: 'all'}, ...[1,2,3,4,5,6,8,10].map(n => ({label: `${n} ECTS`, value: String(n)}))]"
        optionLabel="label"
        optionValue="value"
        placeholder="Credits"
        class="w-full md:w-32 !border-none !bg-transparent dark:text-[#F8FAFC] focus:ring-0 text-sm"
      />
    </div>

    <!-- Courses Table -->
    <DataTable 
      :value="filteredCourses" 
      :loading="loading" 
      class="p-datatable-modern mb-8"
      responsiveLayout="scroll"
      removableSort
      stripedRows
    >
      <Column header="COURSE DETAILS" sortable sortField="title">
        <template #body="{ data, index }">
          <div class="flex items-center gap-4 py-1">
            <div 
              class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm"
              :style="{ backgroundColor: getAvatarColor(index) }"
            >
              {{ getInitials(data.title) }}
            </div>
            <div class="flex flex-col">
              <span class="font-bold text-[#111827] dark:text-[#F8FAFC] text-[15px]">{{ data.title }}</span>
              <span class="text-[#6B7280] dark:text-[#94A3B8] text-xs font-medium">{{ data.code }}</span>
            </div>
          </div>
        </template>
      </Column>

      <Column header="DEPARTMENT" sortable sortField="department.name">
        <template #body="{ data }">
          <Tag :value="data.department?.name || 'Unassigned'" class="!bg-[#F1F5F9] !text-[#475569] !rounded-full !px-3 !font-semibold !text-[10px]" />
        </template>
      </Column>

      <Column header="ASSIGNED TEACHER" sortable sortField="teacher.name">
        <template #body="{ data }">
          <div v-if="data.teacher" class="flex items-center gap-2">
            <Avatar :label="getInitials(data.teacher.name)" shape="circle" class="!bg-blue-100 !text-blue-600 !w-6 !h-6 !text-[10px]" />
            <span class="text-sm font-medium text-[#374151] dark:text-[#CBD5E1]">{{ data.teacher.name }}</span>
          </div>
          <span v-else class="text-sm italic text-[#94A3B8]">Unassigned</span>
        </template>
      </Column>

      <Column field="credits" header="CREDITS" sortable>
        <template #body="{ data }">
          <span class="text-sm font-bold text-[#111827] dark:text-[#F8FAFC]">{{ data.credits || 0 }} ECTS</span>
        </template>
      </Column>

      <Column header="STUDENTS" sortable :sortField="data => data.students?.length || 0">
        <template #body="{ data }">
          <div class="flex items-center gap-1">
            <i class="pi pi-users text-[#6B7280] dark:text-[#94A3B8] text-xs"></i>
            <span class="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">{{ data.students?.length || 0 }}</span>
          </div>
        </template>
      </Column>

      <Column header="STATUS" sortable sortField="teacher">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <div class="w-1.5 h-1.5 rounded-full" :class="data.teacher ? 'bg-[#22C55E]' : 'bg-[#EF4444]'"></div>
            <span class="text-[11px] font-bold uppercase tracking-wider" :class="data.teacher ? 'text-[#22C55E]' : 'text-[#EF4444]'">
              {{ data.teacher ? 'Active' : 'Draft' }}
            </span>
          </div>
        </template>
      </Column>

      <Column header="ACTIONS" headerStyle="text-align: right" bodyStyle="text-align: right">
        <template #body="{ data }">
          <div v-if="canManage" class="flex items-center justify-end gap-4 mr-2">
            <button @click="editCourse(data)" class="text-[#6B7280] dark:text-[#94A3B8] hover:text-[#3B82F6] transition-colors" title="Edit">
              <i class="pi pi-pencil"></i>
            </button>
            <button @click="deleteCourse(data)" class="text-[#6B7280] dark:text-[#94A3B8] hover:text-[#EF4444] transition-colors" title="Delete">
              <i class="pi pi-trash"></i>
            </button>
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Bottom Stat Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="stat in stats" :key="stat.label" class="p-6 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-xl shadow-sm relative overflow-hidden group">
        <div class="flex justify-between items-start mb-4">
          <span class="text-sm font-bold text-[#6B7280] dark:text-[#94A3B8]">{{ stat.label }}</span>
          <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <i :class="[stat.icon, 'text-blue-500 text-lg']"></i>
          </div>
        </div>
        <div class="flex flex-col">
          <span class="text-3xl font-black text-[#111827] dark:text-[#F8FAFC] mb-2">{{ stat.value }}</span>
          <div class="flex items-center gap-1.5 text-[11px] font-bold" :class="{
            'text-[#22C55E]': stat.trendType === 'up',
            'text-[#F59E0B]': stat.trendType === 'warning',
            'text-[#6B7280]': stat.trendType === 'neutral'
          }">
            <i v-if="stat.trendType === 'up'" class="pi pi-arrow-up-right"></i>
            <i v-if="stat.trendType === 'warning'" class="pi pi-exclamation-circle"></i>
            <span>{{ stat.trend }}</span>
          </div>
        </div>
        <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog 
      v-model:visible="showCreate" 
      :header="editingCourse ? 'Update Course' : 'Create New Course'" 
      modal 
      class="p-fluid max-w-2xl w-full"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div class="flex flex-col gap-2">
          <label class="text-xs font-bold text-[#374151] dark:text-[#CBD5E1] uppercase tracking-wider">Course Name</label>
          <InputText v-model="form.title" placeholder="Advanced Node.js" class="!bg-[#F9FAFB] dark:!bg-[#334155] !border-none rounded-lg" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-xs font-bold text-[#374151] dark:text-[#CBD5E1] uppercase tracking-wider">Course Code</label>
          <InputText v-model="form.code" placeholder="CS405" class="!bg-[#F9FAFB] dark:!bg-[#334155] !border-none rounded-lg" />
        </div>
        <div class="flex flex-col gap-2 md:col-span-2">
          <label class="text-xs font-bold text-[#374151] dark:text-[#CBD5E1] uppercase tracking-wider">Description</label>
          <Textarea v-model="form.description" rows="3" placeholder="Enter course curriculum details..." class="!bg-[#F9FAFB] dark:!bg-[#334155] !border-none rounded-lg" />
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
        <div class="flex flex-col gap-2">
          <label class="text-xs font-bold text-[#374151] dark:text-[#CBD5E1] uppercase tracking-wider">Teacher</label>
          <Select 
            v-model="form.teacher" 
            :options="teachers"
            optionLabel="name"
            optionValue="_id"
            placeholder="Select Teacher"
            class="!bg-[#F9FAFB] dark:!bg-[#334155] !border-none rounded-lg"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-xs font-bold text-[#374151] dark:text-[#CBD5E1] uppercase tracking-wider">ECTS Credits</label>
          <InputNumber v-model="form.credits" :min="0" :max="30" showButtons class="!bg-[#F9FAFB] dark:!bg-[#334155] !border-none rounded-lg" />
        </div>
        <div class="flex flex-col gap-2 md:col-span-2">
          <label class="text-xs font-bold text-[#374151] dark:text-[#CBD5E1] uppercase tracking-wider">Enrolled Students</label>
          <MultiSelect 
            v-model="form.students" 
            :options="studentsList"
            optionLabel="name"
            optionValue="_id"
            placeholder="Select Students"
            display="chip"
            filter
            class="!bg-[#F9FAFB] dark:!bg-[#334155] !border-none rounded-lg"
          >
            <template #option="slotProps">
              <div class="flex items-center gap-2">
                <Avatar :label="getInitials(slotProps.option.name)" shape="circle" class="w-6 h-6 text-[10px]" />
                <span>{{ slotProps.option.name }}</span>
              </div>
            </template>
          </MultiSelect>
        </div>
      </div>
      <template #footer>
        <div class="flex gap-3 justify-end mt-4">
          <Button label="Cancel" @click="resetForm" class="p-button-text p-button-secondary font-bold" />
          <Button label="Save Course" @click="saveCourse" class="p-button-primary rounded-lg px-8 font-bold shadow-md" />
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