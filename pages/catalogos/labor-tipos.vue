<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Tipos de labor</h1>
        <p class="text-sm text-gray-500">Define labores y su forma de pago para trabajadores.</p>
      </div>
      <button class="btn-primary inline-flex items-center gap-2" @click="openModal()">
        <Plus class="h-4 w-4" />
        Nuevo tipo
      </button>
    </div>

    <div class="card flex flex-col sm:flex-row gap-3">
      <input
        v-model="search"
        class="form-input max-w-md"
        placeholder="Buscar labor..."
      />
      <select v-model="filtroActivo" class="form-input w-full sm:w-40" @change="fetchTipos">
        <option value="">Todos</option>
        <option value="true">Activos</option>
        <option value="false">Inactivos</option>
      </select>
      <button class="btn-secondary inline-flex items-center gap-2 sm:ml-auto" @click="fetchTipos">
        <RefreshCw class="h-4 w-4" />
        Actualizar
      </button>
    </div>

    <div class="card overflow-x-auto p-0">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-center text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wide">
            <th class="px-4 py-3 font-medium">Nombre</th>
            <th class="px-4 py-3 font-medium">Forma de pago</th>
            <th class="px-4 py-3 font-medium">Descripcion</th>
            <th class="px-4 py-3 font-medium">Estado</th>
            <th class="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="5" class="px-4 py-8 text-center text-gray-400">Cargando...</td>
          </tr>
          <tr v-else-if="!tiposFiltrados.length">
            <td colspan="5" class="px-4 py-10 text-center text-gray-400">Sin tipos de labor.</td>
          </tr>
          <tr
            v-for="tipo in tiposFiltrados"
            :key="tipo.id"
            class="border-b border-gray-50 hover:bg-gray-50 transition"
          >
            <td class="px-4 py-3 font-semibold text-gray-800">{{ tipo.nombre }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-0.5 rounded-full text-xs font-medium" :class="tipoPagoClass(tipo.tipo)">
                {{ tipoPagoLabel(tipo.tipo) }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ tipo.descripcion || '-' }}</td>
            <td class="px-4 py-3">
              <span
                class="px-2 py-0.5 rounded-full text-xs font-medium"
                :class="tipo.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
              >
                {{ tipo.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-2">
                <button class="flex items-center gap-1 text-xs text-gray-600 hover:underline" @click="openModal(tipo)">
                  <Edit class="h-3.5 w-3.5" />
                  Editar
                </button>
                <button
                  class="flex items-center gap-1 text-xs hover:underline"
                  :class="tipo.activo ? 'text-orange-600' : 'text-green-600'"
                  @click="toggleActivo(tipo)"
                >
                  <CheckCircle class="h-3.5 w-3.5" />
                  {{ tipo.activo ? 'Desactivar' : 'Activar' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
        @click.self="showModal = false"
      >
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
          <h2 class="text-lg font-bold text-gray-800 mb-4">
            {{ editItem ? 'Editar tipo de labor' : 'Nuevo tipo de labor' }}
          </h2>
          <form class="space-y-4" @submit.prevent="saveTipo">
            <FormField label="Nombre *" :error="errors.nombre">
              <input v-model="form.nombre" class="form-input" placeholder="Ej: Sellador" />
            </FormField>
            <FormField label="Forma de pago *" :error="errors.tipo">
              <select v-model="form.tipo" class="form-input">
                <option value="POR_JORNADA">Por jornada</option>
                <option value="POR_HORA">Por hora</option>
                <option value="POR_PACA">Por paca</option>
                <option value="MANUAL">Manual</option>
                <option value="MIXTO">Mixto</option>
              </select>
            </FormField>
            <FormField label="Descripcion">
              <textarea
                v-model="form.descripcion"
                rows="3"
                class="form-input resize-none"
                placeholder="Ej: Sellado pagado por cantidad de pacas"
              />
            </FormField>

            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="btn-secondary" @click="showModal = false">Cancelar</button>
              <button type="submit" class="btn-primary" :disabled="saving">
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
import { CheckCircle, Edit, Plus, RefreshCw } from 'lucide-vue-next'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const apiResponse = useApiResponse()
const notify = useNotification()

const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editItem = ref<any>(null)
const tipos = ref<any[]>([])
const search = ref('')
const filtroActivo = ref('')

const form = reactive({
  nombre: '',
  tipo: 'POR_JORNADA',
  descripcion: '',
})
const errors = reactive({ nombre: '', tipo: '' })

const tiposFiltrados = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return tipos.value
  return tipos.value.filter((tipo) =>
    `${tipo.nombre ?? ''} ${tipo.descripcion ?? ''}`.toLowerCase().includes(q),
  )
})

function tipoPagoLabel(tipo?: string) {
  if (tipo === 'POR_HORA') return 'Por hora'
  if (tipo === 'POR_PACA') return 'Por paca'
  if (tipo === 'POR_JORNADA') return 'Por jornada'
  if (tipo === 'MIXTO') return 'Mixto'
  return 'Manual'
}

function tipoPagoClass(tipo?: string) {
  if (tipo === 'POR_HORA') return 'bg-blue-50 text-blue-700'
  if (tipo === 'POR_PACA') return 'bg-orange-50 text-orange-700'
  if (tipo === 'POR_JORNADA') return 'bg-green-50 text-green-700'
  if (tipo === 'MIXTO') return 'bg-purple-50 text-purple-700'
  return 'bg-gray-100 text-gray-600'
}

function validarForm() {
  errors.nombre = form.nombre.trim() ? '' : 'El nombre es requerido'
  errors.tipo = form.tipo ? '' : 'La forma de pago es requerida'
  return !errors.nombre && !errors.tipo
}

async function fetchTipos() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (filtroActivo.value !== '') params.activo = filtroActivo.value
    const res = await api.get('/catalogos/labor-tipos', { params })
    const d = apiResponse.unwrap(res) as any
    tipos.value = d.items ?? d
  } catch (e: any) {
    tipos.value = []
    notify.error(apiResponse.errorMessage(e))
  } finally {
    loading.value = false
  }
}

function openModal(item?: any) {
  editItem.value = item ?? null
  Object.assign(form, {
    nombre: item?.nombre ?? '',
    tipo: item?.tipo ?? 'POR_JORNADA',
    descripcion: item?.descripcion ?? '',
  })
  errors.nombre = ''
  errors.tipo = ''
  showModal.value = true
}

async function saveTipo() {
  if (!validarForm()) return
  saving.value = true
  try {
    const payload = {
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      descripcion: form.descripcion.trim() || undefined,
    }
    if (editItem.value) {
      await api.put(`/catalogos/labor-tipos/${editItem.value.id}`, payload)
      notify.success('Tipo de labor actualizado')
    } else {
      await api.post('/catalogos/labor-tipos', payload)
      notify.success('Tipo de labor creado')
    }
    showModal.value = false
    await fetchTipos()
  } catch (e: any) {
    notify.error(apiResponse.errorMessage(e))
  } finally {
    saving.value = false
  }
}

async function toggleActivo(tipo: any) {
  try {
    await api.patch(`/catalogos/labor-tipos/${tipo.id}/toggle-activo`)
    notify.success(`Tipo de labor ${tipo.activo ? 'desactivado' : 'activado'}`)
    await fetchTipos()
  } catch (e: any) {
    notify.error(apiResponse.errorMessage(e))
  }
}

onMounted(fetchTipos)
</script>
