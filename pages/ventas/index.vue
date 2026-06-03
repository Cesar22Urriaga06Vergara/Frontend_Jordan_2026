<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Ventas</h1>
        <p class="text-sm text-gray-500">Ventas directas, pagos y saldos pendientes.</p>
      </div>
      <button class="btn-primary inline-flex items-center justify-center gap-2" @click="abrirNuevaVenta">
        <Plus :size="16" /> Nueva venta
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="card flex items-center gap-4">
        <div class="h-11 w-11 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
          <ReceiptText class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Ventas listadas</p>
          <p class="text-2xl font-bold text-gray-800">{{ total }}</p>
        </div>
      </div>
      <div class="card flex items-center gap-4">
        <div class="h-11 w-11 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
          <WalletCards class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Total vendido</p>
          <p class="text-2xl font-bold text-gray-800">{{ formatCurrency(totalVendidoListado) }}</p>
        </div>
      </div>
      <div class="card flex items-center gap-4">
        <div class="h-11 w-11 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center">
          <CreditCard class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Saldo pendiente</p>
          <p class="text-2xl font-bold text-gray-800">{{ formatCurrency(totalSaldoListado) }}</p>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card flex flex-wrap gap-3 items-end">
      <select v-model="filtroEstado" class="form-input flex-1 min-w-36" @change="pagina = 1; fetchVentas()">
        <option value="">Todos los estados</option>
        <option value="COMPLETADA">Completada</option>
        <option value="PARCIAL">Parcial</option>
        <option value="PENDIENTE">Pendiente</option>
      </select>
      <input v-model="filtroFechaDesde" type="date" class="form-input flex-1 min-w-36" @change="pagina = 1; fetchVentas()" />
      <input v-model="filtroFechaHasta" type="date" class="form-input flex-1 min-w-36" @change="pagina = 1; fetchVentas()" />
      <button class="btn-secondary inline-flex items-center gap-2" @click="fetchVentas">
        <RefreshCw class="h-4 w-4" />
        Actualizar
      </button>
    </div>

    <!-- Tabla -->
    <div class="card overflow-x-auto p-0">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-center text-gray-500 border-b text-xs uppercase">
            <th class="px-4 py-3 font-medium">Número</th>
            <th class="px-4 py-3 font-medium">Fecha</th>
            <th class="px-4 py-3 font-medium">Cliente</th>
            <th class="px-4 py-3 font-medium">Total</th>
            <th class="px-4 py-3 font-medium">Saldo</th>
            <th class="px-4 py-3 font-medium">Estado</th>
            <th class="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="px-4 py-8 text-center text-gray-400">Cargando…</td>
          </tr>
          <tr v-else-if="!ventas.length">
            <td colspan="7" class="px-4 py-8 text-center text-gray-400">Sin ventas.</td>
          </tr>
          <tr
            v-for="v in ventas"
            :key="v.id"
            class="border-b border-gray-50 hover:bg-gray-50 transition"
          >
            <td class="px-4 py-3 font-medium text-gray-800">{{ v.numero }}</td>
            <td class="px-4 py-3 text-gray-600">{{ formatDate(v.fecha) }}</td>
            <td class="px-4 py-3 text-gray-600">{{ v.cliente?.nombre ?? '—' }}</td>
            <td class="px-4 py-3 text-right text-gray-800">{{ formatCurrency(v.totalVenta) }}</td>
            <td class="px-4 py-3 text-right" :class="v.saldoPendiente > 0 ? 'text-orange-600 font-medium' : 'text-gray-500'">
              {{ formatCurrency(v.saldoPendiente) }}
            </td>
            <td class="px-4 py-3"><EstadoBadge :estado="v.estado" /></td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-2">
                <button
                  v-if="v.saldoPendiente > 0"
                  class="btn-secondary text-xs py-1 px-2 inline-flex items-center gap-1"
                  @click="abrirPago(v)"
                >
                  <CreditCard class="h-3.5 w-3.5" />
                  Registrar pago
                </button>
                <button class="btn-secondary text-xs py-1 px-2 inline-flex items-center gap-1" @click="verDetalle(v)">
                  <Eye class="h-3.5 w-3.5" />
                  Ver
                </button>
                <button
                  v-if="puedeEditarVenta(v)"
                  class="btn-secondary text-xs py-1 px-2 inline-flex items-center gap-1"
                  @click="abrirEditarVenta(v)"
                >
                  <Pencil class="h-3.5 w-3.5" />
                  Editar
                </button>
                <button
                  v-if="puedeEliminarVenta(v)"
                  class="btn-secondary text-xs py-1 px-2 inline-flex items-center gap-1 text-red-600 hover:text-red-700"
                  @click="eliminarVenta(v)"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                  Eliminar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Paginación -->
    <div class="flex items-center justify-between text-sm text-gray-500">
      <span>{{ total }} ventas</span>
      <div class="flex gap-2">
        <button class="btn-secondary px-3 py-1 text-xs" :disabled="pagina === 1" @click="pagina--; fetchVentas()">Ant.</button>
        <span class="px-2 py-1">{{ pagina }} / {{ totalPaginas }}</span>
        <button class="btn-secondary px-3 py-1 text-xs" :disabled="pagina >= totalPaginas" @click="pagina++; fetchVentas()">Sig.</button>
      </div>
    </div>

    <!-- Modal nueva venta -->
    <div
      v-if="modalNueva"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="modalNueva = false"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div>
          <h2 class="font-bold text-gray-800">{{ ventaEditando ? 'Editar venta' : 'Nueva venta' }}</h2>
          <p class="text-sm text-gray-500 mt-1">
            {{ ventaEditando ? ventaEditando.numero : 'Selecciona cliente y productos. El pago se registra despues.' }}
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Cliente *" :error="nvErrors.clienteId">
            <select v-model="nvForm.clienteId" class="form-input" @change="onClienteChange">
              <option :value="undefined">Seleccionar…</option>
              <option v-for="c in clientes" :key="c.id" :value="c.id">{{ c.nombre }}</option>
            </select>
          </FormField>
          <FormField label="Fecha venta *" :error="nvErrors.fechaVenta">
            <input v-model="nvForm.fechaVenta" type="date" class="form-input" />
          </FormField>
          <FormField label="Notas" class="col-span-2">
            <textarea v-model="nvForm.notas" rows="2" class="form-input resize-none" />
          </FormField>
        </div>

        <!-- Detalles -->
        <div class="border-t pt-4">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-semibold text-sm text-gray-700">Productos</h3>
            <button class="btn-secondary text-xs py-1 px-2 inline-flex items-center gap-1" @click="agregarDetalle">
              <Plus class="h-4 w-4" />
              Añadir línea
            </button>
          </div>

          <div
            v-for="(d, i) in nvForm.detalles"
            :key="i"
            class="flex gap-2 mb-2 items-start"
          >
            <select v-model="d.productoId" class="form-input flex-1" @change="onProductoSelect(d)">
              <option :value="undefined">Seleccionar…</option>
              <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
            </select>
            <input v-model.number="d.cantidad" class="form-input w-20" type="number" min="1" placeholder="Cant." />
            <input v-model.number="d.precioUnitario" class="form-input w-28" type="number" min="0" placeholder="Precio" />
            <button class="text-red-400 hover:text-red-600 mt-2 text-lg leading-none" @click="nvForm.detalles.splice(i, 1)">×</button>
          </div>
          <p v-if="nvErrors.detalles" class="text-xs text-red-600 mt-1">{{ nvErrors.detalles }}</p>

          <div class="text-right font-semibold text-gray-800 mt-2">
            Total: {{ formatCurrency(totalNueva) }}
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button class="btn-secondary" @click="modalNueva = false">Cancelar</button>
          <button class="btn-primary inline-flex items-center gap-2" :disabled="saving || !nvForm.clienteId || !nvForm.detalles.length" @click="crearVenta">
            <ReceiptText class="h-4 w-4" />
            {{ saving ? 'Guardando…' : ventaEditando ? 'Guardar cambios' : 'Crear venta' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal registrar pago -->
    <div
      v-if="modalPago"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="modalPago = false"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
        <div>
          <h2 class="font-bold text-gray-800">Registrar pago</h2>
          <p class="text-sm text-gray-500 mt-1">
            Venta: {{ ventaPago?.numero }} — Saldo pendiente: {{ formatCurrency(ventaPago?.saldoPendiente) }}
          </p>
        </div>

        <FormField label="Forma de pago">
          <select v-model="pagoForm.formaPago" class="form-input" @change="onFormaPagoChange">
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="AMBOS">Efectivo y transferencia</option>
          </select>
        </FormField>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField v-if="pagoForm.formaPago === 'EFECTIVO' || pagoForm.formaPago === 'AMBOS'" label="Efectivo *">
            <input v-model.number="pagoForm.montoEfectivo" class="form-input" type="number" min="0" step="1" @blur="moneyInput.handleMoneyBlur" />
          </FormField>
          <FormField v-if="pagoForm.formaPago === 'TRANSFERENCIA' || pagoForm.formaPago === 'AMBOS'" label="Transferencia *">
            <input v-model.number="pagoForm.montoTransferencia" class="form-input" type="number" min="0" step="1" @blur="moneyInput.handleMoneyBlur" />
          </FormField>
        </div>
        <div class="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm flex items-center justify-between gap-3">
          <span class="text-gray-500">Total pago</span>
          <strong class="text-gray-800">{{ formatCurrency(totalPagoForm) }}</strong>
        </div>
        <FormField label="Referencia">
          <input v-model="pagoForm.referencia" class="form-input" type="text" />
        </FormField>
        <FormField label="Notas">
          <textarea v-model="pagoForm.notas" rows="2" class="form-input resize-none" />
        </FormField>

        <div class="flex justify-end gap-2 pt-2">
          <button class="btn-secondary" @click="modalPago = false">Cancelar</button>
          <button class="btn-primary" :disabled="saving || totalPagoForm <= 0" @click="registrarPago">
            {{ saving ? 'Guardando…' : 'Registrar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal detalle venta -->
    <div
      v-if="modalDetalle && ventaDetalle"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="modalDetalle = false"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between">
          <h2 class="font-bold text-gray-800">{{ ventaDetalle.numero }}</h2>
          <EstadoBadge :estado="ventaDetalle.estado" />
        </div>
        <p class="text-sm text-gray-500">{{ ventaDetalle.cliente?.nombre }} — {{ formatDate(ventaDetalle.fecha) }}</p>

        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 border-b text-xs uppercase">
              <th class="pb-2">Producto</th>
              <th class="pb-2 text-center">Cant.</th>
              <th class="pb-2 text-right">Precio</th>
              <th class="pb-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in ventaDetalle.detalles" :key="d.id" class="border-b border-gray-50">
              <td class="py-1.5">{{ d.producto?.nombre ?? d.productoId }}</td>
              <td class="py-1.5 text-center">{{ d.cantidad }}</td>
              <td class="py-1.5 text-right">{{ formatCurrency(d.precioUnitario) }}</td>
              <td class="py-1.5 text-right">{{ formatCurrency(d.subtotal) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" class="pt-3 font-semibold text-right">Total:</td>
              <td class="pt-3 font-semibold text-right">{{ formatCurrency(ventaDetalle.totalVenta) }}</td>
            </tr>
            <tr v-if="ventaDetalle.saldoPendiente > 0">
              <td colspan="3" class="text-orange-600 text-right">Saldo pendiente:</td>
              <td class="text-orange-600 text-right font-medium">{{ formatCurrency(ventaDetalle.saldoPendiente) }}</td>
            </tr>
          </tfoot>
        </table>

        <button class="btn-secondary w-full" @click="modalDetalle = false">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency, formatDate, todayISO } from '~/utils/formats'
import { CreditCard, Eye, Pencil, Plus, ReceiptText, RefreshCw, Trash2, WalletCards } from 'lucide-vue-next'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const notify = useNotification()
const apiResponse = useApiResponse()
const moneyInput = useMoneyInput()

const loading = ref(true)
const saving = ref(false)
const ventas = ref<any[]>([])
const total = ref(0)
const pagina = ref(1)
const LIMITE = 15
const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / LIMITE)))
const filtroEstado = ref('')
const filtroFechaDesde = ref('')
const filtroFechaHasta = ref('')

const clientes = ref<any[]>([])
const productos = ref<any[]>([])

// Nueva venta
const modalNueva = ref(false)
const ventaEditando = ref<any>(null)
const nvForm = reactive({
  clienteId: undefined as number | undefined,
  fechaVenta: todayISO(),
  notas: '',
  detalles: [] as { productoId: number | undefined; cantidad: number; precioUnitario: number }[],
})
const nvErrors = reactive({ clienteId: '', fechaVenta: '', detalles: '' })

function validarNuevaVenta(): boolean {
  nvErrors.clienteId = !nvForm.clienteId ? 'Debes seleccionar un cliente' : ''
  nvErrors.fechaVenta = !nvForm.fechaVenta ? 'La fecha es requerida' : ''
  const detallesValidos = nvForm.detalles.filter(d => d.productoId && d.cantidad > 0 && d.precioUnitario > 0)
  nvErrors.detalles = !detallesValidos.length ? 'Agrega al menos un producto válido' : ''
  return !nvErrors.clienteId && !nvErrors.fechaVenta && !nvErrors.detalles
}

const totalNueva = computed(() =>
  nvForm.detalles.reduce((s, d) => s + (d.cantidad ?? 0) * (d.precioUnitario ?? 0), 0)
)

const totalVendidoListado = computed(() =>
  ventas.value.reduce((sum, v) => sum + Number(v?.totalVenta ?? 0), 0),
)
const totalSaldoListado = computed(() =>
  ventas.value.reduce((sum, v) => sum + Number(v?.saldoPendiente ?? 0), 0),
)

// Pago
const modalPago = ref(false)
const ventaPago = ref<any>(null)
const pagoForm = reactive({
  formaPago: 'EFECTIVO',
  montoEfectivo: 0,
  montoTransferencia: 0,
  referencia: '',
  notas: '',
})
const totalPagoForm = computed(() => {
  const efectivo = pagoForm.formaPago === 'EFECTIVO' || pagoForm.formaPago === 'AMBOS'
    ? Number(pagoForm.montoEfectivo ?? 0)
    : 0
  const transferencia = pagoForm.formaPago === 'TRANSFERENCIA' || pagoForm.formaPago === 'AMBOS'
    ? Number(pagoForm.montoTransferencia ?? 0)
    : 0
  return efectivo + transferencia
})

// Detalle
const modalDetalle = ref(false)
const ventaDetalle = ref<any>(null)

async function fetchVentas() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: pagina.value, limit: LIMITE }
    if (filtroEstado.value) params.estado = filtroEstado.value
    if (filtroFechaDesde.value) params.fechaDesde = filtroFechaDesde.value
    if (filtroFechaHasta.value) params.fechaHasta = filtroFechaHasta.value
    const res = await api.get('/operaciones/ventas', { params })
    const d = apiResponse.unwrap(res) as any
    ventas.value = d.items ?? d
    total.value = d.total ?? ventas.value.length
  } catch {
    notify.error('Error al cargar ventas')
  } finally {
    loading.value = false
  }
}

