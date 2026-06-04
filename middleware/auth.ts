import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  const loginPath = '/auth'

  if (!authStore.hydrated) {
    await authStore.bootstrapSession()
  }

  if (!authStore.isAuthenticated && to.path !== loginPath) {
    return navigateTo(loginPath)
  }

  if (authStore.isAuthenticated && to.path === loginPath) {
    return navigateTo(authStore.isContador ? '/reportes' : '/')
  }

  if (
    authStore.isAuthenticated &&
    authStore.isContador &&
    to.path !== '/reportes'
  ) {
    return navigateTo('/reportes')
  }
})
