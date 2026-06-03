<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Rutas</h1>
        <p class="text-sm text-gray-500">Despachos, entregas y liquidación por trabajador.</p>
      </div>
      <button
        class="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="!jornadaAbierta"
        @click="abrirModal()"
      >
        <Plus :size="16" /> Nueva ruta
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="card flex items-center gap-4">
        <div class="h-11 w-11 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
          <Truck class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Rutas listadas</p>
          <p class="text-2xl font-bold text-gray-800">{{ total }}</p>
        </div>
      </div>
      <div class="card flex items-center gap-4">
        <div class="h-11 w-11 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center">
          <ClipboardList class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm text-gray-500">En entrega</p>
          <p class="text-2xl font-bold text-gray-800">{{ rutasEnEntrega }}</p>
        </div>
      </div>
      <div class="card flex items-center gap-4">
        <div class="h-11 w-11 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
          <CheckCircle class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Liquidación pendiente</p>
          <p class="text-2xl font-bold text-gray-800">{{ rutasEnLiquidacion }}</p>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card flex flex-wrap gap-3 items-end">
      <select v-model="filtroEstado" class="form-input flex-1 min-w-36 sm:flex-none sm:w-40" @change="pagina = 1; fetchRutas()">
        <option value="">Todos los estados</option>
        <option v-for="e in ESTADOS" :key="e" :value="e">{{ e }}</option>
      </select>
      <button class="btn-secondary inline-flex items-center gap-2" @click="fetchRutas">
        <RefreshCw class="h-4 w-4" />
        Actualizar
      </button>
    </div>

    <!-- Tabla -->
    <div class="card overflow-x-auto p-0">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-center text-gray-500 border-b border-gray-100 text-xs uppercase">
            <th class="px-4 py-3 font-medium">Número</th>
            <th class="px-4 py-3 font-medium">Fecha</th>
            <th class="px-4 py-3 font-medium">Trabajador</th>
            <th class="px-4 py-3 font-medium">Pedidos</th>
            <th class="px-4 py-3 font-medium">Estado</th>
            <th class="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="px-4 py-8 text-center text-gray-400">Cargando…</td>
          </tr>
          <tr v-else-if="!rutas.length">
            <td colspan="6" class="px-4 py-10 text-center text-gray-400">Sin rutas para los filtros seleccionados.</td>
          </tr>
          <tr
            v-for="r in rutas"
            :key="r.id"
            class="border-b border-gray-50 hover:bg-gray-50 transition"
          >
            <td class="px-4 py-3 font-medium text-gray-800">{{ r.numero }}</td>
            <td class="px-4 py-3 text-gray-600">{{ formatDate(r.fecha) }}</td>
            <td class="px-4 py-3 text-gray-600">{{ r.domiciliario?.nombre ?? '—' }}</td>
            <td class="px-4 py-3 text-center text-gray-600">{{ r.itemsRuta?.length ?? '—' }}</td>
            <td class="px-4 py-3"><EstadoBadge :estado="r.estado" /></td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-2">
                <button
                  type="button"
                  class="btn-secondary text-xs py-1 px-2 inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="!jornadaAbierta"
                  @click="gestionarRuta(r)"
                >
                  <ArrowRight :size="14" /> Gestionar
                </button>
                <button
                  type="button"
                  class="text-xs py-1 px-2 inline-flex items-center gap-1 rounded border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-40"
                  :disabled="deletingId === r.id"
                  @click="confirmarEliminarRuta(r)"
                >
                  <Trash2 :size="14" /> Eliminar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Paginación -->
    <div class="flex items-center justify-between text-sm text-gray-500">
      <span>{{ total }} rutas</span>
      <div class="flex gap-2">
        <button class="btn-secondary px-3 py-1 text-xs" :disabled="pagina === 1" @click="pagina--; fetchRutas()">Ant.</button>
        <span class="px-2 py-1">{{ pagina }} / {{ totalPaginas }}</span>
        <button class="btn-secondary px-3 py-1 text-xs" :disabled="pagina >= totalPaginas" @click="pagina++; fetchRutas()">Sig.</button>
      </div>
    </div>

    <!-- Modal nueva ruta -->
    <div
      v-if="modalForm"
      class="fixed inset-0 bg-black/40 flex items-stretch justify-center z-50 p-0 sm:items-center sm:p-4"
      @click.self="modalForm = false"
    >
      <div class="bg-white rounded-none shadow-xl w-full max-w-lg p-4 sm:rounded-lg sm:p-6 space-y-4 max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto">
        <div>
          <h2 class="font-bold text-gray-800">Nueva ruta</h2>
          <p class="text-sm text-gray-500 mt-1">Asigna un trabajador y luego agrega los pedidos pendientes.</p>
        </div>

        <FormField label="Fecha *" :error="errors.fecha">
          <input v-model="form.fecha" type="date" class="form-input" />
        </FormField>
        <FormField label="Trabajador *" :error="errors.domiciliarioId">
          <select v-model="form.domiciliarioId" class="form-input">
            <option :value="undefined">Seleccionar…</option>
            <option v-for="t in trabajadores" :key="t.id" :value="t.id">{{ t.nombre }}</option>
          </select>
        </FormField>
        <FormField label="Notas">
          <textarea v-model="form.observaciones" rows="2" class="form-input resize-none" />
        </FormField>

        <div class="flex justify-end gap-2 pt-2">
          <button class="btn-secondary" @click="modalForm = false">Cancelar</button>
          <button class="btn-primary inline-flex items-center gap-2" :disabled="saving" @click="crearRuta">
            <Plus class="h-4 w-4" />
            {{ saving ? 'Creando…' : 'Crear' }}
          </button>
        </div>
      </div>
    </div>

    <ModalConfirmacion
      ref="modalEliminarRuta"
      titulo="Eliminar ruta"
      descripcion="La ruta se eliminara y sus pedidos volveran a pendiente si aun no tiene historial operativo."
      textoConfirm="Eliminar"
      textoCancel="Cancelar"
      :detalles="{ Ruta: rutaAEliminar?.numero, Trabajador: rutaAEliminar?.domiciliario?.nombre }"
      advertencia="Para rutas en entrega, liquidacion o liquidadas usa anular/cerrar segun corresponda."
      @confirm="eliminarRuta"
      @cancel="cerrarEliminarRuta"
    />
  </div>
