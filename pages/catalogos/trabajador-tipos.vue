<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Tipos de trabajador</h1>
        <p class="text-sm text-gray-500">Administra clasificaciones como permanente, temporal o preventista.</p>
      </div>
      <button class="btn-primary inline-flex items-center gap-2" @click="openModal()">
        <Plus class="h-4 w-4" />
        Nuevo tipo
      </button>
    </div>

    <div class="card flex flex-col sm:flex-row gap-3">
      <input v-model="search" class="form-input max-w-md" placeholder="Buscar tipo..." />
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
            <th class="px-4 py-3 font-medium">Descripcion</th>
            <th class="px-4 py-3 font-medium">Estado</th>
            <th class="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="4" class="px-4 py-8 text-center text-gray-400">Cargando...</td>
          </tr>
          <tr v-else-if="!tiposFiltrados.length">
            <td colspan="4" class="px-4 py-10 text-center text-gray-400">Sin tipos de trabajador.</td>
          </tr>
          <tr
            v-for="tipo in tiposFiltrados"
            :key="tipo.id"
            class="border-b border-gray-50 hover:bg-gray-50 transition"
          >
            <td class="px-4 py-3 font-semibold text-gray-800">{{ tipo.nombre }}</td>
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
            {{ editItem ? 'Editar tipo de trabajador' : 'Nuevo tipo de trabajador' }}
          </h2>
          <form class="space-y-4" @submit.prevent="saveTipo">
            <FormField label="Nombre *" :error="errors.nombre">
              <input v-model="form.nombre" class="form-input" placeholder="Ej: SELLADOR_TEMPORAL" />
            </FormField>
            <FormField label="Descripcion">
              <textarea
                v-model="form.descripcion"
                rows="3"
                class="form-input resize-none"
                placeholder="Ej: Personal temporal de apoyo en sellado"
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
  descripcion: '',
})
const errors = reactive({ nombre: '' })

const tiposFiltrados = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return tipos.value
  return tipos.value.filter((tipo) =>
    `${tipo.nombre ?? ''} ${tipo.descripcion ?? ''}`.toLowerCase().includes(q),
  )
})

function validarForm() {
  errors.nombre = form.nombre.trim() ? '' : 'El nombre es requerido'
  return !errors.nombre
}

async function fetchTipos() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (filtroActivo.value !== '') params.activo = filtroActivo.value
    const res = await api.get('/catalogos/trabajador-tipos', { params })
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
    descripcion: item?.descripcion ?? '',
  })
  errors.nombre = ''
  showModal.value = true
}

async function saveTipo() {
  if (!validarForm()) return
  saving.value = true
  try {
    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || undefined,
    }
    if (editItem.value) {
      await api.put(`/catalogos/trabajador-tipos/${editItem.value.id}`, payload)
      notify.success('Tipo de trabajador actualizado')
    } else {
      await api.post('/catalogos/trabajador-tipos', payload)
      notify.success('Tipo de trabajador creado')
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
    await api.patch(`/catalogos/trabajador-tipos/${tipo.id}/toggle-activo`)
    notify.success(`Tipo de trabajador ${tipo.activo ? 'desactivado' : 'activado'}`)
    await fetchTipos()
  } catch (e: any) {
    notify.error(apiResponse.errorMessage(e))
  }
}

onMounted(fetchTipos)
</script>
