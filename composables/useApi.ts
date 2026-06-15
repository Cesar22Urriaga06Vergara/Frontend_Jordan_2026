import axios, { type AxiosRequestConfig } from 'axios'
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
  // Refresh token handling with request queue
  let isRefreshing = false
  let refreshSubscribers: Array<(token: string | null) => void> = []

  function subscribeTokenRefresh(cb: (token: string | null) => void) {
    refreshSubscribers.push(cb)
  }

  function onRefreshed(token: string | null) {
    refreshSubscribers.forEach((cb) => cb(token))
    refreshSubscribers = []
  }

  api.interceptors.response.use(
    (res) => res,
    async (error: any) => {
      const isCanceled = error?.code === 'ERR_CANCELED' || error?.message === 'canceled' || error?.name === 'CanceledError'
      if (isCanceled) {
        // do not notify on user/caller-triggered cancellations
        return Promise.reject(error)
      }

      const status = Number(error?.response?.status ?? error?.status ?? 0)

      if (status === 401) {
        const originalRequest: AxiosRequestConfig & { _retry?: boolean } = error.config || {}
        if (originalRequest._retry) {
          // Already retried, force logout
          notify.warning('Sesion expirada o invalida. Inicia sesion nuevamente.')
          authStore.logout()
          navigateTo('/auth')
          return Promise.reject(error)
        }

        // Queue requests while refreshing
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            subscribeTokenRefresh((token) => {
              if (token) {
                // retry original request
                resolve(api({ ...originalRequest, headers: originalRequest.headers }))
              } else {
                reject(error)
              }
            })
          })
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          // Attempt refresh. Assumes refresh endpoint uses HttpOnly cookie.
          const refreshResp = await api.post('/auth/refresh', {}, { withCredentials: true })
          // If backend returns user data or token, hydrate store accordingly
          // Prefer cookie-based sessions; if token returned, set it in store
          const newToken = refreshResp?.data?.token ?? null
          if (newToken && (authStore as any).setToken) {
            ;(authStore as any).setToken(newToken)
          }
          onRefreshed(newToken)
          return api(originalRequest)
        } catch (refreshError) {
          onRefreshed(null)
          notify.warning('Sesion expirada o invalida. Inicia sesion nuevamente.')
          try {
            authStore.logout()
          } catch (e) {
            // ignore
          }
          navigateTo('/auth')
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
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

  // Attach auth token on requests when available
  api.interceptors.request.use((config) => {
    const token = authStore?.token
    if (token && config && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  return api
}
