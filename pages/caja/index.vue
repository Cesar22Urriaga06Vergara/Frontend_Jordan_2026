<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between gap-3">
      <h1 class="text-2xl font-bold text-gray-800">Caja</h1>
      <button class="btn-primary" @click="abrirModalEgreso">+ Registrar egreso</button>
    </div>

    <!-- Info -->
    <div class="card bg-blue-50 border border-blue-100">
      <p class="text-sm text-blue-700 leading-relaxed">
        Los movimientos de caja se registran automáticamente cuando creas ventas, cobras pagos,
        pagas a trabajadores, registras anticipos o abres/cierras el día. Consulta el estado
        actual del día en <NuxtLink to="/diario" class="underline font-medium">Flujo Diario</NuxtLink>.
      </p>
    </div>

    <!-- Resumen del día -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="card">
        <p class="text-sm text-gray-500">Apertura hoy</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ formatCurrency(resumen.apertura) }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-gray-500">Ingresos del día</p>
        <p class="text-2xl font-bold text-green-700 mt-1">{{ formatCurrency(resumen.ingresos) }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-gray-500">Egresos del día</p>
        <p class="text-2xl font-bold text-red-600 mt-1">{{ formatCurrency(resumen.egresos) }}</p>
      </div>
    </div>

    <div class="card flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-500">Saldo estimado en caja</p>
        <p class="text-3xl font-bold" :class="saldoEstimado >= 0 ? 'text-gray-800' : 'text-red-600'">
          {{ formatCurrency(saldoEstimado) }}
        </p>
      </div>
      <div class="text-4xl opacity-20">🏦</div>
    </div>

    <!-- Estado del día -->
    <div class="card space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold text-gray-700">Estado operacional — hoy</h2>
        <button class="text-xs text-blue-600 hover:underline" @click="fetchEstado">Actualizar</button>
      </div>
      <div v-if="loadingEstado" class="text-gray-400 text-sm">Cargando…</div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p class="text-gray-500">Apertura</p>
          <p class="font-semibold" :class="estado.apertura ? 'text-green-700' : 'text-gray-400'">
            {{ estado.apertura ? '✓ Abierto' : '— Sin abrir' }}
          </p>
        </div>
        <div>
          <p class="text-gray-500">Cierre</p>
          <p class="font-semibold" :class="estado.cierre ? 'text-blue-700' : 'text-gray-400'">
            {{ estado.cierre ? '✓ Cerrado' : '— Pendiente' }}
          </p>
        </div>
        <div>
          <p class="text-gray-500">Pedidos pendientes</p>
          <p class="font-semibold text-gray-700">{{ estado.pedidosPendientes ?? '—' }}</p>
        </div>
        <div>
          <p class="text-gray-500">Rutas abiertas</p>
          <p class="font-semibold text-gray-700">{{ estado.rutasAbiertas ?? '—' }}</p>
        </div>
      </div>
    </div>

    <div class="text-center pt-4">
      <NuxtLink to="/diario" class="btn-primary inline-flex items-center gap-2">
        📅 Ir a Flujo Diario
      </NuxtLink>
    </div>

    <div class="card space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold text-gray-700">Egresos del día</h2>
        <button class="text-xs text-blue-600 hover:underline" @click="fetchEgresos">Actualizar</button>
      </div>

      <div v-if="loadingEgresos" class="text-sm text-gray-400">Cargando...</div>
      <div v-else-if="!egresos.length" class="text-sm text-gray-400">Sin egresos registrados hoy.</div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wide">
              <th class="py-2 pr-3 font-medium">Hora</th>
              <th class="py-2 pr-3 font-medium">Concepto</th>
              <th class="py-2 pr-3 font-medium">Medio</th>
              <th class="py-2 text-right font-medium">Monto</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in egresos" :key="e.id" class="border-b border-gray-50">
              <td class="py-2 pr-3 text-gray-500">{{ formatDateTime(e.fecha) }}</td>
              <td class="py-2 pr-3 text-gray-700">{{ e.concepto }}</td>
              <td class="py-2 pr-3 text-gray-500">{{ e.medioPago }}</td>
              <td class="py-2 text-right text-red-600 font-semibold">{{ formatCurrency(e.monto) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="modalEgreso"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="modalEgreso = false"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 class="font-bold text-gray-800">Registrar egreso</h2>

        <FormField label="Concepto *">
          <input v-model="egresoForm.concepto" class="form-input" placeholder="Ej: Compra de papelería" />
        </FormField>

        <div class="grid grid-cols-2 gap-3">
          <FormField label="Monto *">
            <input v-model.number="egresoForm.monto" class="form-input" type="number" min="0" />
          </FormField>
          <FormField label="Medio pago *">
            <select v-model="egresoForm.medioPago" class="form-input">
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
          </FormField>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <FormField label="Referencia">
            <input v-model="egresoForm.referencia" class="form-input" placeholder="Recibo/factura" />
          </FormField>
          <FormField label="Fecha">
            <input v-model="egresoForm.fecha" class="form-input" type="date" />
          </FormField>
        </div>

        <FormField label="Observaciones">
          <textarea v-model="egresoForm.observaciones" rows="2" class="form-input resize-none" />
        </FormField>

        <div class="flex justify-end gap-2 pt-2">
          <button class="btn-secondary" @click="modalEgreso = false" :disabled="savingEgreso">Cancelar</button>
          <button class="btn-primary" @click="registrarEgreso" :disabled="savingEgreso">
            {{ savingEgreso ? 'Guardando...' : 'Guardar egreso' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency, formatDateTime, todayISO } from '~/utils/formats'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const apiResponse = useApiResponse()
const notify = useNotification()

const loadingEstado = ref(true)
const loadingEgresos = ref(false)
const estado = ref<any>({ apertura: null, cierre: null, pedidosPendientes: 0, rutasAbiertas: 0 })
const egresos = ref<any[]>([])

const resumen = reactive({ apertura: 0, ingresos: 0, ingresosEfectivo: 0, egresos: 0 })
const saldoEstimado = computed(() => resumen.apertura + resumen.ingresosEfectivo - resumen.egresos)
let refreshTimer: ReturnType<typeof setInterval> | null = null

const modalEgreso = ref(false)
const savingEgreso = ref(false)
const egresoForm = reactive({
  concepto: '',
  monto: 0,
  medioPago: 'EFECTIVO',
  referencia: '',
  observaciones: '',
  fecha: todayISO(),
})

async function fetchEstado() {
  loadingEstado.value = true
  try {
    const res = await api.get(`/diario/estado?fecha=${todayISO()}`)
    const d = apiResponse.unwrap(res) as any
    estado.value = d
    resumen.apertura = Number(d.cajaResumen?.apertura ?? d.apertura?.saldoInicial ?? 0)
    resumen.ingresosEfectivo = Number(d.cajaResumen?.ingresosEfectivo ?? d.cierre?.totalEfectivo ?? 0)
    resumen.ingresos = Number(d.cajaResumen?.ingresosTotal ?? (resumen.ingresosEfectivo + Number(d.cierre?.totalTransferencias ?? 0)))
    resumen.egresos = Number(d.cajaResumen?.egresos ?? d.cierre?.totalEgresos ?? 0)
  } catch {
    notify.error('No se pudo cargar el estado de caja')
  } finally {
    loadingEstado.value = false
  }
}

async function fetchEgresos() {
  loadingEgresos.value = true
  try {
    const res = await api.get('/operaciones/egresos', { params: { fecha: todayISO(), limit: 100 } })
    const d = apiResponse.unwrap(res) as any
    egresos.value = Array.isArray(d?.items) ? d.items : (Array.isArray(d) ? d : [])
  } catch {
    egresos.value = []
    notify.error('No se pudieron cargar los egresos del día')
  } finally {
    loadingEgresos.value = false
  }
}

function abrirModalEgreso() {
  egresoForm.concepto = ''
  egresoForm.monto = 0
  egresoForm.medioPago = 'EFECTIVO'
  egresoForm.referencia = ''
  egresoForm.observaciones = ''
  egresoForm.fecha = todayISO()
  modalEgreso.value = true
}

async function registrarEgreso() {
  if (!egresoForm.concepto.trim() || Number(egresoForm.monto) <= 0) {
    notify.error('Concepto y monto son requeridos')
    return
  }

  savingEgreso.value = true
  try {
    await api.post('/operaciones/egresos', {
      concepto: egresoForm.concepto,
      monto: Number(egresoForm.monto),
      medioPago: egresoForm.medioPago,
      referencia: egresoForm.referencia || undefined,
      observaciones: egresoForm.observaciones || undefined,
      fecha: egresoForm.fecha,
    })
    notify.success('Egreso registrado')
    modalEgreso.value = false
    await Promise.all([fetchEstado(), fetchEgresos()])
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error registrando egreso')
  } finally {
    savingEgreso.value = false
  }
}

async function refreshCaja() {
  await Promise.all([fetchEstado(), fetchEgresos()])
}

onMounted(() => {
  refreshCaja()
  refreshTimer = setInterval(refreshCaja, 20000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>
