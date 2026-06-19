<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Caja</h1>
        <p class="text-sm text-gray-500">Resumen del efectivo, ingresos y egresos del día.</p>
      </div>
      <div class="flex flex-col sm:flex-row gap-2">
        <button class="btn-secondary inline-flex items-center justify-center gap-2" @click="abrirModalIngreso">
          <ArrowDownCircle :size="16" /> Registrar ingreso
        </button>
        <button class="btn-primary inline-flex items-center justify-center gap-2" @click="abrirModalEgreso">
          <Plus :size="16" /> Registrar egreso
        </button>
      </div>
    </div>

    <!-- Info -->
    <div class="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 flex items-start gap-3">
      <WalletCards class="h-5 w-5 mt-0.5 text-blue-600" />
      <p class="text-sm text-blue-800 leading-relaxed">
        Los movimientos de caja se registran automáticamente cuando creas ventas, cobras pagos,
        pagas a trabajadores o registras anticipos. Usa <strong>Registrar ingreso</strong> para
        entradas manuales (no asociadas a venta) y <strong>Registrar egreso</strong> para salidas.
        Consulta el estado actual en <NuxtLink to="/operaciones/diario" class="underline font-semibold">Gestión de Planta</NuxtLink>.
      </p>
    </div>

    <!-- Resumen del día -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="card flex items-center gap-4">
        <div class="h-11 w-11 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
          <CalendarDays class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Apertura hoy</p>
          <p class="text-2xl font-bold text-gray-800 mt-1">{{ formatCurrency(resumen.apertura) }}</p>
        </div>
      </div>
      <div class="card flex items-center gap-4">
        <div class="h-11 w-11 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
          <ArrowDownCircle class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Ingresos del día</p>
          <p class="text-2xl font-bold text-green-700 mt-1">{{ formatCurrency(resumen.ingresos) }}</p>
        </div>
      </div>
      <div class="card flex items-center gap-4">
        <div class="h-11 w-11 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
          <ArrowUpCircle class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Egresos del día</p>
          <p class="text-2xl font-bold text-red-600 mt-1">{{ formatCurrency(resumen.egresos) }}</p>
        </div>
      </div>
    </div>

    <div class="card flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-500">Saldo estimado en caja</p>
        <p class="text-3xl font-bold" :class="saldoEstimado >= 0 ? 'text-gray-800' : 'text-red-600'">
          {{ formatCurrency(saldoEstimado) }}
        </p>
      </div>
      <div class="text-slate-300">
        <CreditCard class="h-12 w-12" />
      </div>
    </div>

    <!-- Estado del día -->
    <div class="card space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold text-gray-700">Estado operacional — hoy</h2>
        <button class="text-xs text-blue-600 hover:underline inline-flex items-center gap-1" @click="fetchEstado">
          <RefreshCw class="h-3.5 w-3.5" />
          Actualizar
        </button>
      </div>
      <div v-if="loadingEstado" class="text-gray-400 text-sm">Cargando…</div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p class="text-gray-500">Apertura</p>
          <p class="font-semibold flex items-center gap-2" :class="estado.apertura ? 'text-green-700' : 'text-gray-400'">
            <component :is="estado.apertura ? CheckCircle : Minus" class="h-4 w-4" />
            <span>{{ estado.apertura ? 'Abierto' : 'Sin abrir' }}</span>
          </p>
        </div>
        <div>
          <p class="text-gray-500">{{ estado.apertura ? 'Cierre' : 'Jornada' }}</p>
          <p class="font-semibold flex items-center gap-2" :class="estado.cierre ? 'text-blue-700' : 'text-gray-400'">
            <component :is="estado.cierre ? CheckCircle : Minus" class="h-4 w-4" />
            <span>{{ !estado.apertura ? 'Sin Iniciar' : (estado.cierre ? 'Cerrado' : 'Pendiente') }}</span>
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

    <div class="flex justify-center">
      <NuxtLink to="/operaciones/diario" class="btn-primary inline-flex items-center gap-2">
        <CalendarDays class="h-4 w-4" />
        Ir a Gestión de Planta
      </NuxtLink>
    </div>

    <div class="card space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold text-gray-700">Movimientos por tipo — hoy</h2>
        <button class="text-xs text-blue-600 hover:underline inline-flex items-center gap-1" @click="fetchReporteCaja">
          <RefreshCw class="h-3.5 w-3.5" />
          Actualizar
        </button>
      </div>
      <div v-if="loadingReporte" class="text-sm text-gray-400">Cargando reporte...</div>
      <div v-else-if="!reporteCaja.items?.length" class="text-sm text-gray-500">Sin movimientos de caja hoy.</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-center text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wide">
              <th class="py-2 pr-3 font-medium">Tipo</th>
              <th class="py-2 pr-3 font-medium">Movimientos</th>
              <th class="py-2 pr-3 font-medium">Naturaleza</th>
              <th class="py-2 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in reporteCaja.items" :key="item.tipo" class="border-b border-gray-50">
              <td class="py-2 pr-3 text-gray-700">{{ item.etiqueta }}</td>
              <td class="py-2 pr-3 text-center text-gray-600">{{ item.cantidad }}</td>
              <td class="py-2 pr-3">
                <span class="px-2 py-0.5 rounded text-xs font-medium" :class="item.esIngreso ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                  {{ item.esIngreso ? 'Ingreso' : 'Egreso' }}
                </span>
              </td>
              <td class="py-2 text-right font-semibold" :class="item.esIngreso ? 'text-green-700' : 'text-red-600'">
                {{ formatCurrency(item.total) }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border-t border-gray-200 text-sm font-semibold">
              <td colspan="3" class="py-2 pr-3 text-right text-gray-600">Ingresos</td>
              <td class="py-2 text-right text-green-700">{{ formatCurrency(reporteCaja.totalIngresos ?? 0) }}</td>
            </tr>
            <tr class="text-sm font-semibold">
              <td colspan="3" class="py-2 pr-3 text-right text-gray-600">Egresos</td>
              <td class="py-2 text-right text-red-600">{{ formatCurrency(reporteCaja.totalEgresos ?? 0) }}</td>
            </tr>
            <tr class="text-sm font-bold">
              <td colspan="3" class="py-2 pr-3 text-right text-gray-800">Neto</td>
              <td class="py-2 text-right text-gray-900">{{ formatCurrency(reporteCaja.neto ?? 0) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <div class="card space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold text-gray-700">Ingresos directos del día</h2>
        <button class="text-xs text-blue-600 hover:underline inline-flex items-center gap-1" @click="fetchIngresos">
          <RefreshCw class="h-3.5 w-3.5" />
          Actualizar
        </button>
      </div>

      <div v-if="loadingIngresos" class="text-sm text-gray-400">Cargando...</div>
      <div v-else-if="!ingresos.length" class="rounded-lg border border-dashed border-gray-200 bg-gray-50 text-center py-8 px-4">
        <ArrowDownCircle class="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p class="font-medium text-gray-700">Sin ingresos directos hoy</p>
        <p class="text-sm text-gray-500 mt-1">Registra entradas de efectivo o transferencia no asociadas a ventas.</p>
        <button class="btn-secondary mt-4 inline-flex items-center gap-2" @click="abrirModalIngreso">
          <ArrowDownCircle class="h-4 w-4" />
          Registrar ingreso
        </button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-center text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wide">
              <th class="py-2 pr-3 font-medium">Hora</th>
              <th class="py-2 pr-3 font-medium">Concepto</th>
              <th class="py-2 pr-3 font-medium">Referencia</th>
              <th class="py-2 pr-3 font-medium">Medio</th>
              <th class="py-2 font-medium">Monto</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="i in ingresos" :key="i.id" class="border-b border-gray-50">
              <td class="py-2 pr-3 text-gray-500 whitespace-nowrap">{{ formatDateTime(i.createdAt) }}</td>
              <td class="py-2 pr-3 text-gray-700">
                {{ i.concepto }}
                <span v-if="i.observaciones" class="text-xs text-gray-400 block">{{ i.observaciones }}</span>
              </td>
              <td class="py-2 pr-3 text-gray-500">{{ i.referencia || '—' }}</td>
              <td class="py-2 pr-3 text-gray-500">{{ i.medioPago }}</td>
              <td class="py-2 text-right text-green-700 font-semibold whitespace-nowrap">{{ formatCurrency(i.monto) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold text-gray-700">Egresos del día</h2>
        <button class="text-xs text-blue-600 hover:underline inline-flex items-center gap-1" @click="fetchEgresos">
          <RefreshCw class="h-3.5 w-3.5" />
          Actualizar
        </button>
      </div>

      <div v-if="loadingEgresos" class="text-sm text-gray-400">Cargando...</div>
      <div v-else-if="!egresos.length" class="rounded-lg border border-dashed border-gray-200 bg-gray-50 text-center py-8 px-4">
        <ArrowUpCircle class="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p class="font-medium text-gray-700">Sin egresos registrados hoy</p>
        <p class="text-sm text-gray-500 mt-1">Cuando registres compras, pagos o salidas manuales aparecerán aquí.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-center text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wide">
              <th class="py-2 pr-3 font-medium">Hora</th>
              <th class="py-2 pr-3 font-medium">Tipo</th>
              <th class="py-2 pr-3 font-medium">Concepto</th>
              <th class="py-2 pr-3 font-medium">Nota</th>
              <th class="py-2 pr-3 font-medium">Medio</th>
              <th class="py-2 font-medium">Monto</th>
              <th class="py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in egresos" :key="e.id" class="border-b border-gray-50">
              <td class="py-2 pr-3 text-gray-500 whitespace-nowrap">{{ formatDateTime(e.createdAt) }}</td>
              <td class="py-2 pr-3">
                <span class="px-2 py-0.5 rounded text-xs font-medium" :class="tipoEgresoClass(e.tipo)">
                  {{ tipoEgresoLabel(e.tipo) }}
                </span>
              </td>
              <td class="py-2 pr-3 text-gray-700">
                {{ e.concepto }}
                <span v-if="e.trabajador?.nombre" class="text-xs text-gray-400 block">{{ e.trabajador.nombre }}</span>
              </td>
              <td class="py-2 pr-3 text-gray-500 min-w-56">{{ e.observaciones || '—' }}</td>
              <td class="py-2 pr-3 text-gray-500">{{ e.medioPago }}</td>
              <td class="py-2 text-right text-red-600 font-semibold whitespace-nowrap">{{ formatCurrency(e.monto) }}</td>
              <td class="py-2 pr-3 text-right">
                <button
                  v-if="puedeEditarEgreso(e)"
                  class="text-xs text-blue-600 hover:underline"
                  @click="abrirEditarEgreso(e)">
                  Editar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="modalIngreso"
      class="fixed inset-0 bg-black/40 flex items-stretch justify-center z-50 p-0 sm:items-center sm:p-4"
      @click.self="modalIngreso = false"
    >
      <div class="bg-white rounded-none shadow-xl w-full max-w-lg p-4 sm:rounded-lg sm:p-6 space-y-4 max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto">
        <div>
          <h2 class="font-bold text-gray-800">Registrar ingreso</h2>
          <p class="text-sm text-gray-500 mt-1">Entrada manual de caja (no asociada a venta o cartera).</p>
        </div>

        <FormField label="Concepto *" :error="ingresoErrors.concepto">
          <input v-model="ingresoForm.concepto" class="form-input" placeholder="Ej: Devolución de préstamo" />
        </FormField>

        <div class="grid grid-cols-2 gap-3">
          <FormField label="Monto *" :error="ingresoErrors.monto">
            <CurrencyInput v-model="ingresoForm.monto" :error="!!ingresoErrors.monto" placeholder="$0" />
          </FormField>
          <FormField label="Medio pago *">
            <select v-model="ingresoForm.medioPago" class="form-input">
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
          </FormField>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <FormField label="Referencia">
            <input v-model="ingresoForm.referencia" class="form-input" placeholder="Recibo/comprobante" />
          </FormField>
          <FormField label="Fecha">
            <input v-model="ingresoForm.fecha" class="form-input" type="date" />
          </FormField>
        </div>

        <FormField label="Observaciones">
          <textarea v-model="ingresoForm.observaciones" rows="2" class="form-input resize-none" />
        </FormField>

        <p class="text-xs text-gray-500">
          El ingreso en efectivo sumará al saldo estimado de caja. Las transferencias se registran pero no afectan el efectivo físico.
        </p>

        <div class="flex justify-end gap-2 pt-2">
          <button class="btn-secondary" @click="modalIngreso = false" :disabled="savingIngreso">Cancelar</button>
          <button class="btn-primary" @click="registrarIngreso" :disabled="savingIngreso">
            {{ savingIngreso ? 'Guardando...' : 'Guardar ingreso' }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="modalEgreso"
      class="fixed inset-0 bg-black/40 flex items-stretch justify-center z-50 p-0 sm:items-center sm:p-4"
      @click.self="modalEgreso = false"
    >
      <div class="bg-white rounded-none shadow-xl w-full max-w-lg p-4 sm:rounded-lg sm:p-6 space-y-4 max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto">
        <div>
          <h2 class="font-bold text-gray-800">{{ egresoEditando ? 'Editar egreso' : 'Registrar egreso' }}</h2>
          <p class="text-sm text-gray-500 mt-1">Movimiento manual de salida de caja.</p>
        </div>

        <FormField label="Concepto *" :error="egresoErrors.concepto">
          <input v-model="egresoForm.concepto" class="form-input" placeholder="Ej: Compra de papelería" />
        </FormField>

        <div class="grid grid-cols-2 gap-3">
          <FormField label="Monto *" :error="egresoErrors.monto">
            <CurrencyInput v-model="egresoForm.monto" :error="!!egresoErrors.monto" placeholder="$0" />
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
            {{ savingEgreso ? 'Guardando...' : egresoEditando ? 'Actualizar egreso' : 'Guardar egreso' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency, formatDateTime, todayISO } from '~/utils/formats'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  CheckCircle,
  CreditCard,
  Minus,
  Plus,
  RefreshCw,
  WalletCards,
} from 'lucide-vue-next'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const apiResponse = useApiResponse()
const notify = useNotification()

const loadingEstado = ref(true)
const loadingEgresos = ref(false)
const loadingIngresos = ref(false)
const loadingReporte = ref(false)
const estado = ref<any>({ apertura: null, cierre: null, pedidosPendientes: 0, rutasAbiertas: 0 })
const egresos = ref<any[]>([])
const ingresos = ref<any[]>([])
const reporteCaja = ref<any>({ items: [], totalIngresos: 0, totalEgresos: 0, neto: 0 })

const resumen = reactive({ apertura: 0, ingresos: 0, ingresosEfectivo: 0, egresos: 0 })
const saldoEstimado = computed(() => resumen.apertura + resumen.ingresosEfectivo - resumen.egresos)
let refreshTimer: ReturnType<typeof setInterval> | null = null

const modalIngreso = ref(false)
const modalEgreso = ref(false)
const egresoEditando = ref<any | null>(null)
const savingIngreso = ref(false)
const savingEgreso = ref(false)
const ingresoForm = reactive({
  concepto: '',
  monto: 0,
  medioPago: 'EFECTIVO',
  referencia: '',
  observaciones: '',
  fecha: todayISO(),
})
const ingresoErrors = reactive({ concepto: '', monto: '' })
const egresoForm = reactive({
  concepto: '',
  monto: 0,
  medioPago: 'EFECTIVO',
  referencia: '',
  observaciones: '',
  fecha: todayISO(),
})
const egresoErrors = reactive({ concepto: '', monto: '' })

function validarIngreso(): boolean {
  ingresoErrors.concepto = !ingresoForm.concepto.trim() ? 'El concepto es requerido' : ''
  ingresoErrors.monto = Number(ingresoForm.monto) <= 0 ? 'El monto debe ser mayor a 0' : ''
  return !ingresoErrors.concepto && !ingresoErrors.monto
}

function validarEgreso(): boolean {
  egresoErrors.concepto = !egresoForm.concepto.trim() ? 'El concepto es requerido' : ''
  egresoErrors.monto = Number(egresoForm.monto) <= 0 ? 'El monto debe ser mayor a 0' : ''
  return !egresoErrors.concepto && !egresoErrors.monto
}

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

async function fetchReporteCaja() {
  loadingReporte.value = true
  try {
    const res = await api.get('/operaciones/caja/reporte/tipos', { params: { fecha: todayISO() } })
    reporteCaja.value = apiResponse.unwrap(res) as any
  } catch {
    reporteCaja.value = { items: [], totalIngresos: 0, totalEgresos: 0, neto: 0 }
  } finally {
    loadingReporte.value = false
  }
}

async function fetchIngresos() {
  loadingIngresos.value = true
  try {
    const res = await api.get('/operaciones/caja/ingresos', { params: { fecha: todayISO(), limit: 100 } })
    const d = apiResponse.unwrap(res) as any
    ingresos.value = Array.isArray(d?.items) ? d.items : (Array.isArray(d) ? d : [])
  } catch {
    ingresos.value = []
    notify.error('No se pudieron cargar los ingresos del día')
  } finally {
    loadingIngresos.value = false
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

function tipoEgresoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    PAGO_TRABAJADOR: 'Pago trabajador',
    ANTICIPOS: 'Anticipo',
    PRESTAMOS: 'Préstamo',
    OTROS_EGRESOS: 'Otro egreso',
  }
  return labels[tipo] ?? tipo
}

function tipoEgresoClass(tipo: string): string {
  const classes: Record<string, string> = {
    PAGO_TRABAJADOR: 'bg-blue-100 text-blue-700',
    ANTICIPOS: 'bg-orange-100 text-orange-700',
    PRESTAMOS: 'bg-purple-100 text-purple-700',
    OTROS_EGRESOS: 'bg-gray-100 text-gray-600',
  }
  return classes[tipo] ?? 'bg-gray-100 text-gray-600'
}

function puedeEditarEgreso(egreso: any): boolean {
  return egreso?.tipo === 'OTROS_EGRESOS'
}

function abrirModalIngreso() {
  ingresoForm.concepto = ''
  ingresoForm.monto = 0
  ingresoForm.medioPago = 'EFECTIVO'
  ingresoForm.referencia = ''
  ingresoForm.observaciones = ''
  ingresoForm.fecha = todayISO()
  modalIngreso.value = true
}

function resetEgresoForm() {
  egresoEditando.value = null
  egresoForm.concepto = ''
  egresoForm.monto = 0
  egresoForm.medioPago = 'EFECTIVO'
  egresoForm.referencia = ''
  egresoForm.observaciones = ''
  egresoForm.fecha = todayISO()
}

function abrirModalEgreso() {
  resetEgresoForm()
  modalEgreso.value = true
}

function abrirEditarEgreso(egreso: any) {
  egresoEditando.value = egreso
  egresoForm.concepto = egreso.concepto || ''
  egresoForm.monto = Number(egreso.monto ?? 0)
  egresoForm.medioPago = egreso.medioPago || 'EFECTIVO'
  egresoForm.referencia = egreso.referencia || ''
  egresoForm.observaciones = egreso.observaciones || ''
  egresoForm.fecha = egreso.fecha?.split('T')[0] ?? todayISO()
  modalEgreso.value = true
}

async function registrarIngreso() {
  if (!validarIngreso()) return

  savingIngreso.value = true
  try {
    await api.post('/operaciones/caja/ingresos', {
      concepto: ingresoForm.concepto,
      monto: Number(ingresoForm.monto),
      medioPago: ingresoForm.medioPago,
      referencia: ingresoForm.referencia || undefined,
      observaciones: ingresoForm.observaciones || undefined,
      fecha: ingresoForm.fecha,
    })
    notify.success('Ingreso registrado')
    modalIngreso.value = false
    await refreshCaja()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error registrando ingreso')
  } finally {
    savingIngreso.value = false
  }
}

async function registrarEgreso() {
  if (!validarEgreso()) return

  savingEgreso.value = true
  try {
    const payload = {
      concepto: egresoForm.concepto,
      monto: Number(egresoForm.monto),
      medioPago: egresoForm.medioPago,
      referencia: egresoForm.referencia || undefined,
      observaciones: egresoForm.observaciones || undefined,
      fecha: egresoForm.fecha,
    }

    if (egresoEditando.value) {
      await api.patch(`/operaciones/egresos/${egresoEditando.value.id}`, payload)
      notify.success('Egreso actualizado')
    } else {
      await api.post('/operaciones/egresos', payload)
      notify.success('Egreso registrado')
    }

    modalEgreso.value = false
    egresoEditando.value = null
    await Promise.all([fetchEstado(), fetchEgresos()])
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error guardando egreso')
  } finally {
    savingEgreso.value = false
  }
}

async function refreshCaja() {
  await Promise.all([fetchEstado(), fetchReporteCaja(), fetchIngresos(), fetchEgresos()])
}

onMounted(() => {
  refreshCaja()
  refreshTimer = setInterval(refreshCaja, 20000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>
