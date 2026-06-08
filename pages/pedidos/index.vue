<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p class="mt-1 text-sm text-gray-600">Seguimiento operativo con cliente, direccion, trabajador y productos.</p>
      </div>
      <button
        type="button"
        class="btn-primary flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50 sm:justify-start"
        :disabled="!jornadaAbierta"
        @click="irANuevoPedido"
      >
        <Plus :size="16" /> Nuevo pedido
      </button>
    </div>

    <div class="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div class="flex flex-wrap items-end gap-3">
        <div class="min-w-40 flex-1">
          <label class="mb-1 block text-xs font-medium text-gray-700">Estado</label>
          <select v-model="filters.estado" class="form-input w-full" @change="loadPedidos">
            <option value="">Todos los estados</option>
            <option v-for="e in estados" :key="e.value" :value="e.value">{{ e.label }}</option>
          </select>
        </div>
        <div class="min-w-36 flex-1">
          <label class="mb-1 block text-xs font-medium text-gray-700">Desde</label>
          <input v-model="filters.fechaDesde" type="date" class="form-input w-full" @change="loadPedidos" />
        </div>
        <div class="min-w-36 flex-1">
          <label class="mb-1 block text-xs font-medium text-gray-700">Hasta</label>
          <input v-model="filters.fechaHasta" type="date" class="form-input w-full" @change="loadPedidos" />
        </div>
      </div>
      <div class="flex items-center justify-between text-xs text-gray-500">
        <span>
          {{ pedidos.length > 0 ? `Mostrando ${pedidos.length} pedido(s)` : 'Sin resultados' }}
        </span>
      </div>
    </div>

    <div class="grid gap-3 lg:hidden">
      <div v-if="loading" class="rounded-lg border border-gray-200 bg-white py-8 text-center text-sm text-gray-400">
        Cargando...
      </div>
      <div v-else-if="!pedidos.length" class="rounded-lg border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400">
        Sin resultados. Intenta ajustar los filtros o crear un nuevo pedido.
      </div>
      <template v-else>
        <article
          v-for="p in pedidos"
          :key="`card-${p.id}`"
          class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate font-mono text-xs text-gray-500">{{ p.numero }}</p>
              <h2 class="mt-1 truncate text-base font-semibold text-gray-900">{{ p.cliente?.nombre ?? 'Sin cliente' }}</h2>
            </div>
            <EstadoBadge :estado="p.estado" />
          </div>

          <p class="mt-3 flex items-start gap-1.5 text-xs text-gray-500">
            <MapPin class="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-300" />
            <span>{{ direccionPedido(p) }}</span>
          </p>

          <div class="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p class="font-semibold uppercase text-gray-400">Trabajador</p>
              <p class="mt-0.5 text-gray-700">{{ p.trabajador?.nombre ?? '-' }}</p>
            </div>
            <div>
              <p class="font-semibold uppercase text-gray-400">Fecha</p>
              <p class="mt-0.5 text-gray-700">{{ formatDate(p.fecha) }}</p>
            </div>
          </div>

          <div class="mt-3 rounded-md bg-gray-50 p-3">
            <p class="text-xs font-semibold uppercase text-gray-400">Productos</p>
            <p class="mt-1 text-sm font-medium text-gray-800">{{ resumenProductos(p) }}</p>
            <p class="text-xs text-gray-400">{{ p.detalles?.length ?? 0 }} linea(s)</p>
          </div>

          <div class="mt-3 grid grid-cols-4 gap-2">
            <button class="pedido-action text-blue-600 hover:bg-blue-50" title="Ver pedido" @click="verDetalle(p)">
              <Eye :size="16" />
              <span class="sr-only">Ver</span>
            </button>
            <NuxtLink
              v-if="['PENDIENTE', 'CARGADO_EN_RUTA'].includes(p.estado)"
              :to="`/pedidos/${p.id}/edit`"
              class="pedido-action text-amber-600 hover:bg-amber-50"
              title="Editar pedido"
            >
              <Pencil :size="16" />
              <span class="sr-only">Editar</span>
            </NuxtLink>
            <span v-else class="pedido-action cursor-not-allowed text-gray-300">
              <Pencil :size="16" />
            </span>
            <button
              class="pedido-action text-green-600 hover:bg-green-50 disabled:opacity-40"
              :disabled="printingId === p.id"
              title="Imprimir comprobante"
              @click="imprimir(p)"
            >
              <Printer :size="16" />
              <span class="sr-only">Imprimir</span>
            </button>
            <button
              class="pedido-action text-red-600 hover:bg-red-50 disabled:opacity-40"
              :disabled="deletingId === p.id"
              title="Eliminar pedido"
              @click="confirmarEliminarPedido(p)"
            >
              <Trash2 :size="16" />
              <span class="sr-only">Eliminar</span>
            </button>
          </div>
        </article>
      </template>
    </div>

    <div class="hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm lg:block">
      <table class="w-full table-fixed text-sm">
        <thead class="border-b-2 border-gray-200 bg-gray-50">
          <tr class="text-left text-xs uppercase tracking-wide text-gray-600">
            <th class="w-[13%] px-3 py-3 font-bold">Numero</th>
            <th class="w-[23%] px-3 py-3 font-bold">Cliente / Direccion</th>
            <th class="w-[11%] px-3 py-3 font-bold">Trabajador</th>
            <th class="w-[10%] px-3 py-3 font-bold">Fecha</th>
            <th class="w-[12%] px-3 py-3 font-bold">Estado</th>
            <th class="w-[20%] px-3 py-3 font-bold">Productos</th>
            <th class="w-[11%] px-3 py-3 text-center font-bold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="py-8 text-center text-gray-400">Cargando...</td>
          </tr>
          <tr v-else-if="!pedidos.length">
            <td colspan="7" class="py-8 text-center text-gray-400">Sin resultados. Intenta ajustar los filtros o crear un nuevo pedido.</td>
          </tr>
          <tr v-for="p in pedidos" :key="p.id" class="border-b border-gray-100 transition-colors hover:bg-blue-50/60">
            <td class="px-3 py-3 text-left font-mono text-xs text-gray-500">
              <span class="block truncate">{{ p.numero }}</span>
            </td>
            <td class="px-3 py-3 text-left">
              <p class="truncate font-semibold text-gray-900">{{ p.cliente?.nombre ?? 'Sin cliente' }}</p>
              <p class="mt-1 flex items-start gap-1.5 text-xs text-gray-500">
                <MapPin class="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-300" />
                <span class="line-clamp-2">{{ direccionPedido(p) }}</span>
              </p>
            </td>
            <td class="px-3 py-3 text-left text-gray-700">
              <span class="block truncate">{{ p.trabajador?.nombre ?? '-' }}</span>
            </td>
            <td class="whitespace-nowrap px-3 py-3 text-left text-gray-700">{{ formatDate(p.fecha) }}</td>
            <td class="px-3 py-3 text-left"><EstadoBadge :estado="p.estado" /></td>
            <td class="px-3 py-3 text-left text-gray-700">
              <p class="line-clamp-2 font-medium">{{ resumenProductos(p) }}</p>
              <p class="text-xs text-gray-400">{{ p.detalles?.length ?? 0 }} linea(s)</p>
            </td>
            <td class="px-3 py-3 text-center">
              <div class="flex items-center justify-center gap-1.5">
                <button class="pedido-action text-blue-600 hover:bg-blue-50" title="Ver pedido" @click="verDetalle(p)">
                  <Eye :size="15" />
                  <span class="sr-only">Ver</span>
                </button>
                <NuxtLink
                  v-if="['PENDIENTE', 'CARGADO_EN_RUTA'].includes(p.estado)"
                  :to="`/pedidos/${p.id}/edit`"
                  class="pedido-action text-amber-600 hover:bg-amber-50"
                  title="Editar pedido"
                >
                  <Pencil :size="15" />
                  <span class="sr-only">Editar</span>
                </NuxtLink>
                <button
                  class="pedido-action text-green-600 hover:bg-green-50 disabled:opacity-40"
                  :disabled="printingId === p.id"
                  title="Imprimir comprobante"
                  @click="imprimir(p)"
                >
                  <Printer :size="15" />
                  <span class="sr-only">Imprimir</span>
                </button>
                <button
                  class="pedido-action text-red-600 hover:bg-red-50 disabled:opacity-40"
                  :disabled="deletingId === p.id"
                  title="Eliminar pedido"
                  @click="confirmarEliminarPedido(p)"
                >
                  <Trash2 :size="15" />
                  <span class="sr-only">Eliminar</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex items-center justify-between text-sm text-gray-500">
      <span>{{ pagination.total }} pedidos</span>
      <div class="flex gap-2">
        <button :disabled="pagination.page <= 1" class="rounded border px-3 py-1 hover:bg-gray-50 disabled:opacity-40" @click="changePage(-1)">&lt;</button>
        <span class="px-3 py-1">{{ pagination.page }} / {{ pagination.totalPages }}</span>
        <button :disabled="pagination.page >= pagination.totalPages" class="rounded border px-3 py-1 hover:bg-gray-50 disabled:opacity-40" @click="changePage(1)">&gt;</button>
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
import { Eye, MapPin, Pencil, Plus, Printer, Trash2 } from 'lucide-vue-next'

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
  return p.cliente?.direccion || p.direccionEntrega || p.direccion || 'Sin direccion registrada'
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

<style scoped>
.pedido-action {
  @apply inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent transition-colors;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
