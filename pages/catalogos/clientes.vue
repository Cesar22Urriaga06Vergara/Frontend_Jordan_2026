<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Clientes</h1>
        <p class="text-sm text-gray-600 mt-1">Gestión de información de clientes</p>
      </div>
      <button class="btn-primary flex items-center gap-2 justify-center sm:justify-start" @click="abrirModalCrear()">
        <Plus :size="16" /> Nuevo cliente
      </button>
    </div>

    <!-- Búsqueda y Filtros Mejorados -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
      <div class="flex gap-3 flex-wrap items-end">
        <div class="flex-1 min-w-64">
          <label class="block text-xs font-medium text-gray-700 mb-1">Búsqueda</label>
          <div class="relative">
            <input 
              v-model="searchQuery" 
              placeholder="Nombre, código, teléfono..." 
              class="form-input w-full pl-10" 
            />
            <span class="absolute left-3 top-3 text-gray-400">🔍</span>
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
            <option value="true">✓ Activos</option>
            <option value="false">✗ Inactivos</option>
          </select>
        </div>
      </div>
      <div class="text-xs text-gray-500 flex items-center gap-2">
        <span v-if="searchQuery || filtroTipo || filtroActivo" class="inline-block">
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
            <th class="px-4 py-4 font-bold">Documento</th>
            <th class="px-4 py-4 font-bold">Estado</th>
            <th class="px-4 py-4 font-bold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="px-4 py-8 text-center text-gray-400">Cargando…</td>
          </tr>
          <tr v-else-if="!paginatedClientes.length">
            <td colspan="6" class="px-4 py-8 text-center text-gray-400">Sin resultados. Intenta ajustar los filtros o crear un nuevo cliente.</td>
          </tr>
          <tr v-for="c in paginatedClientes" :key="c.id" class="border-b border-gray-100 hover:bg-blue-50 transition-colors">
            <td class="px-4 py-4">
              <p class="text-xs text-gray-400 font-mono">{{ c.codigo }}</p>
              <p class="font-semibold text-gray-900">{{ c.nombre }}</p>
            </td>
            <td class="px-4 py-4 text-gray-700">
              <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">{{ c.tipo }}</span>
            </td>
            <td class="px-4 py-4 text-gray-600">{{ c.telefono ?? '—' }}</td>
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
              <span class="px-2.5 py-1 rounded-full text-xs font-bold" :class="c.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                {{ c.activo ? '✓ Activo' : '✗ Inactivo' }}
              </span>
            </td>
            <td class="px-4 py-4 text-right">
              <div class="flex justify-end gap-2 flex-wrap">
                <button class="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors" @click="abrirPrecios(c)">
                  <Eye :size="14" />
                  Precios
                </button>
                <button class="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded transition-colors" @click="abrirModalEditar(c)">
                  <Edit :size="14" />
                  Editar
                </button>
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
        <button class="btn-secondary px-3 py-1 text-xs" :disabled="pagina === 1" @click="pagina--">Ant.</button>
        <span class="px-2 py-1">{{ pagina }} / {{ totalPaginas }}</span>
        <button class="btn-secondary px-3 py-1 text-xs" :disabled="pagina >= totalPaginas" @click="pagina++">Sig.</button>
      </div>
    </div>

    <div v-if="modalForm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="closeModalForm()">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 class="text-lg font-bold text-gray-800">{{ editando ? 'Editar cliente' : 'Nuevo cliente' }}</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Código *" :error="errors.codigo">
            <input v-model="form.codigo" class="form-input" :disabled="!!editando" />
          </FormField>
          <FormField label="Tipo *" :error="errors.tipo">
            <select v-model="form.tipo" class="form-input">
              <option v-for="tipo in TIPOS_CLIENTE" :key="tipo" :value="tipo">{{ tipo }}</option>
            </select>
          </FormField>
          <FormField label="Nombre *" :error="errors.nombre" class="col-span-2">
            <input v-model="form.nombre" class="form-input" />
          </FormField>
          <FormField label="NIT">
            <input v-model="form.nit" class="form-input" />
          </FormField>
          <FormField label="Cédula">
            <input v-model="form.cedula" class="form-input" />
          </FormField>
          <FormField label="Teléfono">
            <input v-model="form.telefono" class="form-input" />
          </FormField>
          <FormField label="Dirección">
            <input v-model="form.direccion" class="form-input" />
          </FormField>
          <FormField label="Vereda">
            <input v-model="form.vereda" class="form-input" />
          </FormField>
          <FormField label="Observaciones" class="col-span-2">
            <textarea v-model="form.observaciones" rows="2" class="form-input resize-none" />
          </FormField>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button class="btn-secondary" @click="closeModalForm()">Cancelar</button>
          <button class="btn-primary" :disabled="saving" @click="guardarCliente">{{ saving ? 'Guardando…' : 'Guardar' }}</button>
        </div>
      </div>
    </div>

    <div v-if="modalPrecios" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="closeModalPrecios()">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
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
          <div class="flex gap-2">
            <select v-model="nuevoProductoId" class="form-input">
              <option value="">Seleccionar producto…</option>
              <option v-for="prod in productos" :key="prod.id" :value="prod.id">{{ prod.nombre }}</option>
            </select>
            <input v-model.number="nuevoPrecio" class="form-input w-36" type="number" min="0" placeholder="Precio" />
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
      <div v-if="showConfirmDeleteCliente" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
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
import { formatCurrency } from '~/utils/formats'
import { CheckCircle, Edit, Eye, Plus, Trash2 } from 'lucide-vue-next'
import { useCRUD } from '~/composables/useCRUD'
import { usePagination } from '~/composables/usePagination'
import { useSearch } from '~/composables/useSearch'
import { useForm } from '~/composables/useForm'
import { useModal } from '~/composables/useModal'
import { useApi } from '~/composables/useApi'
import { useNotification } from '~/composables/useNotification'
import { useApiResponse } from '~/composables/useApiResponse'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const notify = useNotification()
const apiResponse = useApiResponse()

