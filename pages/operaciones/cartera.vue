<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Cartera</h1>
        <p class="text-sm text-gray-500">Cobranza por cliente con contacto, direccion y saldo pendiente.</p>
      </div>
      <button class="btn-secondary inline-flex items-center gap-2" @click="fetchCartera">
        <RefreshCw class="h-4 w-4" />
        Actualizar
      </button>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div class="card flex items-center gap-4">
        <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50 text-orange-700">
          <WalletCards class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Total en cartera</p>
          <p class="mt-1 text-2xl font-bold text-gray-800">{{ formatCurrency(totalCartera) }}</p>
        </div>
      </div>
      <div class="card flex items-center gap-4">
        <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <UsersRound class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Clientes con deuda</p>
          <p class="mt-1 text-2xl font-bold text-gray-800">{{ clientesConDeuda }}</p>
        </div>
      </div>
      <div class="card flex items-center gap-4">
        <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-green-50 text-green-700">
          <CreditCard class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Deuda promedio</p>
          <p class="mt-1 text-2xl font-bold text-gray-800">{{ formatCurrency(promedioCartera) }}</p>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="relative max-w-xl">
        <Search class="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input
          v-model="search"
          placeholder="Buscar cliente, venta, telefono o direccion..."
          class="form-input pl-10"
        />
      </div>
    </div>

    <div class="card overflow-x-auto p-0">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b text-xs uppercase text-gray-500">
            <th class="px-4 py-3 font-medium">Cliente / Contacto</th>
            <th class="px-4 py-3 font-medium">Venta</th>
            <th class="px-4 py-3 font-medium">Fecha</th>
            <th class="px-4 py-3 font-medium">Total venta</th>
            <th class="px-4 py-3 font-medium">Saldo pendiente</th>
            <th class="px-4 py-3 font-medium">Estado</th>
            <th class="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="px-4 py-8 text-center text-gray-400">Cargando...</td>
          </tr>
          <tr v-else-if="!filtradas.length">
            <td colspan="7" class="px-4 py-10 text-center text-gray-400">Sin deudas pendientes.</td>
          </tr>
          <tr
            v-for="c in filtradas"
            :key="c.id"
            class="border-b border-gray-50 transition hover:bg-gray-50"
          >
            <td class="min-w-64 px-4 py-3 text-left">
              <p class="font-semibold text-gray-900">{{ c.cliente?.nombre ?? 'Sin cliente' }}</p>
              <p class="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                <Phone class="h-3.5 w-3.5 text-gray-300" />
                <span>{{ telefonoCliente(c) }}</span>
              </p>
              <p class="mt-0.5 flex items-start gap-1.5 text-xs text-gray-500">
                <MapPin class="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-300" />
                <span>{{ direccionCliente(c) }}</span>
              </p>
            </td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ c.venta?.numero ?? '-' }}</td>
            <td class="whitespace-nowrap px-4 py-3 text-gray-600">{{ formatDate(c.venta?.fecha ?? c.fecha) }}</td>
            <td class="px-4 py-3 text-right text-gray-600">{{ formatCurrency(c.venta?.totalVenta ?? 0) }}</td>
            <td class="px-4 py-3 text-right font-semibold text-orange-600">{{ formatCurrency(c.saldoPendiente) }}</td>
            <td class="px-4 py-3"><EstadoBadge :estado="c.estado ?? 'ACTIVO'" /></td>
            <td class="px-4 py-3 text-right">
              <button
                class="btn-secondary inline-flex items-center gap-1 px-2 py-1 text-xs"
                @click="abrirPagoModal(c)"
              >
                <CreditCard class="h-3.5 w-3.5" />
                Registrar pago
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="modalPago"
      class="fixed inset-0 z-50 flex items-stretch justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      @click.self="modalPago = false"
    >
      <div class="max-h-[100dvh] w-full max-w-lg space-y-4 overflow-y-auto rounded-none bg-white p-4 shadow-xl sm:max-h-[90vh] sm:rounded-lg sm:p-6">
        <div>
          <h2 class="font-bold text-gray-800">Registrar pago</h2>
          <p class="mt-1 text-sm text-gray-500">
            {{ carteraSeleccionada?.cliente?.nombre }} - Saldo: {{ formatCurrency(carteraSeleccionada?.saldoPendiente ?? 0) }}
          </p>
        </div>

        <div class="space-y-1 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
          <div class="flex items-center justify-between gap-3">
            <span class="text-gray-500">Venta</span>
            <strong class="text-gray-800">{{ carteraSeleccionada?.venta?.numero ?? '-' }}</strong>
          </div>
          <div class="flex items-start justify-between gap-3">
            <span class="text-gray-500">Direccion</span>
            <span class="text-right text-gray-700">{{ direccionCliente(carteraSeleccionada) }}</span>
          </div>
        </div>

        <FormField label="Forma de pago">
          <select v-model="pagoForm.formaPago" class="form-input" @change="onFormaPagoChange">
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="AMBOS">Efectivo y transferencia</option>
          </select>
        </FormField>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField v-if="pagoForm.formaPago === 'EFECTIVO' || pagoForm.formaPago === 'AMBOS'" label="Efectivo *">
            <input v-model.number="pagoForm.montoEfectivo" class="form-input" type="number" min="0" step="1" />
          </FormField>
          <FormField v-if="pagoForm.formaPago === 'TRANSFERENCIA' || pagoForm.formaPago === 'AMBOS'" label="Transferencia *">
            <input v-model.number="pagoForm.montoTransferencia" class="form-input" type="number" min="0" step="1" />
          </FormField>
        </div>

        <div class="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
          <span class="text-gray-500">Total pago</span>
          <strong class="text-gray-800">{{ formatCurrency(totalPagoForm) }}</strong>
        </div>

        <FormField label="Notas">
          <textarea v-model="pagoForm.notas" rows="2" class="form-input resize-none" />
        </FormField>

        <div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button class="btn-secondary" @click="modalPago = false">Cancelar</button>
          <button class="btn-primary inline-flex items-center gap-2" :disabled="saving || totalPagoForm <= 0" @click="registrarPago">
            <CreditCard class="h-4 w-4" />
            {{ saving ? 'Guardando...' : 'Registrar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CreditCard, MapPin, Phone, RefreshCw, Search, UsersRound, WalletCards } from 'lucide-vue-next'
import { formatCurrency, formatDate } from '~/utils/formats'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const notify = useNotification()
const apiResponse = useApiResponse()

const loading = ref(true)
const saving = ref(false)
const cartera = ref<any[]>([])
const search = ref('')

const modalPago = ref(false)
const carteraSeleccionada = ref<any>(null)
const pagoForm = reactive({
  formaPago: 'EFECTIVO',
  montoEfectivo: 0,
  montoTransferencia: 0,
  notas: '',
})

function toMoneyNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const totalCartera = computed(() =>
  cartera.value.reduce((s, c) => s + toMoneyNumber(c.saldoPendiente), 0),
)

const clientesConDeuda = computed(() =>
  new Set(cartera.value.map(c => c.clienteId ?? c.cliente?.id).filter(Boolean)).size,
)

const promedioCartera = computed(() =>
  clientesConDeuda.value ? totalCartera.value / clientesConDeuda.value : 0,
)

const totalPagoForm = computed(() => {
  const efectivo = pagoForm.formaPago === 'EFECTIVO' || pagoForm.formaPago === 'AMBOS'
    ? Number(pagoForm.montoEfectivo ?? 0)
    : 0
  const transferencia = pagoForm.formaPago === 'TRANSFERENCIA' || pagoForm.formaPago === 'AMBOS'
    ? Number(pagoForm.montoTransferencia ?? 0)
    : 0
  return efectivo + transferencia
})

const filtradas = computed(() => {
  if (!search.value) return cartera.value
  const q = search.value.toLowerCase()
  return cartera.value.filter(c =>
    (c.cliente?.nombre ?? '').toLowerCase().includes(q) ||
    (c.venta?.numero ?? '').toLowerCase().includes(q) ||
    telefonoCliente(c).toLowerCase().includes(q) ||
    direccionCliente(c).toLowerCase().includes(q),
  )
})

function telefonoCliente(c: any) {
  return c?.cliente?.telefono || c?.cliente?.celular || c?.telefono || 'Sin telefono'
}

function direccionCliente(c: any) {
  return c?.cliente?.direccion || c?.cliente?.vereda || c?.direccion || 'Sin direccion registrada'
}

async function fetchCartera() {
  loading.value = true
  try {
    const res = await api.get('/operaciones/ventas/cartera/resumen')
    const d = apiResponse.unwrap(res) as any
    cartera.value = d.items ?? d
  } catch {
    notify.error('Error al cargar cartera')
  } finally {
    loading.value = false
  }
}

function abrirPagoModal(c: any) {
  carteraSeleccionada.value = c
  const saldo = Number(c.saldoPendiente ?? 0)
  pagoForm.formaPago = 'EFECTIVO'
  pagoForm.montoEfectivo = saldo
  pagoForm.montoTransferencia = 0
  pagoForm.notas = ''
  modalPago.value = true
}

function onFormaPagoChange() {
  const saldo = Number(carteraSeleccionada.value?.saldoPendiente ?? 0)
  if (pagoForm.formaPago === 'EFECTIVO') {
    pagoForm.montoEfectivo = saldo
    pagoForm.montoTransferencia = 0
  } else if (pagoForm.formaPago === 'TRANSFERENCIA') {
    pagoForm.montoEfectivo = 0
    pagoForm.montoTransferencia = saldo
  } else {
    pagoForm.montoEfectivo = Math.min(Number(pagoForm.montoEfectivo ?? 0), saldo)
    pagoForm.montoTransferencia = Math.max(0, saldo - pagoForm.montoEfectivo)
  }
}

async function registrarPago() {
  if (!carteraSeleccionada.value) return
  if (totalPagoForm.value <= 0) {
    notify.error('El monto del pago debe ser mayor a cero')
    return
  }
  if (pagoForm.formaPago === 'AMBOS' && (pagoForm.montoEfectivo <= 0 || pagoForm.montoTransferencia <= 0)) {
    notify.error('Indica monto en efectivo y monto por transferencia')
    return
  }
  if (totalPagoForm.value > Number(carteraSeleccionada.value.saldoPendiente ?? 0)) {
    notify.error('El pago no puede superar el saldo pendiente')
    return
  }

  saving.value = true
  try {
    await api.post(`/operaciones/ventas/${carteraSeleccionada.value.ventaId}/pagos`, {
      tipo: pagoForm.formaPago,
      monto: totalPagoForm.value,
      montoEfectivo: pagoForm.formaPago === 'EFECTIVO' || pagoForm.formaPago === 'AMBOS'
        ? pagoForm.montoEfectivo
        : undefined,
      montoTransferencia: pagoForm.formaPago === 'TRANSFERENCIA' || pagoForm.formaPago === 'AMBOS'
        ? pagoForm.montoTransferencia
        : undefined,
      observaciones: pagoForm.notas || undefined,
    })
    notify.success('Pago registrado')
    modalPago.value = false
    await fetchCartera()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al registrar pago')
  } finally {
    saving.value = false
  }
}

onMounted(fetchCartera)
</script>
