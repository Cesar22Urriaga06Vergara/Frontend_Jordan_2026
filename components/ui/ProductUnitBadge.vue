<template>
  <span class="inline-flex flex-wrap items-center gap-1.5">
    <span
      v-if="categoria"
      class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
      :class="categoriaBadgeClass(categoria)"
    >
      {{ labelCategoria(categoria) }}
    </span>
    <span
      v-if="unidad"
      class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
      :class="unidadBadgeClass(unidad)"
    >
      {{ labelUnidad(unidad) }}
    </span>
  </span>
</template>

<script setup lang="ts">
import {
  categoriaBadgeClass,
  labelCategoria,
  labelUnidad,
  unidadBadgeClass,
} from '~/utils/producto-labels'

defineProps<{
  categoria?: string | null
  unidad?: string | null
}>()
</script>
