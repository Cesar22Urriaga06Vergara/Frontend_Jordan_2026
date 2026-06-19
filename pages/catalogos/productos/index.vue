<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
      <input
        v-model="search"
        type="text"
        placeholder="Buscar producto..."
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
        @input="debouncedSearch"
      />
      <select
        v-model="filters.activo"
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none w-full sm:w-auto"
        @change="loadProductos"
      >
        <option value="">Todos</option>
        <option value="true">Activos</option>
        <option value="false">Inactivos</option>
      </select>
      <button
        class="btn-primary ml-auto flex items-center gap-2 justify-center"
        @click="openModal()"
      >
        <Plus :size="16" /> Nuevo producto
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
          <tr>
            <th class="px-4 py-3 text-center">Código</th>
            <th class="px-4 py-3 text-center">Nombre</th>
            <th class="px-4 py-3 text-center">Categoría</th>
            <th class="px-4 py-3 text-center">Unidad</th>
            <th class="px-4 py-3 text-center">Estado</th>
            <th class="px-4 py-3 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="px-4 py-8 text-center text-gray-400">Cargando...</td>
          </tr>
          <tr v-else-if="!productos.length">
            <td colspan="6" class="px-4 py-8 text-center text-gray-400">Sin productos</td>
          </tr>
          <tr
            v-for="p in productos"
            :key="p.id"
            class="border-t border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <td class="px-4 py-3 font-mono text-xs text-gray-500">{{ p.codigo }}</td>
            <td class="px-4 py-3 font-medium text-gray-800">{{ p.nombre }}</td>
            <td class="px-4 py-3">
              <ProductUnitBadge :categoria="p.categoria" />
            </td>
            <td class="px-4 py-3">
              <ProductUnitBadge :unidad="p.unidad" />
            </td>
            <td class="px-4 py-3 text-center">
              <span
                class="px-2 py-0.5 rounded-full text-xs font-medium"
                :class="p.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
              >{{ p.activo ? 'Activo' : 'Inactivo' }}</span>
            </td>
            <td class="px-4 py-3 text-center flex items-center justify-center gap-2">
              <button class="flex items-center gap-1 text-blue-600 hover:underline text-xs" @click="openModal(p)">
                <Edit :size="14" /> Editar
              </button>
              <button class="flex items-center gap-1 hover:underline text-xs" :class="p.activo ? 'text-orange-600' : 'text-green-600'" @click="toggleActivo(p)">
                <CheckCircle v-if="p.activo" :size="14" class="text-green-600" />
                {{ p.activo ? 'Desactivar' : 'Activar' }}
              </button>
              <button class="flex items-center gap-1 text-red-600 hover:underline text-xs" @click="confirmarEliminar(p)">
                <Trash2 :size="14" /> Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between mt-4 text-sm text-gray-500">
      <span>{{ pagination.total }} productos</span>
      <div class="flex gap-2">
        <button
          :disabled="pagination.page <= 1"
          class="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
          @click="changePage(-1)"
        >←</button>
        <span class="px-3 py-1">{{ pagination.page }} / {{ pagination.totalPages }}</span>
        <button
          :disabled="pagination.page >= pagination.totalPages"
          class="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
          @click="changePage(1)"
        >→</button>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 bg-black/40 z-50 flex items-stretch justify-center p-0 sm:items-center sm:p-4">
        <div class="bg-white rounded-none shadow-2xl w-full max-w-lg p-4 sm:rounded-xl sm:p-6 max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto">
          <h3 class="font-semibold text-gray-800 mb-4">
            {{ editItem ? 'Editar producto' : 'Nuevo producto' }}
          </h3>
          <form class="space-y-3" @submit.prevent="saveProducto">
            <FormField label="Código" required :error="errors.codigo">
              <input v-model="form.codigo" type="text" class="form-input" :disabled="!!editItem" />
            </FormField>
            <FormField label="Nombre" required :error="errors.nombre">
              <input v-model="form.nombre" type="text" class="form-input" />
            </FormField>
            <FormField label="Categoría" required :error="errors.categoria">
              <select v-model="form.categoria" class="form-input">
                <option value="">Seleccionar categoría…</option>
                <option v-for="c in CATEGORIAS_PRODUCTO" :key="c.value" :value="c.value">{{ c.label }}</option>
              </select>
            </FormField>
            <FormField label="Unidad" required :error="errors.unidad">
              <select v-model="form.unidad" class="form-input">
                <option value="">Seleccionar unidad…</option>
                <option v-for="u in UNIDADES_PRODUCTO" :key="u.value" :value="u.value">{{ u.label }}</option>
              </select>
            </FormField>
            <FormField label="Descripción">
              <input v-model="form.descripcion" type="text" class="form-input" />
            </FormField>
            <div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button type="button" class="btn-secondary" @click="showModal = false">
                Cancelar
              </button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
    <!-- Modal confirmación eliminar -->
    <Teleport to="body">
      <div v-if="showConfirmDelete" class="fixed inset-0 bg-black/40 z-50 flex items-stretch justify-center p-0 sm:items-center sm:p-4">
        <div class="bg-white rounded-none shadow-2xl w-full max-w-sm p-4 sm:rounded-xl sm:p-6 max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto">
          <h3 class="font-semibold text-gray-800 mb-2">¿Eliminar producto?</h3>
          <p class="text-sm text-gray-600 mb-5">
            ¿Seguro que deseas eliminar <strong>{{ productoAEliminar?.nombre }}</strong>?
            Esta acción no se puede deshacer. Si el producto tiene movimientos registrados no podrá eliminarse.
          </p>
          <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button class="btn-secondary" @click="showConfirmDelete = false">
              Cancelar
            </button>
            <button class="btn-danger bg-red-600 text-white hover:bg-red-700" @click="eliminarProducto">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { Edit, CheckCircle, Plus, Trash2 } from 'lucide-vue-next'
