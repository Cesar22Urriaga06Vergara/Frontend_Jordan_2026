<template>
  <div class="p-6 space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <h1 class="text-2xl font-bold text-gray-800">Inventario</h1>
      <div class="flex gap-2">
        <input v-model="filtroFecha" type="date" class="form-input w-40" @change="fetchEstado" />
        <button class="btn-secondary" @click="fetchEstado">Actualizar</button>
      </div>
    </div>

    <!-- Info -->
    <div class="card bg-blue-50 border border-blue-100 text-sm text-blue-700">
      El inventario se actualiza automáticamente al registrar producción, despachar pedidos y cerrar el día.
      Usa <NuxtLink to="/diario" class="underline font-medium">Flujo Diario</NuxtLink> para registrar la producción del día.
    </div>

    <!-- Estado apertura inventario -->
    <div class="card">
      <h2 class="font-semibold text-gray-700 mb-4">
        Inventario inicial — {{ filtroFecha }}
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
      <div v-else-if="!loadingEstado" class="text-gray-400 text-sm text-center py-4">
        Sin inventario inicial registrado para esta fecha.
        <br />
        <NuxtLink to="/diario" class="text-blue-600 underline mt-1 inline-block">Abrir día →</NuxtLink>
      </div>
    </div>

    <!-- Producción del día -->
    <div class="card" v-if="produccion.length || !loadingEstado">
      <h2 class="font-semibold text-gray-700 mb-4">Producción registrada</h2>
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
            <td colspan="2" class="py-4 text-center text-gray-400">Sin producción registrada</td>
          </tr>
        </tbody>
      </table>

      <div class="mt-4">
        <NuxtLink to="/diario" class="text-sm text-blue-600 hover:underline">
          + Registrar producción →
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
import { todayISO } from '~/utils/formats'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const apiResponse = useApiResponse()
const notify = useNotification()

const filtroFecha = ref(todayISO())
const loadingEstado = ref(true)

const inventarioInicial = ref<any[]>([])
const produccion = ref<any[]>([])
const cierreInventario = ref<any[]>([])

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
