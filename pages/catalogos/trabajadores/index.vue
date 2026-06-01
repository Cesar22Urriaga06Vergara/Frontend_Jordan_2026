<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <h1 class="text-2xl font-bold text-gray-800">Catálogo de Trabajadores</h1>
      <button class="btn-primary flex items-center gap-2" @click="abrirModal()">
        <Plus class="h-4 w-4" />
        Nuevo trabajador
      </button>
    </div>

    <!-- Filtros -->
    <div class="card flex flex-wrap gap-3">
      <input
        v-model="search"
        placeholder="Buscar por nombre, código, cédula…"
        class="form-input max-w-xs"
        @input="pagina = 1; fetchTrabajadores()"
      />
      <select v-model="filtroTipo" class="form-input w-44" @change="pagina = 1; fetchTrabajadores()">
        <option value="">Todos los tipos</option>
        <option v-for="t in tiposTrabajador" :key="t.nombre" :value="t.nombre">{{ t.nombre }}</option>
      </select>
      <select v-model="filtroActivo" class="form-input w-36" @change="pagina = 1; fetchTrabajadores()">
        <option value="">Todos</option>
        <option value="true">Activos</option>
        <option value="false">Inactivos</option>
      </select>
    </div>

    <!-- Tabla -->
    <div class="card overflow-x-auto p-0">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-center text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wide">
            <th class="px-4 py-3 font-medium">Código</th>
            <th class="px-4 py-3 font-medium">Nombre</th>
            <th class="px-4 py-3 font-medium">Cédula</th>
            <th class="px-4 py-3 font-medium">Tipo</th>
            <th class="px-4 py-3 font-medium">Cargo</th>
            <th class="px-4 py-3 font-medium">Teléfono</th>
            <th class="px-4 py-3 font-medium">Tarifa base ($)</th>
            <th class="px-4 py-3 font-medium">Saldo operativo ($)</th>
            <th class="px-4 py-3 font-medium">Estado</th>
            <th class="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="10" class="px-4 py-8 text-center text-gray-400">Cargando…</td>
          </tr>
          <tr v-else-if="!trabajadores.length">
            <td colspan="10" class="px-4 py-8 text-center text-gray-400">Sin resultados.</td>
          </tr>
          <tr
            v-for="t in trabajadores"
            :key="t.id"
            class="border-b border-gray-50 hover:bg-gray-50 transition"
          >
            <td class="px-4 py-3 font-mono text-gray-600 text-xs">{{ t.codigo }}</td>
            <td class="px-4 py-3 font-medium text-gray-800">{{ t.nombre }}</td>
            <td class="px-4 py-3 text-gray-500">{{ t.cedula }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-600 font-medium">{{ t.tipoTrabajador }}</span>
            </td>
            <td class="px-4 py-3 text-gray-600">{{ t.cargo ?? '—' }}</td>
            <td class="px-4 py-3 text-gray-500">{{ t.telefono ?? '—' }}</td>
            <td class="px-4 py-3 text-right text-gray-700 font-medium">
              {{ formatCurrency(t.tarifaBase ?? 0) }}
            </td>
            <td class="px-4 py-3 text-right" :class="(t.saldoTotal ?? 0) > 0 ? 'text-green-700 font-semibold' : 'text-gray-400'">
              {{ formatCurrency(t.saldoTotal ?? 0) }}
            </td>
            <td class="px-4 py-3">
              <span
                class="px-2 py-0.5 rounded-full text-xs font-medium"
                :class="t.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
              >{{ t.activo ? 'Activo' : 'Inactivo' }}</span>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-2">
                <button class="flex items-center gap-1 text-xs text-gray-600 hover:underline" @click="abrirModal(t)">
                  <Edit :size="14" /> Editar
                </button>
                <button
                  class="flex items-center gap-1 text-xs hover:underline"
                  :class="t.activo ? 'text-orange-600' : 'text-green-600'"
                  @click="toggleActivo(t)"
                >
                  <CheckCircle v-if="t.activo" :size="14" class="text-green-600" />
                  {{ t.activo ? 'Desactivar' : 'Activar' }}
                </button>
                <button class="flex items-center gap-1 text-xs text-red-600 hover:underline" @click="eliminarTrabajador(t)">
                  <Trash2 :size="14" />
                  Eliminar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Paginación -->
    <div class="flex items-center justify-between text-sm text-gray-500">
      <span>{{ total }} trabajadores</span>
      <div class="flex gap-2">
        <button class="btn-secondary px-3 py-1 text-xs" :disabled="pagina === 1" @click="pagina--; fetchTrabajadores()">Ant.</button>
        <span class="px-2 py-1">{{ pagina }} / {{ totalPaginas }}</span>
        <button class="btn-secondary px-3 py-1 text-xs" :disabled="pagina >= totalPaginas" @click="pagina++; fetchTrabajadores()">Sig.</button>
      </div>
    </div>

    <!-- Modal -->
    <div
      v-if="modalForm"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="modalForm = false"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 class="text-lg font-bold text-gray-800">{{ editando ? 'Editar trabajador' : 'Nuevo trabajador' }}</h2>

        <div v-if="loadingModal" class="p-4 bg-blue-50 rounded text-blue-700 text-sm">
          Cargando datos del trabajador...
        </div>

        <div class="grid grid-cols-2 gap-4" :class="{ 'opacity-50 pointer-events-none': loadingModal }">
          <FormField label="Código *" :error="errors.codigo">
            <input v-model="form.codigo" class="form-input" :disabled="!!editando" />
          </FormField>
          <FormField label="Clasificación *">
            <select v-model="form.tipoTrabajador" class="form-input">
              <option v-for="tp in tiposTrabajador" :key="tp.nombre" :value="tp.nombre">{{ tp.nombre }}</option>
            </select>
          </FormField>
          <FormField label="Nombre completo *" :error="errors.nombre" class="col-span-2">
            <input v-model="form.nombre" class="form-input" />
          </FormField>
          <FormField label="Cédula *" :error="errors.cedula">
            <input v-model="form.cedula" class="form-input" />
          </FormField>
          <FormField label="Teléfono">
            <input v-model="form.telefono" class="form-input" />
          </FormField>
          <FormField label="Dirección" class="col-span-2">
            <input v-model="form.direccion" class="form-input" />
          </FormField>
          <FormField label="Cargo / labor principal" class="col-span-2">
            <select v-model="form.cargo" class="form-input">
              <option value="">Sin cargo definido</option>
              <option v-for="labor in laborTipos" :key="labor.id" :value="labor.nombre">
                {{ labor.nombre }} - {{ tipoPagoLabel(labor.tipo) }}
              </option>
            </select>
          </FormField>
          <FormField label="Modalidad pago *">
            <select v-model="form.modalidadPago" class="form-input">
              <option value="POR_JORNADA">Por jornada</option>
              <option value="POR_HORA">Por hora</option>
              <option value="POR_PACA">Por paca</option>
            </select>
          </FormField>
          <FormField :label="tarifaBaseLabel" :error="errors.valorPago">
            <input
              v-model.number="form.valorPago"
              class="form-input"
              type="number"
              min="0"
              step="1"
              placeholder="Ej: 42000"
            />
            <p class="mt-1 text-xs text-gray-500">
              {{ tarifaBaseHelp }}
            </p>
          </FormField>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button class="btn-secondary" @click="modalForm = false" :disabled="saving || loadingModal">Cancelar</button>
          <button class="btn-primary" :disabled="saving || loadingModal" @click="guardar">
            {{ saving ? 'Guardando…' : loadingModal ? 'Cargando…' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from '~/utils/formats'
import { Edit, CheckCircle, Plus, Trash2 } from 'lucide-vue-next'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const notify = useNotification()
const apiResponse = useApiResponse()

const TIPOS_FALLBACK = ['PERMANENTE', 'TEMPORAL', 'PREVENTISTA', 'DOMICILIARIO', 'MIXTO'].map((nombre) => ({ nombre }))

const loading = ref(true)
const saving = ref(false)
const trabajadores = ref<any[]>([])
const laborTipos = ref<any[]>([])
const tiposTrabajador = ref<any[]>(TIPOS_FALLBACK)
const total = ref(0)
const pagina = ref(1)
const LIMITE = 15
const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / LIMITE)))
const search = ref('')
const filtroTipo = ref('')
const filtroActivo = ref('')

