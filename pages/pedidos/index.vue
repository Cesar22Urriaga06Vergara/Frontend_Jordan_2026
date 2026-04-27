<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p class="text-sm text-gray-600 mt-1">Gestión y seguimiento de pedidos</p>
      </div>
      <button class="btn-primary flex items-center gap-2 justify-center sm:justify-start" @click="openModal">
        <Plus :size="16" /> Nuevo pedido
      </button>
    </div>

    <!-- Filtros Mejorados -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
      <div class="flex gap-3 flex-wrap items-end">
        <div class="flex-1 min-w-40">
          <label class="block text-xs font-medium text-gray-700 mb-1">Estado</label>
          <select v-model="filters.estado" class="form-input w-full" @change="loadPedidos">
            <option value="">Todos los estados</option>
            <option v-for="e in estados" :key="e.value" :value="e.value">{{ e.label }}</option>
          </select>
        </div>
        <div class="flex-1 min-w-36">
          <label class="block text-xs font-medium text-gray-700 mb-1">Desde</label>
          <input v-model="filters.fechaDesde" type="date" class="form-input w-full" @change="loadPedidos" />
        </div>
        <div class="flex-1 min-w-36">
          <label class="block text-xs font-medium text-gray-700 mb-1">Hasta</label>
          <input v-model="filters.fechaHasta" type="date" class="form-input w-full" @change="loadPedidos" />
        </div>
      </div>
      <div class="text-xs text-gray-500 flex items-center justify-between">
        <span>
          {{ pedidos.length > 0 ? `Mostrando ${pedidos.length} pedido(s)` : 'Sin resultados' }}
        </span>
      </div>
    </div>

    <!-- Tabla -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300">
          <tr class="text-center text-gray-700 text-xs uppercase tracking-wide">
            <th class="px-4 py-4 font-bold">Número</th>
            <th class="px-4 py-4 font-bold">Cliente</th>
            <th class="px-4 py-4 font-bold">Fecha</th>
            <th class="px-4 py-4 font-bold">Estado</th>
            <th class="px-4 py-4 font-bold">Items</th>
            <th class="px-4 py-4 font-bold">Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="py-8 text-center text-gray-400">Cargando...</td>
          </tr>
          <tr v-else-if="!pedidos.length">
            <td colspan="6" class="py-8 text-center text-gray-400">Sin resultados. Intenta ajustar los filtros o crear un nuevo pedido.</td>
          </tr>
          <tr v-for="p in pedidos" :key="p.id" class="border-b border-gray-100 hover:bg-blue-50 transition-colors">
            <td class="px-4 py-4 font-mono text-xs text-gray-500">{{ p.numero }}</td>
            <td class="px-4 py-4 font-semibold text-gray-900">{{ p.cliente?.nombre }}</td>
            <td class="px-4 py-4 text-gray-700">{{ formatDate(p.fecha) }}</td>
            <td class="px-4 py-4"><EstadoBadge :estado="p.estado" /></td>
            <td class="px-4 py-4 text-right text-gray-700 font-medium">{{ p.detalles?.length ?? 0 }}</td>
            <td class="px-4 py-4 text-center">
              <div class="flex gap-2 justify-center flex-wrap">
                <button class="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded text-xs font-medium transition-colors" @click="verDetalle(p)">Ver</button>
                <button 
                  v-if="p.estado === 'PENDIENTE'"
                  class="text-amber-600 hover:text-amber-800 hover:bg-amber-50 px-2 py-1 rounded text-xs font-medium transition-colors" 
                  @click="abrirModalEditar(p)"
                >
                  Editar
                </button>
                <button
                  class="flex items-center gap-1 text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-40"
                  :disabled="printingId === p.id"
                  @click="imprimir(p)"
                >
                  <Printer :size="12" />
                  {{ printingId === p.id ? '...' : 'Imprimir' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between mt-4 text-sm text-gray-500">
      <span>{{ pagination.total }} pedidos</span>
      <div class="flex gap-2">
        <button :disabled="pagination.page <= 1" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-50" @click="changePage(-1)">←</button>
        <span class="px-3 py-1">{{ pagination.page }} / {{ pagination.totalPages }}</span>
        <button :disabled="pagination.page >= pagination.totalPages" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-50" @click="changePage(1)">→</button>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
          <h3 class="font-semibold text-gray-800 mb-4">{{ editandoPedidoId ? 'Editar pedido' : 'Nuevo pedido' }}</h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <FormField label="Cliente" required>
              <input 
                v-if="editandoPedidoId"
                type="text" 
                class="form-input bg-gray-100" 
                :value="form.clienteNombre"
                disabled
              />
              <select v-else v-model="form.clienteId" class="form-input">
                <option :value="undefined">Seleccionar…</option>
                <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">{{ cliente.nombre }}</option>
              </select>
            </FormField>
            <FormField label="Fecha" required>
              <input v-model="form.fecha" type="date" class="form-input" />
            </FormField>
          </div>

          <div class="space-y-3 mb-4">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700">Detalles</span>
              <button class="text-xs text-blue-600 hover:underline" @click="agregarDetalle">+ Añadir producto</button>
            </div>
            <div v-for="(detalle, index) in form.detalles" :key="index" class="grid grid-cols-[1fr_90px_120px_32px] gap-2 items-end">
              <select v-model="detalle.productoId" class="form-input">
                <option :value="undefined">Producto…</option>
                <option v-for="producto in productos" :key="producto.id" :value="producto.id">{{ producto.nombre }}</option>
              </select>
              <input v-model.number="detalle.cantidad" class="form-input" type="number" min="1" placeholder="Cant." />
              <input v-model.number="detalle.precioUnitario" class="form-input" type="number" min="1" placeholder="Precio" />
              <button class="text-red-500 text-lg" @click="form.detalles.splice(index, 1)">×</button>
            </div>
          </div>

          <FormField label="Observaciones">
            <textarea v-model="form.observaciones" rows="2" class="form-input resize-none" />
          </FormField>

          <div class="flex justify-end gap-3 pt-4">
            <button type="button" class="btn-secondary" @click="cerrarModal">Cancelar</button>
            <button 
              type="button" 
              class="btn-primary" 
              :disabled="saving || (editandoPedidoId ? !form.detalles.length : (!form.clienteId || !form.detalles.length))"
              @click="editandoPedidoId ? actualizarPedido() : crearPedido()"
            >
              {{ saving ? 'Guardando…' : (editandoPedidoId ? 'Actualizar' : 'Guardar') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { formatDate, todayISO } from '~/utils/formats'
import { Plus, Printer } from 'lucide-vue-next'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const { error, success } = useNotification()
const apiResponse = useApiResponse()
const { imprimirPedido } = usePrintTicket()

const printingId = ref<number | null>(null)

const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editandoPedidoId = ref<number | null>(null)
const pedidos = ref<any[]>([])
const clientes = ref<any[]>([])
const productos = ref<any[]>([])
const pagination = reactive({ page: 1, total: 0, totalPages: 1 })

const estados = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'CARGADO_EN_RUTA', label: 'En ruta' },
  { value: 'ENTREGADO', label: 'Entregado' },
  { value: 'REPROGRAMADO', label: 'Reprogramado' },
  { value: 'CANCELADO', label: 'Cancelado' },
]

const filters = reactive({ estado: '', fechaDesde: '', fechaHasta: '' })
const form = reactive({
  clienteId: undefined as number | undefined,
  clienteNombre: '',
  fecha: todayISO(),
  detalles: [] as { productoId: number | undefined; cantidad: number; precioUnitario: number }[],
  observaciones: '',
})

async function loadPedidos() {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: String(pagination.page), limit: '15' })
    if (filters.estado) params.set('estado', filters.estado)
    if (filters.fechaDesde) params.set('fechaDesde', filters.fechaDesde)
    if (filters.fechaHasta) params.set('fechaHasta', filters.fechaHasta)

    const res = await api.get(`/operaciones/pedidos?${params}`)
    const d = apiResponse.unwrap(res) as any
    pedidos.value = d.data ?? []
    pagination.total = d.total ?? 0
    pagination.totalPages = d.totalPages ?? 1
  } catch {
    pedidos.value = []
    error('Error al cargar pedidos')
  } finally {
    loading.value = false
  }
}

