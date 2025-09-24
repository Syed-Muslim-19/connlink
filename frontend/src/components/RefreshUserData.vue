<template>
  <button
    @click="refreshUserData"
    class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
    :disabled="loading"
  >
    {{ loading ? 'Refreshing...' : 'Refresh Profile' }}
  </button>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import api from '../utils/api.js'

const authStore = useAuthStore()
const loading = ref(false)

const refreshUserData = async () => {
  try {
    loading.value = true
    console.log('🔄 Refreshing user data...')

    const response = await api.get('/dev/refresh-user')

    if (response.data.success) {
      // Update auth store with fresh user data
      authStore.currentUser = response.data.user
      authStore.user = response.data.user

      // Update localStorage
      localStorage.setItem('user', JSON.stringify(response.data.user))
      sessionStorage.setItem('user', JSON.stringify(response.data.user))

      console.log('✅ User data refreshed:', response.data.user)
      console.log('🔍 Verified status:', response.data.user.isVerified)

      // Force page refresh to update all components
      window.location.reload()
    }
  } catch (error) {
    console.error('❌ Failed to refresh user data:', error)
  } finally {
    loading.value = false
  }
}
</script>