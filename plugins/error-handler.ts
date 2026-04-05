export default defineNuxtPlugin(() => {
  if (process.server) return

  const notify = useNotification()

  window.addEventListener('error', (event) => {
    const message = event?.error?.message || event?.message || 'Error inesperado en cliente'
    console.error('[UI Error]', event)
    notify.error(message)
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason
    const message =
      reason?.message ||
      (typeof reason === 'string' ? reason : 'Promesa rechazada sin manejo')
    console.error('[Unhandled Rejection]', reason)
    notify.error(message)
  })
})