async function fetchCatalogos() {
  const [rc, rp] = await Promise.allSettled([
    api.get('/catalogos/clientes', { params: { activo: 'true', limit: 500 } }),
    api.get('/catalogos/productos', { params: { activo: 'true', limit: 500 } }),
  ])
  if (rc.status === 'fulfilled') {
    const d = apiResponse.unwrap(rc.value) as any
    clientes.value = d.items ?? d
  }
  if (rp.status === 'fulfilled') {
    const d = apiResponse.unwrap(rp.value) as any
    productos.value = d.items ?? d
  }
  const fallas: string[] = []
  if (rc.status === 'rejected') fallas.push('clientes')
  if (rp.status === 'rejected') fallas.push('productos')
  if (fallas.length) {
    notify.error(`No se pudieron cargar catalogos: ${fallas.join(', ')}`)
  }
}

function abrirNuevaVenta() {
  ventaEditando.value = null
  nvForm.clienteId = undefined
  nvForm.fechaVenta = todayISO()
  nvForm.notas = ''
  nvForm.detalles = []
  fetchCatalogos()
  modalNueva.value = true
}

async function abrirEditarVenta(v: any) {
  try {
    ventaEditando.value = v
    await fetchCatalogos()
    const res = await api.get(`/operaciones/ventas/${v.id}`)
    const venta = apiResponse.unwrap(res) as any
    ventaEditando.value = venta
    nvForm.clienteId = venta.clienteId
    nvForm.fechaVenta = venta.fecha?.split('T')[0] ?? todayISO()
    nvForm.notas = ''
    nvForm.detalles = (venta.detalles ?? []).map((d: any) => ({
      productoId: d.productoId,
      cantidad: Number(d.cantidad ?? 1),
      precioUnitario: Number(d.precioUnitario ?? 0),
    }))
    modalNueva.value = true
  } catch {
    notify.error('No se pudo cargar la venta para editar')
  }
}

