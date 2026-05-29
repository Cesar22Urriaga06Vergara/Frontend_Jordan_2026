/**
 * Script de limpieza para limpiar datos corruptos del localStorage
 * DEPRECATED: El modelo actual usa cookies HttpOnly. Este código es legacy.
 */

export const cleanupLocalStorage = () => {
  console.log('🧹 Limpiando localStorage (legacy tokens)...')
  try {
    localStorage.removeItem('jordan_token')
    localStorage.removeItem('auth')
    console.log('✅ localStorage limpio. La app usa cookies HttpOnly ahora.')
  } catch (e) {
    console.error('Error limpiando localStorage:', e)
  }
}

// Exportar para uso en consola o debug
if (typeof window !== 'undefined') {
  ;(window as any).cleanupJordan = cleanupLocalStorage
}