const modalForm = ref(false)
const editando = ref<any>(null)
const loadingModal = ref(false)
const form = reactive({
  codigo: '', nombre: '', cedula: '', telefono: '',
  direccion: '', tipoTrabajador: 'PERMANENTE', cargo: '',
  modalidadPago: 'POR_JORNADA', valorPago: undefined as number | undefined,
})
const errors = reactive({ codigo: '', nombre: '', cedula: '', valorPago: '' })
const tarifaBaseLabel = computed(() => {
  if (form.modalidadPago === 'POR_HORA') return 'Tarifa sugerida por hora'
  if (form.modalidadPago === 'POR_PACA') return 'Tarifa sugerida por paca'
  return 'Tarifa base por jornada *'
})
const tarifaBaseHelp = computed(() => {
  if (form.modalidadPago === 'POR_HORA') {
    return 'Opcional. El administrador puede definir el valor real al registrar la labor por horas.'
  }
  if (form.modalidadPago === 'POR_PACA') {
    return 'Opcional. El administrador define pacas y valor por paca al registrar la labor.'
  }
  return 'Se paga por jornada registrada en labores. El saldo se actualiza al registrar la labor.'
})

function tipoPagoLabel(tipo?: string) {
  if (tipo === 'POR_HORA') return 'por hora'
  if (tipo === 'POR_PACA') return 'por paca'
  if (tipo === 'POR_JORNADA') return 'por jornada'
  return 'manual'
}

