<template>
  <span
    class="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
    :class="badgeClass"
  >{{ label }}</span>
</template>

<script setup lang="ts">
const props = defineProps<{ estado: string }>()

const MAP: Record<string, { cls: string; label: string }> = {
  PENDIENTE:        { cls: 'bg-yellow-100 text-yellow-700', label: 'Pendiente' },
  CARGADO_EN_RUTA:  { cls: 'bg-blue-100 text-blue-700',    label: 'En ruta' },
  ENTREGADO:        { cls: 'bg-green-100 text-green-700',   label: 'Entregado' },
  NO_ENTREGADO:     { cls: 'bg-orange-100 text-orange-700', label: 'No entregado' },
  REPROGRAMADO:     { cls: 'bg-purple-100 text-purple-700', label: 'Reprogramado' },
  DEVUELTO:         { cls: 'bg-red-100 text-red-600',       label: 'Devuelto' },
  CANCELADO:        { cls: 'bg-gray-100 text-gray-500',     label: 'Cancelado' },
  COMPLETADA:       { cls: 'bg-green-100 text-green-700',   label: 'Completada' },
  PARCIAL:          { cls: 'bg-orange-100 text-orange-700', label: 'Parcial' },
  CREADA:           { cls: 'bg-gray-100 text-gray-600',     label: 'Creada' },
  CARGADA:          { cls: 'bg-blue-50 text-blue-600',      label: 'Cargada' },
  EN_ENTREGA:       { cls: 'bg-blue-100 text-blue-700',     label: 'En entrega' },
  EN_LIQUIDACION:   { cls: 'bg-yellow-100 text-yellow-700', label: 'En liquidación' },
  LIQUIDADA:        { cls: 'bg-green-100 text-green-700',   label: 'Liquidada' },
  ANULADA:          { cls: 'bg-red-100 text-red-600',       label: 'Anulada' },
  ACTIVO:           { cls: 'bg-green-100 text-green-700',   label: 'Activo' },
  PAGADO_PARCIALMENTE: { cls: 'bg-yellow-100 text-yellow-700', label: 'Pagado parcial' },
  PAGADO_COMPLETAMENTE: { cls: 'bg-green-100 text-green-700', label: 'Pagado' },
}

const resolved = computed(() => MAP[props.estado] ?? { cls: 'bg-gray-100 text-gray-500', label: props.estado })
const badgeClass = computed(() => resolved.value.cls)
const label = computed(() => resolved.value.label)
</script>
