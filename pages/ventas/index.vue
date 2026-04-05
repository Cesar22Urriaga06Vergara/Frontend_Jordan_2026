<template>
  <div class="p-6 space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <h1 class="text-2xl font-bold text-gray-800">Ventas</h1>
      <button class="btn-primary" @click="abrirNuevaVenta">+ Nueva venta</button>
    </div>

    <!-- Filtros -->
    <div class="card flex flex-wrap gap-3">
      <select v-model="filtroEstado" class="form-input w-40" @change="pagina = 1; fetchVentas()">
        <option value="">Todos los estados</option>
        <option value="COMPLETADA">Completada</option>
        <option value="PARCIAL">Parcial</option>
        <option value="PENDIENTE">Pendiente</option>
      </select>
      <input v-model="filtroFechaDesde" type="date" class="form-input w-40" @change="pagina = 1; fetchVentas()" />
      <input v-model="filtroFechaHasta" type="date" class="form-input w-40" @change="pagina = 1; fetchVentas()" />
    </div>

    <!-- Tabla -->
    <div class="card overflow-x-auto p-0">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b text-xs uppercase">
            <th class="px-4 py-3 font-medium">Número</th>
            <th class="px-4 py-3 font-medium">Fecha</th>
            <th class="px-4 py-3 font-medium">Cliente</th>
            <th class="px-4 py-3 font-medium text-right">Total</th>
            <th class="px-4 py-3 font-medium text-right">Saldo</th>
            <th class="px-4 py-3 font-medium">Estado</th>
            <th class="px-4 py-3 font-medium text-right">Acciones</th>
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
                  class="text-xs text-blue-600 hover:underline"
                  @click="abrirPago(v)"
                >Registrar pago</button>
                <button class="text-xs text-gray-500 hover:underline" @click="verDetalle(v)">Ver</button>
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
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 class="font-bold text-gray-800">Nueva venta</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Cliente *">
            <select v-model="nvForm.clienteId" class="form-input" @change="onClienteChange">
              <option :value="undefined">Seleccionar…</option>
              <option v-for="c in clientes" :key="c.id" :value="c.id">{{ c.nombre }}</option>
            </select>
          </FormField>
          <FormField label="Fecha venta *">
            <input v-model="nvForm.fechaVenta" type="date" class="form-input" />
          </FormField>
          <FormField label="Monto pagado ($)">
            <input v-model.number="nvForm.montoPagado" class="form-input" type="number" min="0" />
          </FormField>
          <FormField label="Forma de pago">
            <select v-model="nvForm.formaPago" class="form-input">
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
          </FormField>
          <FormField label="Notas" class="col-span-2">
            <textarea v-model="nvForm.notas" rows="2" class="form-input resize-none" />
          </FormField>
        </div>

        <!-- Detalles -->
        <div class="border-t pt-4">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-semibold text-sm text-gray-700">Productos</h3>
            <button class="text-xs text-blue-600 hover:underline" @click="agregarDetalle">+ Añadir línea</button>
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

          <div class="text-right font-semibold text-gray-800 mt-2">
            Total: {{ formatCurrency(totalNueva) }}
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button class="btn-secondary" @click="modalNueva = false">Cancelar</button>
          <button class="btn-primary" :disabled="saving || !nvForm.clienteId || !nvForm.detalles.length" @click="crearVenta">
            {{ saving ? 'Guardando…' : 'Crear venta' }}
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
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 class="font-bold text-gray-800">Registrar pago</h2>
        <p class="text-sm text-gray-500">
          Venta: {{ ventaPago?.numero }} — Saldo pendiente: {{ formatCurrency(ventaPago?.saldoPendiente) }}
        </p>

        <FormField label="Monto *">
          <input v-model.number="pagoForm.monto" class="form-input" type="number" min="0" />
        </FormField>
        <FormField label="Forma de pago">
          <select v-model="pagoForm.formaPago" class="form-input">
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia</option>
          </select>
        </FormField>
        <FormField label="Referencia">
          <input v-model="pagoForm.referencia" class="form-input" type="text" />
        </FormField>
        <FormField label="Notas">
          <textarea v-model="pagoForm.notas" rows="2" class="form-input resize-none" />
        </FormField>

        <div class="flex justify-end gap-2 pt-2">
          <button class="btn-secondary" @click="modalPago = false">Cancelar</button>
          <button class="btn-primary" :disabled="saving || !pagoForm.monto" @click="registrarPago">
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
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
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

definePageMeta({ middleware: 'auth' })

const api = useApi()
const notify = useNotification()
const apiResponse = useApiResponse()

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
const nvForm = reactive({
  clienteId: undefined as number | undefined,
  fechaVenta: todayISO(),
  montoPagado: 0,
  formaPago: 'EFECTIVO',
  notas: '',
  detalles: [] as { productoId: number | undefined; cantidad: number; precioUnitario: number }[],
})

const totalNueva = computed(() =>
  nvForm.detalles.reduce((s, d) => s + (d.cantidad ?? 0) * (d.precioUnitario ?? 0), 0)
)

// Pago
const modalPago = ref(false)
const ventaPago = ref<any>(null)
const pagoForm = reactive({ monto: 0, formaPago: 'EFECTIVO', referencia: '', notas: '' })

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
  nvForm.clienteId = undefined
  nvForm.fechaVenta = todayISO()
  nvForm.montoPagado = 0
  nvForm.formaPago = 'EFECTIVO'
  nvForm.notas = ''
  nvForm.detalles = []
  fetchCatalogos()
  modalNueva.value = true
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
  const detallesValidos = nvForm.detalles.filter(d => d.productoId && d.cantidad > 0 && d.precioUnitario > 0)
  if (!detallesValidos.length) { notify.error('Agrega al menos un producto'); return }
  if (nvForm.montoPagado < 0) { notify.error('El monto pagado no puede ser negativo'); return }
  if (nvForm.montoPagado > totalNueva.value) {
    notify.error('El monto pagado inicial no puede superar el total de la venta')
    return
  }
  saving.value = true
  try {
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
    if (nvForm.montoPagado > 0) {
      payload.montoPagado = nvForm.montoPagado
      payload.tipoPago = nvForm.formaPago
    }
    await api.post('/operaciones/ventas', payload)
    notify.success('Venta creada')
    modalNueva.value = false
    await fetchVentas()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al crear venta')
  } finally {
    saving.value = false
  }
}

function abrirPago(v: any) {
  ventaPago.value = v
  pagoForm.monto = v.saldoPendiente
  pagoForm.formaPago = 'EFECTIVO'
  pagoForm.referencia = ''
  pagoForm.notas = ''
  modalPago.value = true
}

async function registrarPago() {
  if (!ventaPago.value) return
  if (pagoForm.monto <= 0) {
    notify.error('El monto del pago debe ser mayor a cero')
    return
  }
  if (pagoForm.monto > Number(ventaPago.value.saldoPendiente ?? 0)) {
    notify.error('El pago no puede superar el saldo pendiente')
    return
  }

  saving.value = true
  try {
    await api.post(`/operaciones/ventas/${ventaPago.value.id}/pagos`, {
      tipo: pagoForm.formaPago,
      monto: pagoForm.monto,
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
