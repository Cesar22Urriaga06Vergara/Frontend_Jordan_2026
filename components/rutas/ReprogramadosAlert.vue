<template>
  <section
    v-if="alert.tienePendientes.value"
    class="rounded-lg border border-purple-200 bg-purple-50 p-4"
  >
    <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div class="flex items-start gap-3">
        <AlertCircle class="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-700" />
        <div>
          <p class="text-sm font-semibold text-purple-900">Pedidos reprogramados pendientes</p>
          <p class="mt-1 text-sm text-purple-800">
            {{ alert.mensajeAlerta.value }}
          </p>
          <ul v-if="alert.pedidos.value.length" class="mt-2 space-y-1 text-xs text-purple-700">
            <li v-for="p in alert.pedidos.value.slice(0, 5)" :key="p.id">
              {{ p.numero }}
              <span v-if="p.clienteNombre"> · {{ p.clienteNombre }}</span>
              <span v-if="p.fechaReprogramacion"> · {{ p.fechaReprogramacion }}</span>
            </li>
            <li v-if="alert.pedidos.value.length > 5" class="text-purple-600">
              +{{ alert.pedidos.value.length - 5 }} más
            </li>
          </ul>
        </div>
      </div>
      <NuxtLink
        to="/pedidos?estado=REPROGRAMADO"
        class="btn-secondary inline-flex items-center justify-center gap-2 text-sm whitespace-nowrap"
      >
        Ver pedidos
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next'
import { useReprogramadosPendientes } from '~/composables/useReprogramadosPendientes'

const alert = useReprogramadosPendientes()

onMounted(() => {
  alert.cargar()
})
</script>
