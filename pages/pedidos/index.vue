<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p class="text-sm text-gray-600 mt-1">Seguimiento operativo con cliente, dirección, trabajador y productos.</p>
      </div>
      <button
        type="button"
        class="btn-primary flex items-center gap-2 justify-center sm:justify-start disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="!jornadaAbierta"
        @click="irANuevoPedido"
      >
        <Plus :size="16" /> Nuevo pedido
      </button>
    </div>

    <!-- Filtros -->
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
            <th class="px-4 py-4 font-bold">Cliente / Dirección</th>
            <th class="px-4 py-4 font-bold">Trabajador</th>
            <th class="px-4 py-4 font-bold">Fecha</th>
            <th class="px-4 py-4 font-bold">Estado</th>
            <th class="px-4 py-4 font-bold">Productos</th>
            <th class="px-4 py-4 font-bold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="py-8 text-center text-gray-400">Cargando...</td>
          </tr>
          <tr v-else-if="!pedidos.length">
            <td colspan="7" class="py-8 text-center text-gray-400">Sin resultados. Intenta ajustar los filtros o crear un nuevo pedido.</td>
          </tr>
          <tr v-for="p in pedidos" :key="p.id" class="border-b border-gray-100 hover:bg-blue-50 transition-colors">
            <td class="px-4 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">{{ p.numero }}</td>
            <td class="px-4 py-4 min-w-64">
              <p class="font-semibold text-gray-900">{{ p.cliente?.nombre ?? 'Sin cliente' }}</p>
              <p class="mt-1 flex items-start gap-1.5 text-xs text-gray-500">
                <MapPin class="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-300" />
                <span>{{ direccionPedido(p) }}</span>
              </p>
            </td>
            <td class="px-4 py-4 text-gray-700">{{ p.trabajador?.nombre ?? '-' }}</td>
            <td class="px-4 py-4 text-gray-700">{{ formatDate(p.fecha) }}</td>
            <td class="px-4 py-4"><EstadoBadge :estado="p.estado" /></td>
            <td class="px-4 py-4 text-gray-700 min-w-48">
              <p class="font-medium">{{ resumenProductos(p) }}</p>
              <p class="text-xs text-gray-400">{{ p.detalles?.length ?? 0 }} línea(s)</p>
            </td>
            <td class="px-4 py-4 text-center">
              <div class="flex gap-2 justify-center flex-wrap">
                <button class="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded text-xs font-medium transition-colors" @click="verDetalle(p)">Ver</button>
                <NuxtLink
                  v-if="['PENDIENTE', 'CARGADO_EN_RUTA'].includes(p.estado)"
                  :to="`/pedidos/${p.id}/edit`"
                  class="text-amber-600 hover:text-amber-800 hover:bg-amber-50 px-2 py-1 rounded text-xs font-medium transition-colors"
                >
                  Editar
                </NuxtLink>
                <button
                  class="flex items-center gap-1 text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-40"
                  :disabled="printingId === p.id"
                  @click="imprimir(p)"
                >
                  <Printer :size="12" />
                  {{ printingId === p.id ? '...' : 'Imprimir' }}
                </button>
                <button
                  class="flex items-center gap-1 text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-40"
                  :disabled="deletingId === p.id"
                  @click="confirmarEliminarPedido(p)"
                >
                  <Trash2 :size="12" />
                  Eliminar
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

    <ModalConfirmacion
      ref="modalEliminarPedido"
      titulo="Eliminar pedido"
      descripcion="El pedido se eliminara definitivamente si aun no tiene venta ni historial operativo."
      textoConfirm="Eliminar"
      textoCancel="Cancelar"
      :detalles="{ Pedido: pedidoAEliminar?.numero, Cliente: pedidoAEliminar?.cliente?.nombre }"
      advertencia="Para pedidos ya entregados o facturados usa cancelar/anular segun corresponda."
      @confirm="eliminarPedido"
      @cancel="cerrarEliminarPedido"
    />
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '~/utils/formats'
import { MapPin, Plus, Printer, Trash2 } from 'lucide-vue-next'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const { error, success } = useNotification()
const apiResponse = useApiResponse()
const { imprimirPedido } = usePrintTicket()
const { jornadaAbierta, fetchEstadoJornada, requireJornadaAbierta } = useJornadaOperativa()

const printingId = ref<number | null>(null)
const deletingId = ref<number | null>(null)
const pedidoAEliminar = ref<any>(null)
const modalEliminarPedido = ref()

const loading = ref(false)
const saving = ref(false)
const pedidos = ref<any[]>([])
const pagination = reactive({ page: 1, total: 0, totalPages: 1 })

const estados = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'CARGADO_EN_RUTA', label: 'En ruta' },
  { value: 'ENTREGADO', label: 'Entregado' },
  { value: 'REPROGRAMADO', label: 'Reprogramado' },
  { value: 'CANCELADO', label: 'Cancelado' },
]

const filters = reactive({ estado: '', fechaDesde: '', fechaHasta: '' })

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

function direccionPedido(p: any) {
  return p.cliente?.direccion || p.direccionEntrega || p.direccion || 'Sin dirección registrada'
}

function resumenProductos(p: any) {
  const detalles = Array.isArray(p.detalles) ? p.detalles : []
  if (!detalles.length) return 'Sin productos'
  const nombres = detalles.slice(0, 2).map((d: any) => {
    const nombre = d.producto?.nombre ?? d.productoNombre ?? `Producto ${d.productoId ?? ''}`.trim()
    const cantidad = Number(d.cantidad ?? 0)
    return cantidad > 0 ? `${cantidad} ${nombre}` : nombre
  })
  const faltantes = detalles.length - nombres.length
  return faltantes > 0 ? `${nombres.join(', ')} +${faltantes}` : nombres.join(', ')
}

function irANuevoPedido() {
  if (!requireJornadaAbierta()) return
  navigateTo('/pedidos/create')
}

function confirmarEliminarPedido(p: any) {
  pedidoAEliminar.value = p
  modalEliminarPedido.value?.open()
}

function cerrarEliminarPedido() {
  pedidoAEliminar.value = null
  modalEliminarPedido.value?.close()
}

async function eliminarPedido() {
  if (!pedidoAEliminar.value) return
  deletingId.value = pedidoAEliminar.value.id
  try {
    await api.delete(`/operaciones/pedidos/${pedidoAEliminar.value.id}`)
    success(`Pedido ${pedidoAEliminar.value.numero} eliminado`)
    await loadPedidos()
  } catch (e: any) {
    error(e?.response?.data?.message || 'No se pudo eliminar el pedido')
  } finally {
    deletingId.value = null
    cerrarEliminarPedido()
  }
}

function changePage(delta: number) {
  pagination.page = Math.max(1, Math.min(pagination.totalPages, pagination.page + delta))
  loadPedidos()
}

onMounted(async () => {
  await Promise.all([fetchEstadoJornada(), loadPedidos()])
})
</script>
