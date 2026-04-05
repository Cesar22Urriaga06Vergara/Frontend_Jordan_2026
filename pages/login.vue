<template>
  <NuxtLayout name="auth">
    <div class="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 rounded-full bg-blue-950 flex items-center justify-center mx-auto mb-3">
          <span class="text-3xl font-bold text-cyan-400">J</span>
        </div>
        <h1 class="text-2xl font-bold text-blue-950">JORDAN</h1>
        <p class="text-gray-500 text-sm mt-1">Purificadora de Agua</p>
      </div>

      <!-- Form -->
      <form class="space-y-4" @submit.prevent="handleLogin">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            v-model="form.email"
            type="email"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="admin@jordan.com"
            required
            autocomplete="email"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <input
            v-model="form.password"
            type="password"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="••••••••"
            required
            autocomplete="current-password"
          />
        </div>

        <div v-if="error" class="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
          {{ error }}
        </div>

        <button
          type="submit"
          class="w-full bg-blue-950 hover:bg-blue-800 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
          :disabled="loading"
        >
          {{ loading ? 'Iniciando...' : 'Iniciar sesión' }}
        </button>
      </form>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const authStore = useAuthStore()
const api = useApi()
const apiResponse = useApiResponse()
const router = useRouter()

const form = reactive({ email: '', password: '' })
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.post('/auth/login', form)
    const payload = apiResponse.unwrap(res) as any
    authStore.setToken(payload.access_token)
    authStore.setUser(payload.usuario)
    await router.push('/')
  } catch (e: any) {
    error.value = apiResponse.errorMessage(e)
  } finally {
    loading.value = false
  }
}
</script>
