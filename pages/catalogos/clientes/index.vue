<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Clientes</h1>
        <p class="text-sm text-gray-600 mt-1">Información comercial, contacto, dirección y precios especiales.</p>
      </div>
      <NuxtLink to="/catalogos/clientes/create" class="btn-primary flex items-center gap-2 justify-center sm:justify-start">
        <Plus :size="16" /> Nuevo cliente
      </NuxtLink>
    </div>

    <!-- Búsqueda y Filtros Mejorados -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
      <div class="flex gap-3 flex-wrap items-end">
        <div class="flex-1 min-w-64">
          <label class="block text-xs font-medium text-gray-700 mb-1">Búsqueda</label>
          <div class="relative">
            <input 
              v-model="searchQuery" 
              placeholder="Nombre, código, teléfono, dirección..."
              class="form-input w-full pl-10" 
            />
            <Search class="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </div>
        </div>
        <div class="w-48">
          <label class="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
          <select v-model="filtroTipo" class="form-input w-full">
            <option value="">Todos los tipos</option>
            <option v-for="tipo in TIPOS_CLIENTE" :key="tipo" :value="tipo">{{ tipo }}</option>
          </select>
        </div>
        <div class="w-44">
          <label class="block text-xs font-medium text-gray-700 mb-1">Estado</label>
          <select v-model="filtroActivo" class="form-input w-full">
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="hasActiveFilters"
            type="button"
            class="btn-secondary text-sm px-3 py-2"
            @click="clearFilters"
          >
            Limpiar filtros
          </button>
        </div>
      </div>
      <div class="text-xs text-gray-500 flex items-center gap-2">
        <span v-if="hasActiveFilters" class="inline-block">
          Filtros activos: {{ [searchQuery ? 'búsqueda' : '', filtroTipo ? 'tipo' : '', filtroActivo ? 'estado' : ''].filter(Boolean).join(', ') }}
        </span>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300 text-center text-gray-700 text-xs uppercase tracking-wide">
            <th class="px-4 py-4 font-bold">Código / Nombre</th>
            <th class="px-4 py-4 font-bold">Tipo</th>
            <th class="px-4 py-4 font-bold">Teléfono</th>
            <th class="px-4 py-4 font-bold">Dirección</th>
            <th class="px-4 py-4 font-bold">Documento</th>
            <th class="px-4 py-4 font-bold">Estado</th>
            <th class="px-4 py-4 font-bold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="px-4 py-8 text-center text-gray-400">Cargando...</td>
          </tr>
          <tr v-else-if="!clientes.length">
            <td colspan="7" class="px-4 py-8 text-center text-gray-400">Sin resultados. Intenta ajustar los filtros o crear un nuevo cliente.</td>
          </tr>
          <tr v-for="c in clientes" :key="c.id" class="border-b border-gray-100 hover:bg-blue-50 transition-colors">
            <td class="px-4 py-4">
              <p class="text-xs text-gray-400 font-mono">{{ c.codigo }}</p>
              <p class="font-semibold text-gray-900">{{ c.nombre }}</p>
            </td>
            <td class="px-4 py-4 text-gray-700">
              <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">{{ c.tipo }}</span>
            </td>
            <td class="px-4 py-4 text-gray-600">{{ c.telefono ?? '—' }}</td>
            <td class="px-4 py-4 text-gray-600 min-w-56">
              <div class="flex items-start gap-2">
                <MapPin class="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-300" />
                <div>
                  <p>{{ c.direccion || 'Sin dirección' }}</p>
                  <p v-if="c.vereda" class="text-xs text-gray-400">{{ c.vereda }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-4 text-gray-600">
              <template v-if="c.nit">
                <span class="text-xs text-gray-400 mr-1">NIT</span>{{ c.nit }}
              </template>
              <template v-else-if="c.cedula">
                <span class="text-xs text-gray-400 mr-1">CC</span>{{ c.cedula }}
              </template>
              <template v-else>—</template>
            </td>
            <td class="px-4 py-4">
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold" :class="c.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                <component :is="c.activo ? CheckCircle : XCircle" class="h-3.5 w-3.5" />
                <span>{{ c.activo ? 'Activo' : 'Inactivo' }}</span>
              </span>
            </td>
            <td class="px-4 py-4 text-right">
              <div class="flex justify-end gap-2 flex-wrap">
                <button class="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors" @click="abrirPrecios(c)">
                  <Eye :size="14" />
                  Precios
                </button>
                <NuxtLink :to="`/catalogos/clientes/${c.id}`" class="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded transition-colors">
                  <Edit :size="14" />
                  Editar
                </NuxtLink>
                <button class="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors" :class="c.activo ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-50' : 'text-green-600 hover:text-green-800 hover:bg-green-50'" @click="abrirConfirmDesactivar(c)">
                  <CheckCircle v-if="c.activo" :size="14" class="text-green-600" />
                  {{ c.activo ? 'Desactivar' : 'Activar' }}
                </button>
                <button class="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors" @click="confirmarEliminarCliente(c)">
                  <Trash2 :size="14" /> Eliminar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between text-sm text-gray-500">
      <span>{{ totalFiltrados }} clientes</span>
      <div class="flex gap-2">
        <button class="btn-secondary px-3 py-1 text-xs" :disabled="pagina === 1" @click="cambiarPagina(-1)">Ant.</button>
        <span class="px-2 py-1">{{ pagina }} / {{ totalPaginas }}</span>
        <button class="btn-secondary px-3 py-1 text-xs" :disabled="pagina >= totalPaginas" @click="cambiarPagina(1)">Sig.</button>
      </div>
    </div>

    <div v-if="modalPrecios" class="fixed inset-0 bg-black/40 flex items-stretch justify-center z-50 p-0 sm:items-center sm:p-4" @click.self="closeModalPrecios()">
      <div class="bg-white rounded-none shadow-xl w-full max-w-2xl p-4 sm:rounded-lg sm:p-6 space-y-4 max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto">
        <h2 class="text-lg font-bold text-gray-800">Precios especiales — {{ clientePrecios?.nombre }}</h2>

        <table class="w-full text-sm mb-4">
          <thead>
            <tr class="text-left text-gray-500 border-b text-xs uppercase">
              <th class="pb-2">Producto</th>
              <th class="pb-2 text-right">Precio especial</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in precios" :key="p.id" class="border-b border-gray-50">
              <td class="py-2">{{ p.producto?.nombre ?? p.productoId }}</td>
              <td class="py-2 text-right">{{ formatCurrency(p.precioUnitario) }}</td>
            </tr>
            <tr v-if="!precios.length">
              <td colspan="2" class="py-4 text-center text-gray-400">Sin precios especiales</td>
            </tr>
          </tbody>
        </table>

        <div class="border-t pt-4 space-y-3">
          <h3 class="font-semibold text-sm text-gray-700">Agregar / actualizar precio</h3>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_140px_auto]">
            <select v-model="nuevoProductoId" class="form-input">
              <option value="">Seleccionar producto…</option>
              <option v-for="prod in productos" :key="prod.id" :value="prod.id">{{ prod.nombre }}</option>
            </select>
            <input v-model.number="nuevoPrecio" class="form-input" type="number" min="0" placeholder="Precio" />
            <button class="btn-primary whitespace-nowrap" :disabled="!nuevoProductoId || !nuevoPrecio" @click="guardarPrecio">Guardar</button>
          </div>
        </div>

        <div class="flex justify-end">
          <button class="btn-secondary" @click="closeModalPrecios">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Modal confirmación eliminar cliente -->
    <Teleport to="body">
      <div v-if="showConfirmDeleteCliente" class="fixed inset-0 bg-black/40 z-50 flex items-stretch justify-center p-0 sm:items-center sm:p-4">
        <div class="bg-white rounded-none shadow-2xl w-full max-w-sm p-6 sm:rounded-xl">
          <h3 class="font-semibold text-gray-800 mb-2">¿Eliminar cliente?</h3>
          <p class="text-sm text-gray-600 mb-5">
            ¿Seguro que deseas eliminar a <strong>{{ clienteAEliminar?.nombre }}</strong>?
            Esta acción no se puede deshacer. Si el cliente tiene pedidos o ventas registradas no podrá eliminarse.
          </p>
          <div class="flex justify-end gap-3">
            <button class="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50" @click="showConfirmDeleteCliente = false">Cancelar</button>
            <button class="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700" @click="eliminarCliente">Eliminar</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Confirmación Desactivar -->
    <ModalConfirmacion
      ref="modalConfirm"
      titulo="¿Desactivar este cliente?"
      :descripcion="`El cliente ${clienteADesactivar?.nombre} será desactivado y no podrá realizar nuevos pedidos.`"
      textoConfirm="Sí, desactivar"
      textoCancel="Cancelar"
      :detalles="{ Nombre: clienteADesactivar?.nombre, Código: clienteADesactivar?.codigo }"
      advertencia="Los pedidos existentes no serán afectados."
      @confirm="ejecutarDesactivar"
      @cancel="clienteADesactivar = null"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { formatCurrency } from '~/utils/formats'
