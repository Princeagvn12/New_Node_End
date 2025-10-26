import { reactive } from 'vue'

// Shared state for the confirm dialog
export const confirmState = reactive({
  isOpen: false,
  title: '',
  message: '',
  variant: 'danger',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  resolvePromise: null,
  rejectPromise: null
})

export const confirm = (options) => {
  return new Promise((resolve, reject) => {
    confirmState.isOpen = true
    confirmState.title = options.title || 'Confirm Action'
    confirmState.message = options.message
    confirmState.variant = options.variant || 'danger'
    confirmState.confirmText = options.confirmText || 'Confirm'
    confirmState.cancelText = options.cancelText || 'Cancel'
    confirmState.resolvePromise = resolve
    confirmState.rejectPromise = reject
  })
}

export const handleConfirm = () => {
  if (confirmState.resolvePromise) {
    confirmState.resolvePromise(true)
  }
  confirmState.isOpen = false
  confirmState.resolvePromise = null
  confirmState.rejectPromise = null
}

export const handleCancel = () => {
  if (confirmState.rejectPromise) {
    confirmState.rejectPromise(false)
  }
  confirmState.isOpen = false
  confirmState.resolvePromise = null
  confirmState.rejectPromise = null
}

export default {
  install(app) {
    // Make confirm globally available
    app.config.globalProperties.$confirm = confirm
    // Provide for injection
    app.provide('confirm', confirm)
  }
}