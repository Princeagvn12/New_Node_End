<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 flex items-center justify-center z-50" @click="onClickOutside">
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
      
      <div class="relative bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4 animate-scale-in"
           @click.stop>
        <h3 class="text-lg font-semibold mb-2">{{ title }}</h3>
        <p class="text-gray-600 dark:text-gray-300 mb-6">{{ message }}</p>
        
        <div class="flex justify-end gap-3">
          <button @click="handleCancel" 
            class="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg transition-colors">
            {{ cancelText }}
          </button>
          <button @click="handleConfirm" 
            :class="[
              'px-4 py-2 rounded-lg transition-colors text-white',
              variant === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
            ]">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: 'Confirm Action'
  },
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  variant: {
    type: String,
    default: 'danger',
    validator: (value) => ['danger', 'primary'].includes(value)
  }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const handleConfirm = () => {
  emit('confirm')
  emit('update:modelValue', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}

const onClickOutside = () => {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>

<style scoped>
.animate-scale-in {
  animation: scale-in 0.2s ease-out;
}

@keyframes scale-in {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>