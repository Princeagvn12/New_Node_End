import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Vue3Toastify from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

// PrimeVue
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import 'primeicons/primeicons.css'

// Add custom styles for glassmorphic toasts
const style = document.createElement('style')
style.textContent = `
.glassmorphic-toast {
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(16px) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.2) !important;
  color: #1a1a1a !important;
  border-radius: 12px !important;
  padding: 16px !important;
  font-weight: 500 !important;
}

.dark .glassmorphic-toast {
  background: rgba(30, 41, 59, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
}

.glassmorphic-toast.error {
  background: rgba(239, 68, 68, 0.8) !important;
  border: 1px solid rgba(239, 68, 68, 0.3) !important;
  color: white !important;
}

.glassmorphic-toast.warning {
  background: rgba(245, 158, 11, 0.8) !important;
  border: 1px solid rgba(245, 158, 11, 0.3) !important;
  color: white !important;
}

.glassmorphic-toast button {
  color: currentColor !important;
  opacity: 0.8 !important;
  transition: opacity 0.2s !important;
}

.glassmorphic-toast button:hover {
  opacity: 1 !important;
}

.Toastify__toast-icon {
  font-size: 1.25rem !important;
  margin-right: 12px !important;
}

.Toastify__progress-bar {
  background: rgba(255, 255, 255, 0.2) !important;
  height: 3px !important;
}

.dark .Toastify__progress-bar {
  background: rgba(0, 0, 0, 0.2) !important;
}
`

document.head.appendChild(style)

import App from './App.vue'
import router from './router'
import { initTheme } from './composables/useTheme'
import confirmPlugin from './plugins/confirmPlugin'
import { useUserStore } from './store/user.store'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Vue3Toastify)
app.use(confirmPlugin)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark',
      cssLayer: false
    }
  }
})

// initialize theme (reads system preference or stored choice)
initTheme()

// L'initialisation de l'utilisateur se fera dans le guard du routeur
app.mount('#app')
