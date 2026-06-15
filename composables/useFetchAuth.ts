import { useAuthStore } from '~/stores/auth'

let isRefreshing = false
let refreshSubscribers: Array<(ok: boolean) => void> = []

function subscribeRefresh(cb: (ok: boolean) => void) {
  refreshSubscribers.push(cb)
}

function notifySubscribers(ok: boolean) {
  refreshSubscribers.forEach((cb) => cb(ok))
  refreshSubscribers = []
}

export async function fetchWithAuth<T = any>(request: string, options: any = {}) {
  const authStore = useAuthStore()
  const config = useRuntimeConfig()

  const token = authStore.token ?? null
  const headers = {
    ...(options?.headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  try {
    const res = await $fetch(request, {
      baseURL: config.public.apiBase,
      credentials: 'include',
      headers,
      ...options,
    })
    return res as T
  } catch (err: any) {
    const status = Number(err?.response?.status ?? err?.status ?? 0)
    if (status !== 401) throw err

    // 401: try refresh
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeRefresh((ok) => {
          if (!ok) return reject(err)
          // retry
          $fetch(request, { baseURL: config.public.apiBase, credentials: 'include', ...options })
            .then((r) => resolve(r))
            .catch((e) => reject(e))
        })
      })
    }

    isRefreshing = true
    try {
      const refresh = await $fetch('/auth/refresh', { baseURL: config.public.apiBase, method: 'POST', credentials: 'include' })
      const newToken = (refresh as any)?.token ?? null
      if (newToken && (authStore as any).setToken) {
        ;(authStore as any).setToken(newToken)
      }
      notifySubscribers(true)
      return await $fetch(request, {
        baseURL: config.public.apiBase,
        credentials: 'include',
        headers,
        ...options,
      })
    } catch (refreshErr) {
      notifySubscribers(false)
      // force logout
      try { await (authStore as any).logout() } catch (_) {}
      throw refreshErr
    } finally {
      isRefreshing = false
    }
  }
}
