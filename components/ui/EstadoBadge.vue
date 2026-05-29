<template>
  <span
    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all"
    :class="[badgeClass, 'shadow-sm']"
    :title="props.estado"
  >
    <component :is="icon" class="h-3.5 w-3.5" />
    <span>{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  CircleSlash,
  Circle,
  Clock,
  PackageCheck,
  Package,
  PercentCircle,
  RotateCcw,
  Scale,
  Slash,
  Truck,
  XCircle,
} from 'lucide-vue-next'

const props = defineProps<{ estado: string }>()

const MAP: Record<string, { cls: string; label: string; icon: any }> = {
  PENDIENTE:        { cls: 'bg-yellow-100 text-yellow-800', label: 'Pendiente', icon: Clock },
  CARGADO_EN_RUTA:  { cls: 'bg-blue-100 text-blue-800',    label: 'En ruta', icon: Truck },
  ENTREGADO:        { cls: 'bg-green-100 text-green-800',   label: 'Entregado', icon: CheckCircle },
  NO_ENTREGADO:     { cls: 'bg-orange-100 text-orange-800', label: 'No entregado', icon: CircleSlash },
  REPROGRAMADO:     { cls: 'bg-purple-100 text-purple-800', label: 'Reprogramado', icon: CalendarDays },
  DEVUELTO:         { cls: 'bg-red-100 text-red-800',       label: 'Devuelto', icon: RotateCcw },
  CANCELADO:        { cls: 'bg-gray-200 text-gray-700',     label: 'Cancelado', icon: Slash },
  COMPLETADA:       { cls: 'bg-green-100 text-green-800',   label: 'Completada', icon: CheckCircle },
  PARCIAL:          { cls: 'bg-orange-100 text-orange-800', label: 'Parcial', icon: PercentCircle },
  CREADA:           { cls: 'bg-gray-100 text-gray-700',     label: 'Creada', icon: Circle },
  CARGADA:          { cls: 'bg-blue-100 text-blue-800',      label: 'Cargada', icon: PackageCheck },
  EN_ENTREGA:       { cls: 'bg-blue-100 text-blue-800',     label: 'En entrega', icon: Truck },
  EN_LIQUIDACION:   { cls: 'bg-yellow-100 text-yellow-800', label: 'En liquidación', icon: Scale },
  LIQUIDADA:        { cls: 'bg-green-100 text-green-800',   label: 'Liquidada', icon: CheckCircle },
  ANULADA:          { cls: 'bg-red-100 text-red-800',       label: 'Anulada', icon: XCircle },
}

const resolved = computed(() => MAP[props.estado] ?? { cls: 'bg-gray-100 text-gray-600', label: props.estado, icon: Circle })
const badgeClass = computed(() => resolved.value.cls)
const label = computed(() => resolved.value.label)
const icon = computed(() => resolved.value.icon)
</script>
