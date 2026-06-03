<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <h1 class="text-2xl font-bold text-gray-800">Inventario</h1>
      <div class="flex gap-2">
        <input v-model="filtroFecha" type="date" class="form-input w-40" @change="fetchEstado" />
        <button class="btn-secondary inline-flex items-center gap-2" @click="fetchEstado">
          <RefreshCw class="h-4 w-4" />
          Actualizar
        </button>
      </div>
    </div>

    <!-- Info -->
    <div class="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 flex items-start gap-3">
      <Boxes class="h-5 w-5 mt-0.5 text-blue-600" />
      <p>
        El inventario se mueve con producción, despachos y cierre del día. Usa
        <NuxtLink to="/operaciones/diario" class="underline font-semibold">Gestión de Planta</NuxtLink>
        para abrir el día o registrar producción.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="card">
        <p class="text-sm text-gray-500">Productos iniciales</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ inventarioInicial.length }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-gray-500">Producción registrada</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ totalProducido }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-gray-500">Cierre inventario</p>
        <p class="text-2xl font-bold mt-1" :class="cierreInventario.length ? 'text-green-700' : 'text-gray-400'">
          {{ cierreInventario.length ? 'Registrado' : 'Pendiente' }}
        </p>
      </div>
    </div>

    <!-- Estado apertura inventario -->
    <div class="card">
      <h2 class="font-semibold text-gray-700 mb-4">
        Inventario inicial — {{ formatDate(filtroFecha) }}
        <span v-if="loadingEstado" class="text-gray-400 font-normal text-sm ml-2">Cargando…</span>
      </h2>

      <div v-if="inventarioInicial.length">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 border-b text-xs uppercase">
              <th class="pb-2 font-medium">Producto</th>
              <th class="pb-2 font-medium text-right">Cant. inicial</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in inventarioInicial"
              :key="item.productoId ?? item.id"
              class="border-b border-gray-50"
            >
              <td class="py-2 font-medium text-gray-800">{{ item.producto?.nombre ?? item.productoId }}</td>
              <td class="py-2 text-right text-gray-600">{{ item.cantidadInicial }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else-if="!loadingEstado" class="rounded-lg border border-dashed border-gray-200 bg-gray-50 text-center py-8 px-4">
        <Boxes class="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p class="font-medium text-gray-700">Sin inventario inicial registrado</p>
        <p class="text-sm text-gray-500 mt-1">Abre el día para cargar el saldo inicial y los productos disponibles.</p>
        <NuxtLink to="/operaciones/diario" class="btn-primary inline-flex items-center gap-2 mt-4">
          <CalendarDays class="h-4 w-4" />
          Abrir día
        </NuxtLink>
      </div>
    </div>

    <!-- Producción del día -->
    <div class="card" v-if="produccion.length || !loadingEstado">
      <div class="flex items-center justify-between gap-3 mb-4">
        <h2 class="font-semibold text-gray-700">Producción registrada</h2>
        <span class="text-xs font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-1">{{ totalProducido }} unidades</span>
      </div>
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b text-xs uppercase">
            <th class="pb-2 font-medium">Producto</th>
            <th class="pb-2 font-medium text-right">Producido</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in produccion"
            :key="p.productoId ?? p.id"
            class="border-b border-gray-50"
          >
            <td class="py-2 font-medium text-gray-800">{{ p.producto?.nombre ?? p.productoId }}</td>
            <td class="py-2 text-right text-gray-600">{{ p.cantidad }}</td>
          </tr>
          <tr v-if="!produccion.length">
            <td colspan="2" class="py-6 text-center text-gray-400">Sin producción registrada</td>
          </tr>
        </tbody>
      </table>

      <div class="mt-4">
        <NuxtLink to="/operaciones/diario" class="btn-secondary inline-flex items-center gap-2">
          <Plus class="h-4 w-4" />
          <span>Registrar producción</span>
          <ChevronRight class="h-4 w-4" />
        </NuxtLink>
      </div>
    </div>

    <!-- Cierre inventario -->
    <div class="card" v-if="cierreInventario.length">
      <h2 class="font-semibold text-gray-700 mb-4">Inventario de cierre</h2>
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b text-xs uppercase">
            <th class="pb-2 font-medium">Producto</th>
            <th class="pb-2 font-medium text-right">Esperado</th>
            <th class="pb-2 font-medium text-right">Real</th>
            <th class="pb-2 font-medium text-right">Diferencia</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in cierreInventario"
            :key="item.productoId ?? item.id"
            class="border-b border-gray-50"
          >
            <td class="py-2 font-medium text-gray-800">{{ item.producto?.nombre ?? item.productoId }}</td>
            <td class="py-2 text-right text-gray-600">{{ item.cantidadEsperada ?? '—' }}</td>
            <td class="py-2 text-right text-gray-600">{{ item.cantidadContada ?? '—' }}</td>
            <td class="py-2 text-right font-medium"
              :class="(item.diferencia ?? 0) < 0 ? 'text-red-600' : (item.diferencia ?? 0) > 0 ? 'text-green-600' : 'text-gray-400'"
            >
              {{ item.diferencia !== undefined ? (item.diferencia > 0 ? '+' : '') + item.diferencia : '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Boxes, CalendarDays, ChevronRight, Plus, RefreshCw } from 'lucide-vue-next'
import { formatDate, todayISO } from '~/utils/formats'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const apiResponse = useApiResponse()
const notify = useNotification()

const filtroFecha = ref(todayISO())
const loadingEstado = ref(true)

const inventarioInicial = ref<any[]>([])
const produccion = ref<any[]>([])
const cierreInventario = ref<any[]>([])

const totalProducido = computed(() =>
  produccion.value.reduce((sum, item) => sum + Number(item?.cantidad ?? 0), 0),
)

async function fetchEstado() {
  loadingEstado.value = true
  inventarioInicial.value = []
  produccion.value = []
  cierreInventario.value = []
  try {
    const [estadoRes, historialRes] = await Promise.allSettled([
      api.get(`/diario/estado?fecha=${filtroFecha.value}`),
      api.get('/diario/historial', { params: { limit: 30 } }),
    ])

    if (estadoRes.status === 'fulfilled') {
      const d = apiResponse.unwrap(estadoRes.value) as any
      inventarioInicial.value = d.apertura?.inventariosInicial ?? []
      produccion.value = d.apertura?.producciondiaria ?? []
      cierreInventario.value = d.cierre?.cierreInventario ?? []
    } else {
      notify.error('No se pudo cargar el estado de inventario')
    }
  } catch {
    notify.error('No se pudo cargar el estado de inventario')
  } finally {
    loadingEstado.value = false
  }
}

onMounted(fetchEstado)
</script>