import { CATEGORIAS_PRODUCTO, UNIDADES_PRODUCTO } from '~/utils/producto-labels'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const { success, error } = useNotification()
const apiResponse = useApiResponse()

const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editItem = ref<any>(null)
const showConfirmDelete = ref(false)
const productoAEliminar = ref<any>(null)
const search = ref('')
const productos = ref<any[]>([])
const filters = reactive({ activo: '' })
const pagination = reactive({ page: 1, total: 0, totalPages: 1 })

const form = reactive({
  codigo: '', nombre: '', categoria: '', unidad: '', descripcion: '',
})
const errors = reactive({ codigo: '', nombre: '', categoria: '', unidad: '' })

function validarForm(): boolean {
  errors.codigo = !form.codigo.trim() ? 'El código es requerido' : ''
  errors.nombre = !form.nombre.trim() ? 'El nombre es requerido' : ''
  errors.categoria = !form.categoria ? 'La categoría es requerida' : ''
  errors.unidad = !form.unidad.trim() ? 'La unidad es requerida' : ''
  return !errors.codigo && !errors.nombre && !errors.categoria && !errors.unidad
}

let searchTimeout: ReturnType<typeof setTimeout>
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { pagination.page = 1; loadProductos() }, 400)
}

async function loadProductos() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: String(pagination.page),
      limit: '15',
    })
    if (search.value) params.set('search', search.value)
    if (filters.activo !== '') params.set('activo', filters.activo)

    const res = await api.get(`/catalogos/productos?${params}`)
    const page = apiResponse.page(res)
    productos.value = apiResponse.list(res)
    pagination.total = page.total
    pagination.totalPages = page.totalPages
  } catch {
    productos.value = []
    error('Error al cargar productos')
  } finally {
    loading.value = false
  }
}



function openModal(item?: any) {
  editItem.value = item ?? null
  Object.assign(form, {
    codigo: item?.codigo ?? '',
    nombre: item?.nombre ?? '',
    categoria: item?.categoria ?? '',
    unidad: item?.unidad ?? '',
    descripcion: item?.descripcion ?? '',
  })
  showModal.value = true
}

async function saveProducto() {
  if (!validarForm()) return
  
  saving.value = true
  try {
    if (editItem.value) {
      await api.put(`/catalogos/productos/${editItem.value.id}`, form)
      success('Producto actualizado')
    } else {
      await api.post('/catalogos/productos', form)
      success('Producto creado')
    }
    showModal.value = false
    await loadProductos()
  } catch (e: any) {
    error(apiResponse.errorMessage(e))
  } finally {
    saving.value = false
  }
}

async function toggleActivo(p: any) {
  try {
    await api.patch(`/catalogos/productos/${p.id}/toggle-activo`)
    success(`Producto ${p.activo ? 'desactivado' : 'activado'}`)
    await loadProductos()
  } catch {
    error('Error al actualizar estado')
  }
}

function confirmarEliminar(p: any) {
  productoAEliminar.value = p
  showConfirmDelete.value = true
}

async function eliminarProducto() {
  if (!productoAEliminar.value) return
  try {
    await api.delete(`/catalogos/productos/${productoAEliminar.value.id}`)
    success(`Producto "${productoAEliminar.value.nombre}" eliminado`)
    showConfirmDelete.value = false
    productoAEliminar.value = null
    await loadProductos()
  } catch (e: any) {
    error(apiResponse.errorMessage(e))
  }
}

function changePage(delta: number) {
  pagination.page = Math.max(1, Math.min(pagination.totalPages, pagination.page + delta))
  loadProductos()
}

onMounted(() => { loadProductos() })
</script>