import { CheckCircle, Edit, Eye, MapPin, Plus, Search, Trash2, XCircle } from 'lucide-vue-next'
import { usePagination } from '~/composables/usePagination'
import { useModal } from '~/composables/useModal'
import { useApi } from '~/composables/useApi'
import { useNotification } from '~/composables/useNotification'
import { useApiResponse } from '~/composables/useApiResponse'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const notify = useNotification()
const apiResponse = useApiResponse()

const TIPOS_CLIENTE = ['TIENDA', 'NEGOCIO', 'DIRECTO', 'VEREDA', 'FRECUENTE']

const clientes = ref<any[]>([])
const loading = ref(false)

const { 
  pagina, 
  total, 
  LIMITE,
  totalPaginas,
} = usePagination(1, 15)

const searchQuery = ref('')

const { 
  isOpen: modalPrecios, 
  open: openModalPrecios, 
  close: closeModalPrecios 
} = useModal()
const modalConfirm = ref()
const clienteADesactivar = ref<any>(null)
const showConfirmDeleteCliente = ref(false)
const clienteAEliminar = ref<any>(null)
// --- Precios especiales ---
const precios = ref<any[]>([])
const productos = ref<any[]>([])
const nuevoProductoId = ref<number | ''>('')
const nuevoPrecio = ref<number>(0)
const clientePrecios = ref<any>(null)

