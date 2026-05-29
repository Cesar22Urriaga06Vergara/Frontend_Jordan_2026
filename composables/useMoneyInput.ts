/**
 * useMoneyInput - Validación de inputs de moneda (COP)
 * 
 * Validaciones:
 * - step="1" en HTML (solo números enteros, sin decimales)
 * - COP no tiene centavos, solo billetes/monedas enteras
 * - Valores típicos: 2000, 4000, 20000, etc.
 * - Min 0, Max sin límite
 */

export const useMoneyInput = () => {
  /**
   * Convertir a número entero (sin decimales)
   * Ej: 2000.5 → 2000
   * Ej: "4000" → 4000
   */
  const toInteger = (value: number | string): number => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return 0
    return Math.floor(num)
  }

  /**
   * Validar que sea número válido
   * Ej: "-10" → false, "123.45" → true
   */
  const isValidMoney = (value: number | string): boolean => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return !isNaN(num) && num >= 0
  }

  /**
   * Handler para onBlur - Limpia decimales (COP no los necesita)
   * Previene: 2000.5 → 2000
   * Entrada típica: 2000, 4000, 20000, etc.
   */
  const handleMoneyBlur = (event: Event): number => {
    const input = event.target as HTMLInputElement
    const cleaned = toInteger(input.value)
    input.value = cleaned.toString()
    return cleaned
  }

  /**
   * Formato para display (enteros sin decimales)
   * Ej: 20000 → "$20.000" (formato colombiano COP)
   */
  const formatMoneyDisplay = (value: number | string): string => {
    const num = toInteger(value)
    return num.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  return {
    toInteger,
    isValidMoney,
    handleMoneyBlur,
    formatMoneyDisplay,
  }
}