async function loadCatalogos() {
  try {
    const [clientesRes, productosRes] = await Promise.all([
      api.get('/catalogos/clientes?activo=true&limit=200'),
      api.get('/catalogos/productos?activo=true&limit=200'),
    ])
    clientes.value = apiResponse.list(clientesRes)
    productos.value = apiResponse.list(productosRes)
  } catch {
    clientes.value = []
    productos.value = []
    error('Error al cargar catálogos')
  }
}

function openModal() {
  form.clienteId = undefined
  form.clienteNombre = ''
  form.fecha = todayISO()
  form.detalles = []
  form.observaciones = ''
  editandoPedidoId.value = null
  showModal.value = true
  if (!clientes.value.length || !productos.value.length) {
    loadCatalogos()
  }
}

function cerrarModal() {
  showModal.value = false
  editandoPedidoId.value = null
  form.clienteId = undefined
  form.clienteNombre = ''
  form.fecha = todayISO()
  form.detalles = []
  form.observaciones = ''
}

function abrirModalEditar(pedido: any) {
  editandoPedidoId.value = pedido.id
  form.clienteId = pedido.clienteId
  form.clienteNombre = pedido.cliente?.nombre || ''
  form.fecha = pedido.fecha?.split('T')[0] || todayISO()
  form.observaciones = pedido.observaciones || ''
  form.detalles = pedido.detalles.map((d: any) => ({
    productoId: d.productoId,
    cantidad: d.cantidad,
    precioUnitario: d.precioUnitario,
  }))
  showModal.value = true
  if (!clientes.value.length || !productos.value.length) {
    loadCatalogos()
  }
}