function validarForm(): boolean {
  errors.codigo = !form.codigo.trim() ? 'El código es requerido' : ''
  errors.nombre = !form.nombre.trim() ? 'El nombre es requerido' : ''
  errors.cedula = !form.cedula.trim() ? 'La cédula es requerida' : ''
  errors.valorPago = form.modalidadPago === 'POR_JORNADA' && !editando.value && (!form.valorPago || form.valorPago <= 0) ? 'El valor es requerido' : 
                     form.valorPago && form.valorPago <= 0 ? 'Debe ser mayor a 0' : ''
  return !errors.codigo && !errors.nombre && !errors.cedula && !errors.valorPago
}

async function fetchTrabajadores() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: pagina.value, limit: LIMITE }
    if (search.value) params.search = search.value
    if (filtroTipo.value) params.tipo = filtroTipo.value
    if (filtroActivo.value !== '') params.activo = filtroActivo.value
    const res = await api.get('/catalogos/trabajadores', { params })
    const page = apiResponse.page(res)
    trabajadores.value = apiResponse.list(res)
    total.value = page.total
    pagina.value = page.page
  } catch {
    trabajadores.value = []
    total.value = 0
    notify.error('Error al cargar trabajadores')
  } finally {
    loading.value = false
  }
}

async function fetchLaborTipos() {
  try {
    const res = await api.get('/catalogos/labor-tipos', { params: { activo: 'true' } })
    const d = apiResponse.unwrap(res) as any
    laborTipos.value = d.items ?? d
  } catch {
    laborTipos.value = []
  }
}

async function fetchTiposTrabajador() {
  try {
    const res = await api.get('/catalogos/trabajador-tipos', { params: { activo: 'true' } })
    const d = apiResponse.unwrap(res) as any
    tiposTrabajador.value = d.items ?? d
  } catch {
    tiposTrabajador.value = TIPOS_FALLBACK
  }
}

