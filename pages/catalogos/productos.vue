<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
      <input
        v-model="search"
        type="text"
        placeholder="Buscar producto..."
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
        @input="debouncedSearch"
      />
      <select
        v-model="filters.activo"
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
        @change="loadProductos"
      >
        <option value="">Todos</option>
        <option value="true">Activos</option>
        <option value="false">Inactivos</option>
      </select>
      <button
        class="ml-auto bg-blue-950 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
        @click="openModal()"
      >
        + Nuevo producto
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
          <tr>
            <th class="px-4 py-3 text-left">Código</th>
            <th class="px-4 py-3 text-left">Nombre</th>
            <th class="px-4 py-3 text-left">Categoría</th>
            <th class="px-4 py-3 text-left">Unidad</th>
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
            <td class="px-4 py-3 text-gray-600">{{ p.categoria }}</td>
            <td class="px-4 py-3 text-gray-600">{{ p.unidad }}</td>
            <td class="px-4 py-3 text-center">
              <span
                class="px-2 py-0.5 rounded-full text-xs font-medium"
                :class="p.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
              >{{ p.activo ? 'Activo' : 'Inactivo' }}</span>
            </td>
            <td class="px-4 py-3 text-center flex items-center justify-center gap-2">
              <button class="text-blue-600 hover:underline text-xs" @click="openModal(p)">Editar</button>
              <button class="text-gray-500 hover:underline text-xs" @click="toggleActivo(p)">
                {{ p.activo ? 'Desactivar' : 'Activar' }}
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
      <div v-if="showModal" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
          <h3 class="font-semibold text-gray-800 mb-4">
            {{ editItem ? 'Editar producto' : 'Nuevo producto' }}
          </h3>
          <form class="space-y-3" @submit.prevent="saveProducto">
            <FormField label="Código" required>
              <input v-model="form.codigo" type="text" class="form-input" :disabled="!!editItem" />
            </FormField>
            <FormField label="Nombre" required>
              <input v-model="form.nombre" type="text" class="form-input" />
            </FormField>
            <FormField label="Categoría" required>
              <select v-model="form.categoria" class="form-input">
                <option value="">Seleccionar categoría…</option>
                <option value="Normal">Normal</option>
                <option value="Hielo">Hielo</option>
                <option value="Picadillo">Picadillo</option>
                <option value="Botellon">Botellon</option>
                <option value="Recarga Botellon">Recarga Botellon</option>
                <option value="Granel">Granel</option>
              </select>
            </FormField>
            <FormField label="Unidad" required>
              <input v-model="form.unidad" type="text" class="form-input" />
            </FormField>
            <FormField label="Descripción">
              <input v-model="form.descripcion" type="text" class="form-input" />
            </FormField>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50" @click="showModal = false">
                Cancelar
              </button>
              <button type="submit" class="px-4 py-2 text-sm rounded-lg bg-blue-950 text-white hover:bg-blue-800" :disabled="saving">
                {{ saving ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const api = useApi()
const { success, error } = useNotification()
const apiResponse = useApiResponse()

const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editItem = ref<any>(null)
const search = ref('')
const productos = ref<any[]>([])
const filters = reactive({ activo: '' })
const pagination = reactive({ page: 1, total: 0, totalPages: 1 })

const form = reactive({
  codigo: '', nombre: '', categoria: '', unidad: '', descripcion: '',
})

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

function changePage(delta: number) {
  pagination.page = Math.max(1, Math.min(pagination.totalPages, pagination.page + delta))
  loadProductos()
}

onMounted(() => { loadProductos() })
</script>