function agregarDetalle() {
  form.detalles.push({ productoId: undefined, cantidad: 1, precioUnitario: 0 })
}

async function crearPedido() {
  saving.value = true
  try {
    await api.post('/operaciones/pedidos', {
      clienteId: form.clienteId,
      fecha: form.fecha,
      detalles: form.detalles.filter(d => d.productoId && d.cantidad > 0 && d.precioUnitario > 0),
      observaciones: form.observaciones || undefined,
      esDeRuta: false,
    })
    success('Pedido creado')
    cerrarModal()
    pagination.page = 1
    await loadPedidos()
  } catch (e: any) {
    error(e?.response?.data?.message || 'Error al crear pedido')
  } finally {
    saving.value = false
  }
}

async function actualizarPedido() {
  if (!editandoPedidoId.value) return
  saving.value = true
  try {
    await api.patch(`/operaciones/pedidos/${editandoPedidoId.value}`, {
      fecha: form.fecha,
      detalles: form.detalles.filter(d => d.productoId && d.cantidad > 0 && d.precioUnitario > 0),
      observaciones: form.observaciones || undefined,
    })
    success('Pedido actualizado')
    cerrarModal()
    await loadPedidos()
  } catch (e: any) {
    error(e?.response?.data?.message || 'Error al actualizar pedido')
  } finally {
    saving.value = false
  }
}

async function imprimir(p: any) {
  printingId.value = p.id
  try {
    const res = await api.get(`/operaciones/pedidos/${p.id}`)
    const pedidoCompleto = apiResponse.unwrap(res)
    imprimirPedido(pedidoCompleto)
  } catch {
    error('No se pudo cargar el pedido para imprimir')
  } finally {
    printingId.value = null
  }
}

function verDetalle(p: any) {
  navigateTo(`/pedidos/${p.id}`)
}

function changePage(delta: number) {
  pagination.page = Math.max(1, Math.min(pagination.totalPages, pagination.page + delta))
  loadPedidos()
}

onMounted(loadPedidos)
</script>