</template>

<script setup lang="ts">
import { formatDate, todayISO } from '~/utils/formats'
import { ArrowRight, CheckCircle, ClipboardList, Plus, RefreshCw, Trash2, Truck } from 'lucide-vue-next'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const notify = useNotification()
const apiResponse = useApiResponse()
const { jornadaAbierta, fetchEstadoJornada, requireJornadaAbierta } = useJornadaOperativa()

const ESTADOS = ['CREADA', 'CARGADA', 'EN_ENTREGA', 'EN_LIQUIDACION', 'LIQUIDADA', 'ANULADA']

const loading = ref(true)
const saving = ref(false)
const deletingId = ref<number | null>(null)
const rutas = ref<any[]>([])
const total = ref(0)
const pagina = ref(1)
const LIMITE = 15
const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / LIMITE)))
const filtroEstado = ref('')

const modalForm = ref(false)
const modalEliminarRuta = ref()
const rutaAEliminar = ref<any>(null)
const form = reactive({ fecha: todayISO(), domiciliarioId: undefined as number | undefined, observaciones: '' })
const errors = reactive({ fecha: '', domiciliarioId: '' })
const trabajadores = ref<any[]>([])

const rutasEnEntrega = computed(() =>
  rutas.value.filter((r) => r.estado === 'EN_ENTREGA').length,
)
const rutasEnLiquidacion = computed(() =>
  rutas.value.filter((r) => r.estado === 'EN_LIQUIDACION').length,
)

function validarForm(): boolean {
  errors.fecha = !form.fecha ? 'La fecha es requerida' : ''
  errors.domiciliarioId = !form.domiciliarioId ? 'Debes seleccionar un trabajador' : ''
  return !errors.fecha && !errors.domiciliarioId
}

async function fetchRutas() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: pagina.value, limit: LIMITE }
    if (filtroEstado.value) params.estado = filtroEstado.value
    const res = await api.get('/operaciones/rutas', { params })
    const d = apiResponse.unwrap(res) as any
    rutas.value = d.items ?? d
    total.value = d.total ?? rutas.value.length
  } catch {
    notify.error('Error al cargar rutas')
  } finally {
    loading.value = false
  }
}

async function fetchTrabajadores() {
  if (trabajadores.value.length) return
  try {
    const res = await api.get('/catalogos/trabajadores', { params: { activo: 'true', limit: 200 } })
    const d = apiResponse.unwrap(res) as any
    trabajadores.value = d.items ?? d
  } catch {
    trabajadores.value = []
    notify.error('No se pudieron cargar los trabajadores')
  }
}

function abrirModal() {
  if (!requireJornadaAbierta()) return
  form.fecha = todayISO()
  form.domiciliarioId = undefined
  form.observaciones = ''
  fetchTrabajadores()
  modalForm.value = true
}

function gestionarRuta(r: any) {
  if (!requireJornadaAbierta()) return
  navigateTo(`/rutas/${r.id}`)
}

function confirmarEliminarRuta(r: any) {
  rutaAEliminar.value = r
  modalEliminarRuta.value?.open()
}

function cerrarEliminarRuta() {
  rutaAEliminar.value = null
  modalEliminarRuta.value?.close()
}

async function eliminarRuta() {
  if (!rutaAEliminar.value) return
  deletingId.value = rutaAEliminar.value.id
  try {
    await api.delete(`/operaciones/rutas/${rutaAEliminar.value.id}`)
    notify.success(`Ruta ${rutaAEliminar.value.numero} eliminada`)
    await fetchRutas()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'No se pudo eliminar la ruta')
  } finally {
    deletingId.value = null
    cerrarEliminarRuta()
  }
}

async function crearRuta() {
  if (!validarForm()) return
  
  saving.value = true
  try {
    await api.post('/operaciones/rutas', form)
    notify.success('Ruta creada')
    modalForm.value = false
    await fetchRutas()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al crear ruta')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchEstadoJornada(), fetchRutas()])
})
</script>