async function abrirModal(t?: any) {
  editando.value = t ?? null
  loadingModal.value = false
  
  if (t) {
    const base: any = {
      codigo: t.codigo ?? '',
      nombre: t.nombre ?? '',
      cedula: t.cedula ?? '',
      telefono: t.telefono ?? '',
      direccion: t.direccion ?? '',
      tipoTrabajador: t.tipoTrabajador ?? 'PERMANENTE',
      cargo: t.cargo ?? '',
      modalidadPago: 'POR_JORNADA', // Default si no encuentra tarifa
      valorPago: undefined,
    }

    // Abrir modal primero con datos básicos
    modalForm.value = true
    loadingModal.value = true

    try {
      const res = await api.get(`/catalogos/trabajadores/${t.id}`)
      const d = apiResponse.unwrap(res) as any
      const tarifaBase = (d.laboresDisponibles ?? []).find(
        (lt: any) => ['POR_JORNADA', 'POR_HORA', 'POR_PACA'].includes(lt?.laborTipo?.tipo) && lt?.activo !== false,
      )
      if (tarifaBase?.laborTipo?.tipo) base.modalidadPago = tarifaBase.laborTipo.tipo
      if (tarifaBase?.tarifa !== undefined && tarifaBase?.tarifa !== null) {
        base.valorPago = Number(tarifaBase.tarifa)
      }
    } catch (e) {
      notify.error('Error al cargar los datos del trabajador: ' + (e as any)?.message)
    } finally {
      loadingModal.value = false
    }

    Object.assign(form, base)
  } else {
    Object.assign(form, {
      codigo: '',
      nombre: '',
      cedula: '',
      telefono: '',
      direccion: '',
      tipoTrabajador: 'PERMANENTE',
      cargo: '',
      modalidadPago: 'POR_JORNADA',
      valorPago: undefined,
    })
    modalForm.value = true
  }
}

async function guardar() {
  if (!validarForm()) return
  
  saving.value = true
  try {
    const payload: Record<string, any> = {
      codigo: form.codigo,
      nombre: form.nombre,
      cedula: form.cedula,
      telefono: form.telefono,
      direccion: form.direccion,
      tipoTrabajador: form.tipoTrabajador,
      cargo: form.cargo || undefined,
      modalidadPago: form.modalidadPago,
    }
    if (form.valorPago && form.valorPago > 0) {
      payload.valorPago = Number(form.valorPago)
    }

    if (editando.value) {
      await api.put(`/catalogos/trabajadores/${editando.value.id}`, payload)
      notify.success('Trabajador actualizado')
    } else {
      await api.post('/catalogos/trabajadores', payload)
      notify.success('Trabajador creado')
    }
    modalForm.value = false
    await fetchTrabajadores()
  } catch (e: any) {
    const errorMsg = e?.response?.data?.message ?? 'Error al guardar'
    notify.error(errorMsg)
    console.error('Error al guardar trabajador:', e)
  } finally {
    saving.value = false
  }
}

async function toggleActivo(t: any) {
  try {
    await api.patch(`/catalogos/trabajadores/${t.id}/toggle-activo`)
    notify.success(`Trabajador ${t.activo ? 'desactivado' : 'activado'}`)
    await fetchTrabajadores()
  } catch {
    notify.error('Error al cambiar estado')
  }
}

async function eliminarTrabajador(t: any) {
  if (!confirm(`Eliminar trabajador ${t.nombre}? Esta accion lo retira del catalogo activo.`)) return
  try {
    await api.delete(`/catalogos/trabajadores/${t.id}`)
    notify.success('Trabajador eliminado')
    await fetchTrabajadores()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al eliminar trabajador')
  }
}

onMounted(() => {
  fetchTrabajadores()
  fetchLaborTipos()
  fetchTiposTrabajador()
})
</script>
