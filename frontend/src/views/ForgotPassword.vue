<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import authService from '../services/auth.service'
import { showSuccess, showError } from '../utils/toast'

const router = useRouter()
const email = ref('')
const loading = ref(false)

const submit = async () => {
  if (!email.value) { showError('Email requis'); return }
  loading.value = true
  try {
    await authService.requestPasswordReset(email.value)
    showSuccess('Si le compte existe, un email a été envoyé')
    setTimeout(() => {
      router.push({ name: 'ResetPassword' })
    }, 4000)
  } catch (e) {
    showError(e?.response?.data?.message || 'Erreur')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto p-6">
    <h2 class="text-xl font-semibold mb-4">Mot de passe oublié</h2>
    <input v-model="email" type="email" placeholder="Votre email" class="w-full p-2 border rounded mb-3" />
    <button @click="submit" :disabled="loading" class="px-4 py-2 bg-blue-600 text-white rounded">
      {{ loading ? 'Envoi...' : "Envoyer le mail de réinitialisation" }}
    </button>
  </div>
</template>