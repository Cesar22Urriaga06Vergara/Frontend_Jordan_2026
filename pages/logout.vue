<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-gray-800 mb-2">Cerrando sesión...</h1>
      <p class="text-gray-500">Redirigiendo al login...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

onMounted(() => {
  authStore.logout()
  setTimeout(() => {
    navigateTo('/login')
  }, 500)
})
</script>
