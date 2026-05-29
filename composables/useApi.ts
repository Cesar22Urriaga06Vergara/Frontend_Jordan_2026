import axios from 'axios'
import { useAuthStore } from '~/stores/auth'
import { apiErrorMessage } from '~/composables/useApiResponse'

export const useApi = () => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  const notify = useNotification()

  const api = axios.create({
    baseURL: config.public.apiBase,
    timeout: 15000,
    withCredentials: true,
  })

  api.interceptors.response.use(
    (res) => res,
    (error) => {
      const status = Number(error?.response?.status ?? 0)

      if (status === 401) {
        notify.warning('Sesion expirada o invalida. Inicia sesion nuevamente.')
        authStore.logout()
        navigateTo('/auth')
        return Promise.reject(error)
      }

      if (status === 403) {
        notify.error(apiErrorMessage(error))
        return Promise.reject(error)
      }

      if (status >= 500 || status === 0) {
        notify.error(apiErrorMessage(error))
      }

      return Promise.reject(error)
    },
  )

  return api
}
