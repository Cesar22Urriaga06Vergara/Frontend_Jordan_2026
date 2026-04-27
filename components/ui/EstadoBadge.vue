<template>
  <span
    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all"
    :class="[badgeClass, 'shadow-sm']"
    :title="props.estado"
  >
    <span>{{ icon }}</span>
    <span>{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{ estado: string }>()

const MAP: Record<string, { cls: string; label: string; icon: string }> = {
  PENDIENTE:        { cls: 'bg-yellow-100 text-yellow-800', label: 'Pendiente', icon: '⏳' },
  CARGADO_EN_RUTA:  { cls: 'bg-blue-100 text-blue-800',    label: 'En ruta', icon: '📦' },
  ENTREGADO:        { cls: 'bg-green-100 text-green-800',   label: 'Entregado', icon: '✓' },
  NO_ENTREGADO:     { cls: 'bg-orange-100 text-orange-800', label: 'No entregado', icon: '✗' },
  REPROGRAMADO:     { cls: 'bg-purple-100 text-purple-800', label: 'Reprogramado', icon: '📅' },
  DEVUELTO:         { cls: 'bg-red-100 text-red-800',       label: 'Devuelto', icon: '↩' },
  CANCELADO:        { cls: 'bg-gray-200 text-gray-700',     label: 'Cancelado', icon: '⊘' },
  COMPLETADA:       { cls: 'bg-green-100 text-green-800',   label: 'Completada', icon: '✓' },
  PARCIAL:          { cls: 'bg-orange-100 text-orange-800', label: 'Parcial', icon: '◐' },
  CREADA:           { cls: 'bg-gray-100 text-gray-700',     label: 'Creada', icon: '◯' },
  CARGADA:          { cls: 'bg-blue-100 text-blue-800',      label: 'Cargada', icon: '📥' },
  EN_ENTREGA:       { cls: 'bg-blue-100 text-blue-800',     label: 'En entrega', icon: '🚚' },
  EN_LIQUIDACION:   { cls: 'bg-yellow-100 text-yellow-800', label: 'En liquidación', icon: '⚖' },
  LIQUIDADA:        { cls: 'bg-green-100 text-green-800',   label: 'Liquidada', icon: '✓' },
  ANULADA:          { cls: 'bg-red-100 text-red-800',       label: 'Anulada', icon: '✗' },
}

const resolved = computed(() => MAP[props.estado] ?? { cls: 'bg-gray-100 text-gray-600', label: props.estado, icon: '◯' })
const badgeClass = computed(() => resolved.value.cls)
const label = computed(() => resolved.value.label)
const icon = computed(() => resolved.value.icon)
</script>
