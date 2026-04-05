/**
 * Script de limpieza para limpiar datos corruptos del localStorage
 * Ejecutar en la consola del navegador cuando sea necesario
 */

export const cleanupLocalStorage = () => {
  console.log('🧹 Limpiando localStorage...')
  localStorage.removeItem('jordan_token')
  localStorage.removeItem('auth')
  console.log('✅ localStorage limpio. Recarga la página y vuelve a hacer login.')
}

// Exportar para uso en consola
if (typeof window !== 'undefined') {
  ;(window as any).cleanupJordan = cleanupLocalStorage
}