function agregarDetalle() {
  nvForm.detalles.push({ productoId: undefined, cantidad: 1, precioUnitario: 0 })
}

function onProductoSelect(detalle: any) {
  const prod = productos.value.find(p => p.id === detalle.productoId)
  if (prod) detalle.precioUnitario = prod.precioVenta ?? prod.precio ?? 0
}

function onClienteChange() {
  // could load special prices later
}

async function crearVenta() {
  if (!validarNuevaVenta()) return
  saving.value = true
  try {
    const detallesValidos = nvForm.detalles.filter(d => d.productoId && d.cantidad > 0 && d.precioUnitario > 0)
    const payload: Record<string, any> = {
      clienteId: nvForm.clienteId,
      fecha: nvForm.fechaVenta,
      detalles: detallesValidos.map(d => ({
        productoId: d.productoId,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
      })),
      observaciones: nvForm.notas || undefined,
    }
    if (ventaEditando.value) {
      await api.patch(`/operaciones/ventas/${ventaEditando.value.id}`, {
        clienteId: payload.clienteId,
        fecha: payload.fecha,
        detalles: payload.detalles,
        observaciones: payload.observaciones,
      })
      notify.success('Venta actualizada')
    } else {
      await api.post('/operaciones/ventas', payload)
      notify.success('Venta creada')
    }
    modalNueva.value = false
    ventaEditando.value = null
    await fetchVentas()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al guardar venta')
  } finally {
    saving.value = false
  }
}

