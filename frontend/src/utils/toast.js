import { toast } from 'vue3-toastify'

const defaultConfig = {
  autoClose: 3000,
  hideProgressBar: true,
  closeButton: true,
  position: toast.POSITION.TOP_RIGHT,
  className: 'glassmorphic-toast',
  theme: 'light'
}

export const showSuccess = (message) => {
  toast.success(message, {
    ...defaultConfig,
    icon: '✓'
  })
}

export const showError = (message) => {
  toast.error(message, {
    ...defaultConfig,
    className: 'glassmorphic-toast error',
    icon: '⚠'
  })
}

export const showInfo = (message) => {
  toast(message, {
    ...defaultConfig,
    icon: 'ℹ'
  })
}

export const showWarning = (message) => {
  toast.warning(message, {
    ...defaultConfig,
    className: 'glassmorphic-toast warning',
    icon: '⚠'
  })
}