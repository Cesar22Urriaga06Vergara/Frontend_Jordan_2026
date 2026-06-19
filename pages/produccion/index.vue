<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Producción</h1>
        <p class="mt-1 text-sm text-gray-500">Consulta de producción registrada desde Gestión de Planta.</p>
      </div>
      <div class="flex gap-2">
        <input v-model="filtroFecha" type="date" class="form-input w-40" @change="fetchEstado" />
        <button class="btn-secondary inline-flex items-center gap-2" @click="fetchEstado">
          <RefreshCw class="h-4 w-4" />
          Actualizar
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div class="card">
        <p class="text-sm text-gray-500">Estado de jornada</p>
        <p class="mt-1 flex items-center gap-2 font-semibold" :class="estado.abierto ? 'text-green-700' : (estado.apertura ? 'text-gray-600' : 'text-gray-400')">
          <component :is="estado.apertura ? CheckCircle : Minus" class="h-4 w-4" />
          <span>{{ estado.abierto ? 'Abierta' : (estado.apertura ? 'Cerrada' : 'Sin abrir') }}</span>
        </p>
      </div>
      <div class="card">
        <p class="text-sm text-gray-500">Registros</p>
        <p class="mt-1 text-2xl font-bold text-gray-800">{{ produccionHoy.length }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-gray-500">Unidades producidas</p>
        <p class="mt-1 text-2xl font-bold text-gray-800">{{ formatQuantity(totalProducidoHoy) }}</p>
      </div>
    </div>

    <div class="card">
      <div class="mb-4 flex items-center justify-between gap-3">
        <h2 class="font-semibold text-gray-700">Producción del {{ formatDate(filtroFecha) }}</h2>
        <span class="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-500">{{ produccionHoy.length }} registros</span>
      </div>

      <div v-if="loadingEstado" class="py-4 text-center text-sm text-gray-400">Cargando...</div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b text-left text-xs uppercase text-gray-500">
            <th class="pb-2 font-medium">Producto</th>
            <th class="pb-2 text-right font-medium">Cantidad producida</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in produccionHoy" :key="item.id ?? item.productoId" class="border-b border-gray-50">
            <td class="py-2 font-medium text-gray-800">
              <div class="flex items-center gap-2">
                <span>{{ item.producto?.nombre ?? item.productoId }}</span>
                <ProductUnitBadge :categoria="item.producto?.categoria" :unidad="item.producto?.unidad" />
              </div>
            </td>
            <td class="py-2 text-right text-gray-600">{{ formatQuantity(item.cantidad) }}</td>
          </tr>
          <tr v-if="!produccionHoy.length">
            <td colspan="2" class="py-6 text-center text-gray-400">Sin producción registrada</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2 class="mb-4 font-semibold text-gray-700">Historial de cierres recientes</h2>
      <div v-if="loadingHistorial" class="py-4 text-center text-sm text-gray-400">Cargando...</div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b text-left text-xs uppercase text-gray-500">
            <th class="pb-2 font-medium">Fecha</th>
            <th class="pb-2 text-center font-medium">Cierre</th>
            <th class="pb-2 text-right font-medium">Caja contada</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in historial" :key="item.id" class="border-b border-gray-50">
            <td class="py-2 font-medium text-gray-800">{{ formatDate(item.fecha) }}</td>
            <td class="py-2 text-center text-gray-500">
              <component :is="item.cierreCaja ? CheckCircle : Minus" class="mx-auto h-4 w-4" />
            </td>
            <td class="py-2 text-right text-gray-600">{{ formatCurrency(item.cierreCaja?.saldoContado ?? 0) }}</td>
          </tr>
          <tr v-if="!historial.length">
            <td colspan="3" class="py-4 text-center text-gray-400">Sin historial</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle, Minus, RefreshCw } from 'lucide-vue-next'
import { formatCurrency, formatDate, formatQuantity, todayISO } from '~/utils/formats'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const notify = useNotification()
const apiResponse = useApiResponse()

const filtroFecha = ref(todayISO())
const loadingEstado = ref(true)
const loadingHistorial = ref(true)
const estado = ref<any>({ apertura: null, cierre: null })
const produccionHoy = ref<any[]>([])
const historial = ref<any[]>([])

const totalProducidoHoy = computed(() =>
  produccionHoy.value.reduce((sum, item) => sum + Number(item?.cantidad ?? 0), 0),
)

async function fetchEstado() {
  loadingEstado.value = true
  produccionHoy.value = []
  try {
    const res = await api.get('/diario/estado', { params: { fecha: filtroFecha.value } })
    const data = apiResponse.unwrap(res) as any
    estado.value = data
    produccionHoy.value = data.apertura?.producciondiaria ?? []
  } catch {
    notify.error('No se pudo cargar producción')
  } finally {
    loadingEstado.value = false
  }
}

async function fetchHistorial() {
  loadingHistorial.value = true
  try {
    const res = await api.get('/diario/historial', { params: { limit: 10 } })
    historial.value = apiResponse.list(res)
  } catch {
    historial.value = []
  } finally {
    loadingHistorial.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchEstado(), fetchHistorial()])
})
</script>