function puedeEditarVenta(v: any) {
  return !v.liquidacionRutaId && v.estado !== 'CANCELADA' && Number(v.totalPagado ?? 0) <= 0
}

function puedeEliminarVenta(v: any) {
  return !v.liquidacionRutaId
}

async function eliminarVenta(v: any) {
  if (!window.confirm(`Eliminar la venta ${v.numero}?`)) return
  saving.value = true
  try {
    await api.delete(`/operaciones/ventas/${v.id}`)
    notify.success(`Venta ${v.numero} eliminada`)
    await fetchVentas()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'No se pudo eliminar la venta')
  } finally {
    saving.value = false
  }
}

function abrirPago(v: any) {
  ventaPago.value = v
  pagoForm.formaPago = 'EFECTIVO'
  pagoForm.montoEfectivo = Number(v.saldoPendiente ?? 0)
  pagoForm.montoTransferencia = 0
  pagoForm.referencia = ''
  pagoForm.notas = ''
  modalPago.value = true
}

function onFormaPagoChange() {
  const saldo = Number(ventaPago.value?.saldoPendiente ?? 0)
  if (pagoForm.formaPago === 'EFECTIVO') {
    pagoForm.montoEfectivo = saldo
    pagoForm.montoTransferencia = 0
  } else if (pagoForm.formaPago === 'TRANSFERENCIA') {
    pagoForm.montoEfectivo = 0
    pagoForm.montoTransferencia = saldo
  } else if (pagoForm.formaPago === 'AMBOS') {
    pagoForm.montoEfectivo = Math.min(Number(pagoForm.montoEfectivo ?? 0), saldo)
    pagoForm.montoTransferencia = Math.max(0, saldo - pagoForm.montoEfectivo)
  }
}

