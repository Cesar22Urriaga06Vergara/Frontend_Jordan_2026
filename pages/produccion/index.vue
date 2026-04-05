<template>
  <div class="p-6 space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <h1 class="text-2xl font-bold text-gray-800">Producción</h1>
      <div class="flex gap-2">
        <input v-model="filtroFecha" type="date" class="form-input w-40" @change="fetchEstado" />
        <button class="btn-secondary" @click="fetchEstado">Actualizar</button>
      </div>
    </div>

    <!-- Info -->
    <div class="card bg-blue-50 border border-blue-100 text-sm text-blue-700">
      La producción forma parte del flujo diario. Para registrarla debes tener el día abierto.
      También puedes gestionarlo desde <NuxtLink to="/diario" class="underline font-medium">Flujo Diario</NuxtLink>.
    </div>

    <!-- Estado del día -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="card flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">Apertura</p>
          <p class="font-semibold" :class="estado.abierto ? 'text-green-700' : (estado.apertura ? 'text-gray-600' : 'text-gray-400')">
            {{ estado.abierto ? '✓ Jornada abierta' : (estado.apertura ? '✓ Jornada cerrada' : '— Sin abrir') }}
          </p>
          <p v-if="estado.apertura?.createdAt" class="text-xs text-gray-400 mt-1">
            Abierto: {{ formatDateTime(estado.apertura.createdAt) }}
          </p>
          <p v-if="estado.cierre?.createdAt" class="text-xs text-gray-400 mt-1">
            Cerrado: {{ formatDateTime(estado.cierre.createdAt) }}
          </p>
        </div>
        <span v-if="!estado.apertura">
          <NuxtLink to="/diario" class="btn-primary text-xs">Abrir día →</NuxtLink>
        </span>
      </div>
      <div class="card">
        <p class="text-sm text-gray-500">Registros de producción hoy</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ produccionHoy.length }}</p>
      </div>
    </div>

    <!-- Registrar producción rápida -->
    <div class="card space-y-4 max-w-lg" v-if="estado.apertura && !estado.cierre">
      <h2 class="font-semibold text-gray-700">Registrar producción rápida</h2>

      <FormField label="Producto *">
        <select v-model="prodForm.productoId" class="form-input">
          <option :value="undefined">Seleccionar…</option>
          <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
        </select>
      </FormField>
      <FormField label="Cantidad producida *">
        <input v-model.number="prodForm.cantidadProducida" class="form-input" type="number" min="1" />
      </FormField>

      <button
        class="btn-primary"
        :disabled="saving || !prodForm.productoId || !prodForm.cantidadProducida"
        @click="registrarProduccion"
      >{{ saving ? 'Guardando…' : 'Registrar' }}</button>
    </div>

    <div
      class="card text-center py-6"
      v-else-if="!estado.apertura"
    >
      <p class="text-gray-500 mb-3">El día no está abierto. No se puede registrar producción.</p>
      <NuxtLink to="/diario" class="btn-primary inline-flex items-center gap-2">📅 Ir a Flujo Diario</NuxtLink>
    </div>

    <div class="card text-center py-4 text-gray-400 text-sm" v-else-if="estado.cierre">
      El día está cerrado. No se puede registrar más producción.
    </div>

    <!-- Producción del día -->
    <div class="card">
      <h2 class="font-semibold text-gray-700 mb-4">Producción registrada — {{ filtroFecha }}</h2>
      <div v-if="loadingEstado" class="text-gray-400 text-sm text-center py-4">Cargando…</div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b text-xs uppercase">
            <th class="pb-2 font-medium">Producto</th>
            <th class="pb-2 font-medium text-right">Cant. producida</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in produccionHoy"
            :key="p.productoId ?? p.id"
            class="border-b border-gray-50"
          >
            <td class="py-2 font-medium text-gray-800">{{ p.producto?.nombre ?? p.productoId }}</td>
            <td class="py-2 text-right text-gray-600">{{ p.cantidad }}</td>
          </tr>
          <tr v-if="!produccionHoy.length">
            <td colspan="2" class="py-4 text-center text-gray-400">Sin producción registrada</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Historial últimos días -->
    <div class="card">
      <h2 class="font-semibold text-gray-700 mb-4">Historial de cierres recientes</h2>
      <div v-if="loadingHistorial" class="text-gray-400 text-sm text-center py-4">Cargando…</div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b text-xs uppercase">
            <th class="pb-2 font-medium">Fecha</th>
            <th class="pb-2 font-medium">Apertura</th>
            <th class="pb-2 font-medium">Cierre</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="h in historial"
            :key="h.id ?? h.fecha"
            class="border-b border-gray-50"
          >
            <td class="py-2 font-medium text-gray-800">{{ h.fecha }}</td>
            <td class="py-2 text-gray-500">{{ h.apertura ? '✓' : '—' }}</td>
            <td class="py-2 text-gray-500">{{ h.cierre ? '✓' : '—' }}</td>
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
import { formatDateTime, todayISO } from '~/utils/formats'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const notify = useNotification()
const apiResponse = useApiResponse()

const filtroFecha = ref(todayISO())

const loadingEstado = ref(true)
const loadingHistorial = ref(true)
const saving = ref(false)

const estado = ref<any>({ apertura: null, cierre: null })
const produccionHoy = ref<any[]>([])
const historial = ref<any[]>([])
const productos = ref<any[]>([])

const prodForm = reactive({
  productoId: undefined as number | undefined,
  cantidadProducida: 1,
})

async function fetchEstado() {
  loadingEstado.value = true
  produccionHoy.value = []
  try {
    const res = await api.get(`/diario/estado?fecha=${filtroFecha.value}`)
    const d = apiResponse.unwrap(res) as any
    estado.value = d
    produccionHoy.value = d.apertura?.producciondiaria ?? []
  } catch {
    notify.error('No se pudo cargar el estado de produccion')
  } finally {
    loadingEstado.value = false
  }
}

async function fetchHistorial() {
  loadingHistorial.value = true
  try {
    const res = await api.get('/diario/historial', { params: { limit: 10 } })
    const d = apiResponse.unwrap(res) as any
    historial.value = d.items ?? d.data ?? []
  } catch {
    historial.value = []
    notify.error('No se pudo cargar el historial de produccion')
  } finally {
    loadingHistorial.value = false
  }
}

async function fetchProductos() {
  if (productos.value.length) return
  try {
    const res = await api.get('/catalogos/productos', { params: { activo: 'true', limit: 200 } })
    const d = apiResponse.unwrap(res) as any
    productos.value = d.items ?? d.data ?? []
  } catch {
    productos.value = []
    notify.error('No se pudieron cargar los productos')
  }
}

async function registrarProduccion() {
  saving.value = true
  try {
    await api.post('/diario/produccion', {
      items: [{
        productoId: prodForm.productoId,
        cantidad: prodForm.cantidadProducida,
      }],
    }, { params: { fecha: filtroFecha.value } })
    notify.success('Producción registrada')
    prodForm.productoId = undefined
    prodForm.cantidadProducida = 1
    await fetchEstado()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al registrar producción')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchEstado(), fetchHistorial(), fetchProductos()])
})
</script>
