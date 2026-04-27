import { defineStore } from 'pinia'
import { apiUnwrap } from '~/composables/useApiResponse'

interface User {
  id: number
  email: string
  nombre: string
  rol: string
}

interface AuthState {
  user: User | null
  token: string | null
  hydrated: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    hydrated: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.rol === 'ADMIN',
  },

  actions: {
    setToken(token: string) {
      this.token = token
      if (import.meta.client) {
        localStorage.setItem('jordan_token', token)
      }
    },

    setUser(user: User) {
      this.user = user
    },

    loadFromStorage() {
      if (import.meta.client) {
        const token = localStorage.getItem('jordan_token')
        if (token) {
          this.token = token
        }
      }
    },

    async hydrateUserFromApi() {
      if (!this.token) {
        this.user = null
        this.hydrated = true
        return false
      }

      try {
        const config = useRuntimeConfig()
        const response: any = await $fetch('/auth/me', {
          baseURL: config.public.apiBase,
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        })

        const payload = apiUnwrap(response) as any
        const usuario = payload?.usuario

        if (!usuario?.id) {
          this.logout()
          this.hydrated = true
          return false
        }

        this.user = {
          id: usuario.id,
          nombre: usuario.nombre ?? '',
          email: usuario.email,
          rol: usuario.rol,
        }
        this.hydrated = true
        return true
      } catch (error: any) {
        console.error('Error en hydrateUserFromApi:', {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data,
          url: error?.response?.url,
        })
        this.logout()
        this.hydrated = true
        return false
      }
    },

    async bootstrapSession() {
      this.loadFromStorage()

      if (!this.token) {
        this.user = null
        this.hydrated = true
        return false
      }

      if (this.user?.id) {
        this.hydrated = true
        return true
      }

      return this.hydrateUserFromApi()
    },

    logout() {
      this.token = null
      this.user = null
      this.hydrated = true
      if (import.meta.client) {
        localStorage.removeItem('jordan_token')
      }
    },
  },
})