async function registrarPago() {
  if (!ventaPago.value) return
  if (totalPagoForm.value <= 0) {
    notify.error('El monto del pago debe ser mayor a cero')
    return
  }
  if (pagoForm.formaPago === 'AMBOS' && (pagoForm.montoEfectivo <= 0 || pagoForm.montoTransferencia <= 0)) {
    notify.error('Indica monto en efectivo y monto por transferencia')
    return
  }
  if (totalPagoForm.value > Number(ventaPago.value.saldoPendiente ?? 0)) {
    notify.error('El pago no puede superar el saldo pendiente')
    return
  }

  saving.value = true
  try {
    await api.post(`/operaciones/ventas/${ventaPago.value.id}/pagos`, {
      tipo: pagoForm.formaPago,
      monto: totalPagoForm.value,
      montoEfectivo: pagoForm.formaPago === 'EFECTIVO' || pagoForm.formaPago === 'AMBOS'
        ? pagoForm.montoEfectivo
        : undefined,
      montoTransferencia: pagoForm.formaPago === 'TRANSFERENCIA' || pagoForm.formaPago === 'AMBOS'
        ? pagoForm.montoTransferencia
        : undefined,
      referencia: pagoForm.referencia || undefined,
      observaciones: pagoForm.notas || undefined,
    })
    notify.success('Pago registrado')
    modalPago.value = false
    await fetchVentas()
    if (modalDetalle.value && ventaDetalle.value?.id === ventaPago.value.id) {
      const res = await api.get(`/operaciones/ventas/${ventaPago.value.id}`)
      ventaDetalle.value = apiResponse.unwrap(res)
    }
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al registrar pago')
  } finally {
    saving.value = false
  }
}

async function verDetalle(v: any) {
  try {
    const res = await api.get(`/operaciones/ventas/${v.id}`)
    ventaDetalle.value = apiResponse.unwrap(res)
  } catch {
    ventaDetalle.value = v
    notify.error('No se pudo cargar el detalle completo de la venta')
  }
  modalDetalle.value = true
}

onMounted(fetchVentas)
</script>
