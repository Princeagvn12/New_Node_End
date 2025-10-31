<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import authService from '../services/auth.service'
import { showSuccess, showError } from '../utils/toast'

const route = useRoute()
const router = useRouter()
const token = route.query.token || ''
const id = route.query.id || ''

const password = ref('')
const confirm = ref('')
const loading = ref(false)

const submit = async () => {
  if (!password.value || !confirm.value) { showError('Entrez le mot de passe et sa confirmation'); return }
  if (password.value !== confirm.value) { showError('Les mots de passe ne correspondent pas'); return }

  loading.value = true
  try {
    await authService.resetPassword(token, password.value)
    showSuccess('Mot de passe réinitialisé. Vous pouvez vous connecter.')
    router.push({ name: 'Login' })
  } catch (e) {
    showError(e?.response?.data?.message || 'Erreur lors de la réinitialisation')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto p-6">
    <h2 class="text-xl font-semibold mb-4">Réinitialiser le mot de passe</h2>
    <input v-model="password" type="password" placeholder="Nouveau mot de passe" class="w-full p-2 border rounded mb-2" />
    <input v-model="confirm" type="password" placeholder="Confirmer mot de passe" class="w-full p-2 border rounded mb-3" />
    <button @click="submit" :disabled="loading" class="px-4 py-2 bg-blue-600 text-white rounded">
      {{ loading ? 'Traitement...' : "Changer le mot de passe" }}
    </button>
  </div>
</template>