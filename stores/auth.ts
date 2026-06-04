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
  hydrated: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    hydrated: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user?.id,
    isAdmin: (state) => state.user?.rol === 'ADMIN',
    isContador: (state) => state.user?.rol === 'CONTADOR',
  },

  actions: {
    setUser(user: User | null) {
      this.user = user
    },

    async hydrateUserFromApi() {
      if (!import.meta.client) {
        this.hydrated = true
        return false
      }

      try {
        const config = useRuntimeConfig()
        const response: any = await $fetch('/auth/me', {
          baseURL: config.public.apiBase,
          credentials: 'include',
        })

        const payload = apiUnwrap(response) as any
        const usuario = payload?.usuario

        if (!usuario?.id) {
          this.user = null
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
        const status = Number(error?.response?.status ?? error?.statusCode ?? 0)

        if (status !== 401) {
          console.error('Error en hydrateUserFromApi:', {
            message: error?.message,
            status,
            data: error?.response?._data ?? error?.response?.data ?? error?.data,
            url: error?.response?.url,
          })
        }
        this.user = null
        this.hydrated = true
        return false
      }
    },

    async bootstrapSession() {
      return this.hydrateUserFromApi()
    },

    /** Cierra sesión en el servidor (borra cookie HttpOnly) y en el cliente. */
    async logout() {
      if (import.meta.client) {
        try {
          const config = useRuntimeConfig()
          await $fetch('/auth/logout', {
            baseURL: config.public.apiBase,
            method: 'POST',
            credentials: 'include',
          })
        } catch {
          // Limpiar estado aunque falle la red
        }
      }
      this.user = null
      this.hydrated = true
    },
  },
})
