export const formatCurrency = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  const safeNum = Number.isFinite(num) ? num : 0
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeNum)
}

const parseLocalDate = (date: string | Date | null | undefined): Date | null => {
  if (!date) return null
  if (date instanceof Date) return date
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const formatDate = (date: string | Date | null | undefined): string => {
  const parsed = parseLocalDate(date)
  if (!parsed) return '—'
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed)
}

export const formatDateTime = (date: string | Date | null | undefined): string => {
  const parsed = parseLocalDate(date)
  if (!parsed) return '—'
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

export const todayISO = (): string => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
