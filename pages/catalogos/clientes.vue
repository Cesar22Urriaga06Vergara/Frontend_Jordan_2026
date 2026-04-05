<template>
  <div class="p-6 space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <h1 class="text-2xl font-bold text-gray-800">Clientes</h1>
      <button class="btn-primary" @click="abrirModal()">+ Nuevo cliente</button>
    </div>

    <div class="card flex flex-wrap gap-3 items-center">
      <input v-model="search" placeholder="Buscar por nombre o código…" class="form-input max-w-xs" @input="pagina = 1; fetchClientes()" />
      <select v-model="filtroTipo" class="form-input w-40" @change="pagina = 1; fetchClientes()">
        <option value="">Todos los tipos</option>
        <option v-for="tipo in TIPOS_CLIENTE" :key="tipo" :value="tipo">{{ tipo }}</option>
      </select>
      <select v-model="filtroActivo" class="form-input w-36" @change="pagina = 1; fetchClientes()">
        <option value="">Todos</option>
        <option value="true">Activos</option>
        <option value="false">Inactivos</option>
      </select>
    </div>

    <div class="card overflow-x-auto p-0">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wide">
            <th class="px-4 py-3 font-medium">Código / Nombre</th>
            <th class="px-4 py-3 font-medium">Tipo</th>
            <th class="px-4 py-3 font-medium">Teléfono</th>
            <th class="px-4 py-3 font-medium">Documento</th>
            <th class="px-4 py-3 font-medium">Estado</th>
            <th class="px-4 py-3 font-medium text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="px-4 py-8 text-center text-gray-400">Cargando…</td>
          </tr>
          <tr v-else-if="!clientes.length">
            <td colspan="6" class="px-4 py-8 text-center text-gray-400">Sin resultados.</td>
          </tr>
          <tr v-for="c in clientes" :key="c.id" class="border-b border-gray-50 hover:bg-gray-50 transition">
            <td class="px-4 py-3">
              <p class="text-xs text-gray-400">{{ c.codigo }}</p>
              <p class="font-medium text-gray-800">{{ c.nombre }}</p>
            </td>
            <td class="px-4 py-3 text-gray-600">{{ c.tipo }}</td>
            <td class="px-4 py-3 text-gray-600">{{ c.telefono ?? '—' }}</td>
            <td class="px-4 py-3 text-gray-600">{{ c.nit ?? c.cedula ?? '—' }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-0.5 rounded-full text-xs font-medium" :class="c.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                {{ c.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-2 flex-wrap">
                <button class="text-xs text-blue-600 hover:underline" @click="abrirPrecios(c)">Precios</button>
                <button class="text-xs text-gray-600 hover:underline" @click="abrirModal(c)">Editar</button>
                <button class="text-xs hover:underline" :class="c.activo ? 'text-orange-600' : 'text-green-600'" @click="toggleActivo(c)">
                  {{ c.activo ? 'Desactivar' : 'Activar' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between text-sm text-gray-500">
      <span>{{ total }} clientes</span>
      <div class="flex gap-2">
        <button class="btn-secondary px-3 py-1 text-xs" :disabled="pagina === 1" @click="pagina--; fetchClientes()">Ant.</button>
        <span class="px-2 py-1">{{ pagina }} / {{ totalPaginas }}</span>
        <button class="btn-secondary px-3 py-1 text-xs" :disabled="pagina >= totalPaginas" @click="pagina++; fetchClientes()">Sig.</button>
      </div>
    </div>

    <div v-if="modalForm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="modalForm = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 class="text-lg font-bold text-gray-800">{{ editando ? 'Editar cliente' : 'Nuevo cliente' }}</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Código *">
            <input v-model="form.codigo" class="form-input" :disabled="!!editando" />
          </FormField>
          <FormField label="Tipo *">
            <select v-model="form.tipo" class="form-input">
              <option v-for="tipo in TIPOS_CLIENTE" :key="tipo" :value="tipo">{{ tipo }}</option>
            </select>
          </FormField>
          <FormField label="Nombre *" class="col-span-2">
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
          <button class="btn-secondary" @click="modalForm = false">Cancelar</button>
          <button class="btn-primary" :disabled="saving" @click="guardarCliente">{{ saving ? 'Guardando…' : 'Guardar' }}</button>
        </div>
      </div>
    </div>

    <div v-if="modalPrecios" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="cerrarPrecios">
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
          <button class="btn-secondary" @click="cerrarPrecios">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from '~/utils/formats'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const notify = useNotification()
const apiResponse = useApiResponse()

const TIPOS_CLIENTE = ['TIENDA', 'NEGOCIO', 'DIRECTO', 'VEREDA', 'FRECUENTE']

const loading = ref(true)
const saving = ref(false)
const clientes = ref<any[]>([])
const total = ref(0)
const pagina = ref(1)
const LIMITE = 15
const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / LIMITE)))
const search = ref('')
const filtroActivo = ref('')
const filtroTipo = ref('')

const modalForm = ref(false)
const editando = ref<any>(null)
const form = reactive({ codigo: '', nombre: '', tipo: 'TIENDA', nit: '', cedula: '', telefono: '', direccion: '', vereda: '', observaciones: '' })

const modalPrecios = ref(false)
const clientePrecios = ref<any>(null)
const precios = ref<any[]>([])
const productos = ref<any[]>([])
const nuevoProductoId = ref<number | ''>('')
const nuevoPrecio = ref<number>(0)

async function fetchClientes() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: pagina.value, limit: LIMITE }
    if (search.value) params.search = search.value
    if (filtroActivo.value !== '') params.activo = filtroActivo.value
    if (filtroTipo.value) params.tipo = filtroTipo.value
    const res = await api.get('/catalogos/clientes', { params })
    const p = apiResponse.page(res)
    clientes.value = apiResponse.list(res)
    total.value = p.total
  } catch {
    notify.error('Error al cargar clientes')
  } finally {
    loading.value = false
  }
}

function abrirModal(c?: any) {
  editando.value = c ?? null
  if (c) {
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
  } else {
    Object.assign(form, { codigo: '', nombre: '', tipo: 'TIENDA', nit: '', cedula: '', telefono: '', direccion: '', vereda: '', observaciones: '' })
  }
  modalForm.value = true
}

async function guardarCliente() {
  if (!form.codigo.trim() || !form.nombre.trim()) {
    notify.error('Código y nombre son requeridos')
    return
  }
  saving.value = true
  try {
    if (editando.value) {
      await api.put(`/catalogos/clientes/${editando.value.id}`, form)
      notify.success('Cliente actualizado')
    } else {
      await api.post('/catalogos/clientes', form)
      notify.success('Cliente creado')
    }
    modalForm.value = false
    await fetchClientes()
  } catch (e: any) {
    notify.error(apiResponse.errorMessage(e))
  } finally {
    saving.value = false
  }
}

async function toggleActivo(c: any) {
  try {
    await api.patch(`/catalogos/clientes/${c.id}/toggle-activo`)
    notify.success(`Cliente ${c.activo ? 'desactivado' : 'activado'}`)
    await fetchClientes()
  } catch {
    notify.error('Error al cambiar estado')
  }
}

async function abrirPrecios(c: any) {
  clientePrecios.value = c
  modalPrecios.value = true
  nuevoProductoId.value = ''
  nuevoPrecio.value = 0
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

function cerrarPrecios() {
  modalPrecios.value = false
  clientePrecios.value = null
  precios.value = []
}

onMounted(fetchClientes)
</script>