function confirmarEliminarCliente(c: any) {
  clienteAEliminar.value = c
  showConfirmDeleteCliente.value = true
}

async function eliminarCliente() {
  if (!clienteAEliminar.value) return
  try {
    await api.delete(`/catalogos/clientes/${clienteAEliminar.value.id}`)
    notify.success(`Cliente "${clienteAEliminar.value.nombre}" eliminado`)
    showConfirmDeleteCliente.value = false
    clienteAEliminar.value = null
    await fetchClientes()
  } catch (e: any) {
    notify.error(apiResponse.errorMessage(e))
  }
}

function abrirConfirmDesactivar(c: any) {
  clienteADesactivar.value = c
  modalConfirm.value?.open()
}

async function ejecutarDesactivar() {
  if (!clienteADesactivar.value) return
  try {
    await api.patch(`/catalogos/clientes/${clienteADesactivar.value.id}/toggle-activo`)
    notify.success(`Cliente ${clienteADesactivar.value.activo ? 'desactivado' : 'activado'}`)
    clienteADesactivar.value = null
    modalConfirm.value?.close()
    await fetchClientes()
  } catch (e: any) {
    notify.error(apiResponse.errorMessage(e))
  }
}

async function abrirPrecios(c: any) {
  clientePrecios.value = c
  nuevoProductoId.value = ''
  nuevoPrecio.value = 0
  openModalPrecios()
  await Promise.all([fetchPrecios(c.id), fetchProductos()])
}

async function fetchPrecios(clienteId: number) {
  try {
    const res = await api.get(`/catalogos/clientes/${clienteId}/precios`)
    precios.value = apiResponse.list(res)
  } catch {
    precios.value = []
    notify.error('Error al cargar precios especiales del cliente')
  }
}

async function fetchProductos() {
  try {
    const res = await api.get('/catalogos/productos', { params: { activo: 'true', limit: 200 } })
    productos.value = apiResponse.list(res)
  } catch {
    productos.value = []
    notify.error('Error al cargar productos para precios')
  }
}

async function guardarPrecio() {
  try {
    await api.post(`/catalogos/clientes/${clientePrecios.value.id}/precios`, {
      productoId: nuevoProductoId.value,
      precioUnitario: nuevoPrecio.value,
    })
    notify.success('Precio guardado')
    nuevoProductoId.value = ''
    nuevoPrecio.value = 0
    await fetchPrecios(clientePrecios.value.id)
  } catch (e: any) {
    notify.error(apiResponse.errorMessage(e))
  }
}

const filtroActivo = ref('')
const filtroTipo = ref('')
const hasActiveFilters = computed(() => Boolean(searchQuery.value || filtroTipo.value || filtroActivo.value))

async function fetchClientes() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagina.value,
      limit: LIMITE,
    }
    if (searchQuery.value) params.search = searchQuery.value
    if (filtroTipo.value) params.tipo = filtroTipo.value
    if (filtroActivo.value !== '') params.activo = filtroActivo.value

    const res = await api.get('/catalogos/clientes', { params })
    const page = apiResponse.page(res)
    clientes.value = apiResponse.list(res)
    total.value = page.total
    pagina.value = page.page
  } catch {
    clientes.value = []
    total.value = 0
    notify.error('Error al cargar clientes')
  } finally {
    loading.value = false
  }
}

function cambiarPagina(delta: number) {
  pagina.value = Math.max(1, Math.min(totalPaginas.value, pagina.value + delta))
  fetchClientes()
}

function clearFilters() {
  searchQuery.value = ''
  filtroTipo.value = ''
  filtroActivo.value = ''
  pagina.value = 1
  fetchClientes()
}

const totalFiltrados = computed(() => total.value)

let searchTimeout: ReturnType<typeof setTimeout>
watch([filtroActivo, filtroTipo, searchQuery], () => {
  pagina.value = 1
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => fetchClientes(), 350)
})

onMounted(() => {
  fetchClientes()
})
</script>
