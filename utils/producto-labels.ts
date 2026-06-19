export const CATEGORIAS_PRODUCTO = [
  { value: 'PACA', label: 'Paca' },
  { value: 'BOTELLON', label: 'Botellón' },
  { value: 'GRANEL', label: 'Granel' },
  { value: 'RECARGA', label: 'Recarga' },
  { value: 'OTRO', label: 'Otro' },
] as const

export const UNIDADES_PRODUCTO = [
  { value: 'UNIDAD', label: 'Unidad' },
  { value: 'LITRO', label: 'Litro' },
  { value: 'PACA', label: 'Paca' },
  { value: 'BOTELLON', label: 'Botellón' },
] as const

export function labelCategoria(categoria?: string | null): string {
  return CATEGORIAS_PRODUCTO.find((c) => c.value === categoria)?.label ?? categoria ?? '—'
}

export function labelUnidad(unidad?: string | null): string {
  return UNIDADES_PRODUCTO.find((u) => u.value === unidad)?.label ?? unidad ?? '—'
}

export function categoriaBadgeClass(categoria?: string | null): string {
  const classes: Record<string, string> = {
    PACA: 'bg-amber-100 text-amber-800',
    BOTELLON: 'bg-blue-100 text-blue-800',
    GRANEL: 'bg-cyan-100 text-cyan-800',
    RECARGA: 'bg-purple-100 text-purple-800',
    OTRO: 'bg-gray-100 text-gray-600',
  }
  return classes[String(categoria ?? 'OTRO')] ?? classes.OTRO
}

export function formatProductoConMeta(
  producto?: { nombre?: string | null; categoria?: string | null; unidad?: string | null } | null,
  fallbackId?: number | string | null,
): string {
  const nombre = producto?.nombre ?? (fallbackId != null ? `Producto ${fallbackId}` : '—')
  const meta = [
    producto?.categoria ? labelCategoria(producto.categoria) : null,
    producto?.unidad ? labelUnidad(producto.unidad) : null,
  ].filter(Boolean).join(' · ')
  return meta ? `${nombre} (${meta})` : nombre
}

export function unidadBadgeClass(unidad?: string | null): string {
  const classes: Record<string, string> = {
    UNIDAD: 'bg-slate-100 text-slate-700',
    LITRO: 'bg-teal-100 text-teal-800',
    PACA: 'bg-amber-50 text-amber-700',
    BOTELLON: 'bg-blue-50 text-blue-700',
  }
  return classes[String(unidad ?? 'UNIDAD')] ?? classes.UNIDAD
}