const TIPOS_CLIENTE = ['TIENDA', 'NEGOCIO', 'DIRECTO', 'VEREDA', 'FRECUENTE']

// --- Composables para Gestión de Clientes ---
const { 
  items: clientes, 
  loading, 
  saving, 
  fetchItems: fetchClientes 
} = useCRUD({
  endpoint: '/catalogos/clientes',
  api,
  notify,
  onSuccess: () => modalForm.value = false
})

const { 
  pagina, 
  total, 
  totalPaginas 
} = usePagination(1, 15)

const { 
  filteredItems, 
  searchQuery, 
  filters, 
  setSearchFields
} = useSearch(clientes)

const {
  form,
  errors,
  validate: validateForm
} = useForm(
  { codigo: '', nombre: '', tipo: 'TIENDA', nit: '', cedula: '', telefono: '', direccion: '', vereda: '', observaciones: '' },
  {
    codigo: (v: string) => !v.trim() ? 'El código es requerido' : null,
    nombre: (v: string) => !v.trim() ? 'El nombre es requerido' : null,
    tipo: (v: string) => !v ? 'El tipo es requerido' : null,
  }
)

const { isOpen: modalForm, open: openModalForm, close: closeModalForm } = useModal()
const { isOpen: modalPrecios, open: openModalPrecios, close: closeModalPrecios } = useModal()
const modalConfirm = ref()
const clienteADesactivar = ref<any>(null)
const showConfirmDeleteCliente = ref(false)
const clienteAEliminar = ref<any>(null)
const editando = ref<any>(null)

// --- Precios especiales ---
const precios = ref<any[]>([])
const productos = ref<any[]>([])
const nuevoProductoId = ref<number | ''>('')
const nuevoPrecio = ref<number>(0)
const clientePrecios = ref<any>(null)

// --- Configurar búsqueda ---
setSearchFields('nombre' as any, 'codigo' as any, 'telefono' as any)

async function searchAndReset() {
  pagina.value = 1
  await fetchClientes()
}

function abrirModalCrear() {
  editando.value = null
  form.codigo = ''
  form.nombre = ''
  form.tipo = 'TIENDA'
  form.nit = ''
  form.cedula = ''
  form.telefono = ''
  form.direccion = ''
  form.vereda = ''
  form.observaciones = ''
  openModalForm()
}

function abrirModalEditar(c: any) {
  editando.value = c
  Object.assign(form, {
    codigo: c.codigo ?? '',
    nombre: c.nombre ?? '',
    tipo: c.tipo ?? 'TIENDA',
    nit: c.nit ?? '',
    cedula: c.cedula ?? '',
    telefono: c.telefono ?? '',
    direccion: c.direccion ?? '',
    vereda: c.vereda ?? '',
    observaciones: c.observaciones ?? '',
  })
  openModalForm()
}

async function guardarCliente() {
  if (!validateForm()) return
  
  saving.value = true
  try {
    if (editando.value) {
      await api.put(`/catalogos/clientes/${editando.value.id}`, form)
      notify.success('Cliente actualizado')
    } else {
      await api.post('/catalogos/clientes', form)
      notify.success('Cliente creado')
    }
    closeModalForm()
    await fetchClientes()
  } catch (e: any) {
    notify.error(apiResponse.errorMessage(e))
  } finally {
    saving.value = false
  }
}

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

// --- Items paginados y filtrados ---
const filtroActivo = ref('')
const filtroTipo = ref('')

const clientesFinales = computed(() => {
  let result: any[] = filteredItems.value

  // Aplicar filtro de tipo
  if (filtroTipo.value) {
    result = result.filter((c: any) => c.tipo === filtroTipo.value)
  }

  // Aplicar filtro de estado
  if (filtroActivo.value !== '') {
    const isActive = filtroActivo.value === 'true'
    result = result.filter((c: any) => c.activo === isActive)
  }

  return result
})

const paginatedClientes = computed(() => {
  const start = (pagina.value - 1) * 15
  return clientesFinales.value.slice(start, start + 15)
})

const totalFiltrados = computed(() => clientesFinales.value.length)

// Watch para resetear página cuando cambian filtros
watch([filtroActivo, filtroTipo, searchQuery], () => {
  pagina.value = 1
})

onMounted(() => {
  fetchClientes()
})
</script>