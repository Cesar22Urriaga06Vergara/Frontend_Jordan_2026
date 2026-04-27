<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold mb-2">📊 Monitoring & Métricas</h1>
        <p class="text-slate-400">Sistema en tiempo real | Actualizado: {{ lastUpdate }}</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="text-slate-400">Cargando métricas...</div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-200">
        {{ error }}
      </div>

      <!-- Content -->
      <div v-else>
        <!-- Health Status -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div class="text-slate-400 text-sm mb-2">Estado del Sistema</div>
            <div class="flex items-center gap-3">
              <div :class="['w-4 h-4 rounded-full', statusColor]"></div>
              <span class="text-2xl font-bold">{{ metrics.health?.status || 'Unknown' }}</span>
            </div>
            <div class="text-slate-400 text-sm mt-2">Uptime: {{ formatUptime(metrics.health?.uptime || 0) }}</div>
          </div>

          <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div class="text-slate-400 text-sm mb-2">Tasa de Error</div>
            <div class="text-2xl font-bold" :class="metrics.system?.errorRate > 5 ? 'text-red-400' : 'text-green-400'">
              {{ metrics.system?.errorRate || 0 }}%
            </div>
            <div class="text-slate-400 text-sm mt-2">{{ metrics.system?.requestsError || 0 }} errores</div>
          </div>

          <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div class="text-slate-400 text-sm mb-2">Tiempo Promedio Respuesta</div>
            <div class="text-2xl font-bold text-blue-400">{{ metrics.system?.avgResponseTime || 0 }}ms</div>
            <div class="text-slate-400 text-sm mt-2">{{ metrics.system?.requestsSuccess || 0 }} exitosas</div>
          </div>
        </div>

        <!-- Request Stats -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h2 class="text-xl font-bold mb-4">📈 Estadísticas de Requests</h2>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-slate-400">Total Requests:</span>
                <span class="font-bold">{{ metrics.system?.requestsTotal || 0 }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Exitosas:</span>
                <span class="font-bold text-green-400">{{ metrics.system?.requestsSuccess || 0 }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Fallidas:</span>
                <span class="font-bold text-red-400">{{ metrics.system?.requestsError || 0 }}</span>
              </div>
              <div class="h-2 bg-slate-700 rounded mt-4">
                <div 
                  class="h-full bg-gradient-to-r from-green-500 to-green-600 rounded"
                  :style="{ width: `${successRate}%` }"
                ></div>
              </div>
            </div>
          </div>

          <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h2 class="text-xl font-bold mb-4">🕐 Cambios (últimos 30 días)</h2>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-slate-400">Total Cambios:</span>
                <span class="font-bold">{{ metrics.audit?.cambiosTotal || 0 }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Actividades:</span>
                <span class="font-bold">{{ metrics.audit?.actividadesTotal || 0 }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Operations -->
        <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-8">
          <h2 class="text-xl font-bold mb-4">🔥 Top 10 Operaciones</h2>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-slate-700/50">
                <tr>
                  <th class="px-4 py-2 text-left text-slate-400">Operación</th>
                  <th class="px-4 py-2 text-right text-slate-400">Llamadas</th>
                  <th class="px-4 py-2 text-right text-slate-400">Promedio (ms)</th>
                  <th class="px-4 py-2 text-right text-slate-400">Min/Max</th>
                  <th class="px-4 py-2 text-right text-slate-400">Error Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="op in metrics.system?.topOperations" :key="op.operation" class="border-t border-slate-700 hover:bg-slate-700/30">
                  <td class="px-4 py-2 text-slate-300 font-mono text-sm">{{ op.operation }}</td>
                  <td class="px-4 py-2 text-right">{{ op.count }}</td>
                  <td class="px-4 py-2 text-right">{{ Math.round(op.avgDuration) }}</td>
                  <td class="px-4 py-2 text-right text-slate-400">{{ op.minDuration }}/{{ op.maxDuration }}</td>
                  <td class="px-4 py-2 text-right" :class="op.errorRate > 0 ? 'text-red-400' : 'text-green-400'">
                    {{ op.errorRate.toFixed(1) }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Top Errors -->
        <div v-if="metrics.system?.topErrors?.length > 0" class="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h2 class="text-xl font-bold mb-4">⚠️ Errores Más Frecuentes</h2>
          <div class="space-y-2">
            <div v-for="err in metrics.system?.topErrors" :key="err.error" class="flex justify-between items-center p-3 bg-red-500/10 rounded">
              <span class="text-slate-300">{{ err.error }}</span>
              <span class="bg-red-500/30 text-red-200 px-3 py-1 rounded-full text-sm">{{ err.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useApi } from '~/composables/useApi'

const { get } = useApi()

const loading = ref(true)
const error = ref<string | null>(null)
const lastUpdate = ref('')
const metrics = ref<any>({})

const statusColor = computed(() => {
  const status = metrics.value.health?.status
  if (status === 'healthy') return 'bg-green-500'
  if (status === 'degraded') return 'bg-yellow-500'
  return 'bg-red-500'
})

const successRate = computed(() => {
  const total = metrics.value.system?.requestsTotal || 0
  const success = metrics.value.system?.requestsSuccess || 0
  return total > 0 ? (success / total) * 100 : 0
})

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m`
  return `${seconds}s`
}

async function loadMetrics() {
  try {
    loading.value = true
    error.value = null

    const response = await get('/monitoring/metrics/dashboard')
    metrics.value = response.data

    lastUpdate.value = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch (err: any) {
    error.value = err.message || 'Error al cargar métricas'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMetrics()
  // Recargar cada 30 segundos
  setInterval(loadMetrics, 30000)
})
</script>
