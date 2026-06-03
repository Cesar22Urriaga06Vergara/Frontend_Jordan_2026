<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Labores y Pagos</h1>
        <p class="text-sm text-gray-500">Registro operativo de labores, pagos, anticipos y saldos pendientes.</p>
      </div>
      <button class="btn-secondary inline-flex items-center gap-2" @click="fetchTrabajadores">
        <RefreshCw class="h-4 w-4" />
        Actualizar
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="card flex items-center gap-4">
        <div class="h-11 w-11 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
          <UsersRound class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Personal activo</p>
          <p class="text-2xl font-bold text-gray-800">{{ trabajadoresActivos }}</p>
        </div>
      </div>
      <div class="card flex items-center gap-4">
        <div class="h-11 w-11 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
          <HandCoins class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Saldo por pagar</p>
          <p class="text-2xl font-bold text-gray-800">{{ formatCurrency(saldoTotalTrabajadores) }}</p>
        </div>
      </div>
      <div class="card flex items-center gap-4">
        <div class="h-11 w-11 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center">
          <ClipboardList class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Labores hoy</p>
          <p class="text-2xl font-bold text-gray-800">{{ laboresHoy.length }}</p>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 border-b border-gray-200">
      <button
        v-for="tab in TABS"
        :key="tab.id"
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition"
        :class="tabActivo === tab.id
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'"
        @click="tabActivo = tab.id"
      >
        <span class="inline-flex items-center gap-2">
          <component :is="tab.icon" class="h-4 w-4" />
          {{ tab.label }}
        </span>
      </button>
    </div>

    <!-- TAB: Resumen de personal -->
    <div v-if="tabActivo === 'resumen'" class="space-y-4">
      <div class="card overflow-x-auto p-0">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-center text-gray-500 border-b text-xs uppercase">
              <th class="px-4 py-3 font-medium">Trabajador</th>
              <th class="px-4 py-3 font-medium">Código</th>
              <th class="px-4 py-3 font-medium">Saldo total ($)</th>
              <th class="px-4 py-3 font-medium">Estado</th>
              <th class="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingTrab">
              <td colspan="5" class="px-4 py-8 text-center text-gray-400">Cargando…</td>
            </tr>
            <tr
              v-for="t in trabajadores"
              :key="t.id"
              class="border-b border-gray-50 hover:bg-gray-50 transition"
            >
              <td class="px-4 py-3">
                <p class="font-medium text-gray-800">{{ t.nombre }}</p>
                <p v-if="t.cargo" class="text-xs text-gray-500">{{ t.cargo }}</p>
              </td>
              <td class="px-4 py-3 text-gray-500">{{ t.codigo }}</td>
              <td class="px-4 py-3 text-right" :class="(t.saldoTotal ?? 0) > 0 ? 'text-green-700 font-medium' : 'text-gray-500'">
                {{ formatCurrency(t.saldoTotal ?? 0) }}
              </td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="t.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                  {{ t.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex justify-end gap-2">
                  <button class="btn-secondary text-xs py-1 px-2 inline-flex items-center gap-1" @click="abrirPagarModal(t)">
                    <HandCoins class="h-3.5 w-3.5" />
                    Pagar
                  </button>
                  <button class="btn-secondary text-xs py-1 px-2 inline-flex items-center gap-1" @click="abrirAnticipoModal(t)">
                    <WalletCards class="h-3.5 w-3.5" />
                    Anticipo
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB: Registrar labor -->
    <div v-if="tabActivo === 'labores'" class="space-y-4">
      <div class="card space-y-4">
        <div>
          <h2 class="font-semibold text-gray-800">Registrar labor</h2>
          <p class="text-sm text-gray-500">Carga unidades trabajadas y valor a pagar automaticamente.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 items-end">
          <FormField label="Trabajador *">
            <select v-model="laborForm.trabajadorId" class="form-input" @change="fetchLaboresDisponibles">
              <option :value="undefined">Seleccionar…</option>
              <option v-for="t in trabajadores" :key="t.id" :value="t.id">{{ t.nombre }}</option>
            </select>
          </FormField>
          <FormField label="Tipo de labor *">
            <select v-model.number="laborForm.laborTipoId" class="form-input" @change="onLaborTipoChange">
              <option :value="undefined">Seleccionar…</option>
              <option v-for="l in laborOpciones" :key="l.id" :value="l.id">
                {{ l.nombre }} — {{ tipoPagoLabel(l.tipo) }}
              </option>
            </select>
          </FormField>
          <FormField :label="cantidadLabel">
            <input v-model.number="laborForm.cantidad" class="form-input" type="number" min="1" step="0.01" />
          </FormField>
          <FormField :label="valorUnitarioLabel">
            <input v-model.number="laborForm.valorUnitario" class="form-input" type="number" min="0" step="1" :placeholder="valorUnitarioPlaceholder" />
          </FormField>
          <FormField label="Fecha">
            <input v-model="laborForm.fecha" class="form-input" type="date" />
          </FormField>
          <FormField label="Notas">
            <input v-model="laborForm.notas" class="form-input" />
          </FormField>
        </div>

        <button
          class="btn-primary inline-flex items-center gap-2"
          :disabled="savingLabor || !laborForm.trabajadorId || !laborForm.laborTipoId || !laborForm.cantidad || !laborForm.valorUnitario"
          @click="registrarLabor"
        >
          <ClipboardList class="h-4 w-4" />
          {{ savingLabor ? 'Guardando…' : `Registrar ${formatCurrency(montoEstimado)}` }}
        </button>
      </div>

      <!-- Labores del día -->
      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-sm text-gray-700">Labores de hoy</h3>
        <button class="text-xs text-blue-600 hover:underline inline-flex items-center gap-1" @click="fetchLaboresHoy">
          <RefreshCw class="h-3.5 w-3.5" />
          Actualizar
        </button>
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-center text-gray-500 border-b text-xs uppercase">
              <th class="pb-2 font-medium">Trabajador</th>
              <th class="pb-2 font-medium">Labor</th>
              <th class="pb-2 font-medium">Cant.</th>
              <th class="pb-2 font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in laboresHoy" :key="l.id" class="border-b border-gray-50">
              <td class="py-1.5">{{ l.trabajador?.nombre ?? '—' }}</td>
              <td class="py-1.5">{{ l.laborTarifa?.laborTipo?.nombre ?? '—' }}</td>
              <td class="py-1.5 text-center">{{ l.cantidadRealizado ?? '—' }}</td>
              <td class="py-1.5 text-right">{{ formatCurrency(Number(l.montoAPagar ?? 0)) }}</td>
            </tr>
            <tr v-if="!laboresHoy.length">
              <td colspan="4" class="py-4 text-center text-gray-400">Sin labores registradas hoy</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB: Anticipos / deudas -->
    <div v-if="tabActivo === 'anticipos'" class="space-y-4">
      <div class="flex gap-3">
        <select v-model="filtroTrabAnticipos" class="form-input w-52" @change="fetchAnticipos">
          <option value="">Todos los trabajadores</option>
          <option v-for="t in trabajadores" :key="t.id" :value="t.id">{{ t.nombre }}</option>
        </select>
      </div>

      <div class="card overflow-x-auto p-0">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-center text-gray-500 border-b text-xs uppercase">
              <th class="px-4 py-3 font-medium">Trabajador</th>
              <th class="px-4 py-3 font-medium">Número</th>
              <th class="px-4 py-3 font-medium">Tipo</th>
              <th class="px-4 py-3 font-medium">Monto</th>
              <th class="px-4 py-3 font-medium">Saldo</th>
              <th class="px-4 py-3 font-medium">Estado</th>
              <th class="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingAnt">
              <td colspan="7" class="px-4 py-8 text-center text-gray-400">Cargando…</td>
            </tr>
            <tr
              v-for="a in anticipos"
              :key="a.id"
              class="border-b border-gray-50 hover:bg-gray-50"
            >
              <td class="px-4 py-3">{{ a.trabajador?.nombre ?? '—' }}</td>
              <td class="px-4 py-3 font-medium">{{ a.numero ?? a.id }}</td>
              <td class="px-4 py-3">{{ a.tipo ?? a.tipoMovimiento ?? '—' }}</td>
              <td class="px-4 py-3 text-right">{{ formatCurrency(a.monto) }}</td>
              <td class="px-4 py-3 text-right" :class="(a.saldoPendiente ?? a.saldo ?? 0) > 0 ? 'text-orange-600' : 'text-gray-400'">
                {{ formatCurrency(a.saldoPendiente ?? a.saldo ?? 0) }}
              </td>
              <td class="px-4 py-3">
                <EstadoBadge :estado="a.estado ?? 'ACTIVO'" />
              </td>
              <td class="px-4 py-3 text-right">
                <button
                  v-if="(a.saldoPendiente ?? a.saldo ?? 0) > 0"
                  class="text-xs text-blue-600 hover:underline"
                  @click="abrirAbonoModal(a)"
                >Abonar</button>
              </td>
            </tr>
            <tr v-if="!anticipos.length && !loadingAnt">
              <td colspan="7" class="px-4 py-8 text-center text-gray-400">Sin anticipos.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal pagar trabajador -->
    <div
      v-if="modalPagar"
      class="fixed inset-0 bg-black/40 flex items-stretch justify-center z-50 p-0 sm:items-center sm:p-4"
      @click.self="modalPagar = false"
    >
      <div class="bg-white rounded-none shadow-xl w-full max-w-md p-4 sm:rounded-lg sm:p-6 space-y-4 max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto">
        <h2 class="font-bold text-gray-800">Pagar a {{ trabSeleccionado?.nombre }}</h2>
        <p class="text-sm text-gray-500">Saldo: {{ formatCurrency(trabSeleccionado?.saldoTotal ?? 0) }}</p>

        <FormField label="Monto a pagar ($) *">
          <input v-model.number="pagarForm.monto" class="form-input" type="number" min="0" />
        </FormField>
        <FormField label="Notas">
          <input v-model="pagarForm.notas" class="form-input" />
        </FormField>

        <div class="flex justify-end gap-2 pt-2">
          <button class="btn-secondary" @click="modalPagar = false">Cancelar</button>
          <button class="btn-primary" :disabled="savingPagar || !pagarForm.monto" @click="pagarTrabajador">
            {{ savingPagar ? 'Pagando…' : 'Pagar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal anticipo -->
    <div
      v-if="modalAnticipo"
      class="fixed inset-0 bg-black/40 flex items-stretch justify-center z-50 p-0 sm:items-center sm:p-4"
      @click.self="modalAnticipo = false"
    >
      <div class="bg-white rounded-none shadow-xl w-full max-w-md p-4 sm:rounded-lg sm:p-6 space-y-4 max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto">
        <h2 class="font-bold text-gray-800">Anticipo / Préstamo — {{ trabSeleccionado?.nombre }}</h2>

        <FormField label="Tipo">
          <select v-model="anticipoForm.tipo" class="form-input">
            <option value="ANTICIPO">Anticipo</option>
            <option value="PRESTAMO">Préstamo</option>
          </select>
        </FormField>
        <FormField label="Monto ($) *">
          <input v-model.number="anticipoForm.monto" class="form-input" type="number" min="0" />
        </FormField>
        <FormField label="Descripción">
          <input v-model="anticipoForm.descripcion" class="form-input" />
        </FormField>

        <div class="flex justify-end gap-2 pt-2">
          <button class="btn-secondary" @click="modalAnticipo = false">Cancelar</button>
          <button class="btn-primary" :disabled="savingAnticipo || !anticipoForm.monto" @click="registrarAnticipo">
            {{ savingAnticipo ? 'Guardando…' : 'Registrar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal abono deuda -->
    <div
      v-if="modalAbono"
      class="fixed inset-0 bg-black/40 flex items-stretch justify-center z-50 p-0 sm:items-center sm:p-4"
      @click.self="modalAbono = false"
    >
      <div class="bg-white rounded-none shadow-xl w-full max-w-md p-4 sm:rounded-lg sm:p-6 space-y-4 max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto">
        <h2 class="font-bold text-gray-800">Abonar deuda</h2>
        <p class="text-sm text-gray-500">
          Saldo pendiente: {{ formatCurrency(anticipoSeleccionado?.saldoPendiente ?? anticipoSeleccionado?.saldo ?? 0) }}
        </p>

        <FormField label="Monto abono ($) *">
          <input v-model.number="abonoForm.monto" class="form-input" type="number" min="0" />
        </FormField>
        <FormField label="Notas">
          <input v-model="abonoForm.notas" class="form-input" />
        </FormField>

        <div class="flex justify-end gap-2 pt-2">
          <button class="btn-secondary" @click="modalAbono = false">Cancelar</button>
          <button class="btn-primary" :disabled="savingAbono || !abonoForm.monto" @click="registrarAbono">
            {{ savingAbono ? 'Guardando…' : 'Abonar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ClipboardList, HandCoins, RefreshCw, UsersRound, WalletCards } from 'lucide-vue-next'
import { formatCurrency, todayISO } from '~/utils/formats'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const notify = useNotification()
const apiResponse = useApiResponse()

const TABS = [
  { id: 'resumen', label: 'Resumen', icon: UsersRound },
  { id: 'labores', label: 'Labores', icon: ClipboardList },
  { id: 'anticipos', label: 'Anticipos / Deudas', icon: WalletCards },
]
const tabActivo = ref('resumen')

const loadingTrab = ref(true)
const trabajadores = ref<any[]>([])
const laboresDisponibles = ref<any[]>([])
const tiposLabor = ref<any[]>([])
const laboresHoy = ref<any[]>([])
const loadingAnt = ref(false)
const anticipos = ref<any[]>([])
const filtroTrabAnticipos = ref<number | ''>('')

const trabSeleccionado = ref<any>(null)
const anticipoSeleccionado = ref<any>(null)

// Labor form
const savingLabor = ref(false)
const laborForm = reactive({
  trabajadorId: undefined as number | undefined,
  laborTipoId: undefined as number | undefined,
  cantidad: 1,
  valorUnitario: undefined as number | undefined,
  fecha: todayISO(),
  notas: '',
})

// Pagar
const modalPagar = ref(false)
const savingPagar = ref(false)
const pagarForm = reactive({ monto: 0, notas: '' })

// Anticipo
const modalAnticipo = ref(false)
const savingAnticipo = ref(false)
const anticipoForm = reactive({ tipo: 'ANTICIPO', monto: 0, descripcion: '' })

// Abono
const modalAbono = ref(false)
const savingAbono = ref(false)
const abonoForm = reactive({ monto: 0, notas: '' })

const trabajadoresActivos = computed(() => trabajadores.value.filter((t) => t.activo).length)
const saldoTotalTrabajadores = computed(() =>
  trabajadores.value.reduce((sum, t) => sum + Number(t?.saldoTotal ?? 0), 0),
)
const laborOpciones = computed(() =>
  tiposLabor.value.map((tipo: any) => {
    const tarifa = laboresDisponibles.value.find((l: any) => l.laborTipoId === tipo.id || l.laborTipo?.id === tipo.id)
    return {
      ...tipo,
      tarifaId: tarifa?.id,
      tarifa: tarifa?.tarifa,
    }
  }),
)
const laborSeleccionada = computed(() =>
  laborOpciones.value.find((l: any) => l.id === laborForm.laborTipoId),
)
const cantidadLabel = computed(() => {
  if (laborSeleccionada.value?.tipo === 'POR_HORA') return 'Horas *'
  if (laborSeleccionada.value?.tipo === 'POR_PACA') return 'Pacas *'
  return 'Cantidad *'
})
const valorUnitarioLabel = computed(() => {
  if (laborSeleccionada.value?.tipo === 'POR_HORA') return 'Valor por hora *'
  if (laborSeleccionada.value?.tipo === 'POR_PACA') return 'Valor por paca *'
  return 'Valor jornada *'
})
const valorUnitarioPlaceholder = computed(() => {
  if (laborSeleccionada.value?.tipo === 'POR_HORA') return 'Ej: 8000'
  if (laborSeleccionada.value?.tipo === 'POR_PACA') return 'Ej: 500'
  return 'Ej: 42000'
})
const montoEstimado = computed(() =>
  Number(laborForm.cantidad ?? 0) * Number(laborForm.valorUnitario ?? 0),
)

function tipoPagoLabel(tipo?: string) {
  if (tipo === 'POR_HORA') return 'por hora'
  if (tipo === 'POR_PACA') return 'por paca'
  if (tipo === 'POR_JORNADA') return 'por jornada'
  return 'manual'
}

async function fetchTrabajadores() {
  loadingTrab.value = true
  try {
    const res = await api.get('/catalogos/trabajadores', { params: { activo: 'true', limit: 200 } })
    const d = apiResponse.unwrap(res) as any
    trabajadores.value = d.items ?? d
  } catch {
    notify.error('Error al cargar trabajadores')
  } finally {
    loadingTrab.value = false
  }
}

async function fetchTiposLabor() {
  try {
    const res = await api.get('/catalogos/labor-tipos', { params: { activo: 'true' } })
    const d = apiResponse.unwrap(res) as any
    tiposLabor.value = d.items ?? d
  } catch {
    tiposLabor.value = []
    notify.error('Error al cargar tipos de labor')
  }
}

async function fetchLaboresDisponibles() {
  if (!laborForm.trabajadorId) { laboresDisponibles.value = []; return }
  try {
    const res = await api.get(`/catalogos/trabajadores/${laborForm.trabajadorId}`)
    const d = apiResponse.unwrap(res) as any
    laboresDisponibles.value = d.laboresDisponibles ?? []
    onLaborTipoChange()
  } catch {
    laboresDisponibles.value = []
    notify.error('Error al cargar labores disponibles')
  }
}

function onLaborTipoChange() {
  const seleccionada = laborSeleccionada.value
  laborForm.valorUnitario = seleccionada?.tarifa !== undefined && seleccionada?.tarifa !== null
    ? Number(seleccionada.tarifa)
    : undefined
  if (seleccionada?.tipo === 'POR_JORNADA') laborForm.cantidad = 1
}

async function fetchLaboresHoy() {
  try {
    const res = await api.get('/trabajadores-ops/labores', { params: { fecha: todayISO() } })
    const d = apiResponse.unwrap(res) as any
    laboresHoy.value = d.items ?? d
  } catch {
    laboresHoy.value = []
    notify.error('Error al cargar labores del dia')
  }
}

async function fetchAnticipos() {
  loadingAnt.value = true
  try {
    const params: Record<string, any> = {}
    if (filtroTrabAnticipos.value) params.trabajadorId = filtroTrabAnticipos.value
    const res = await api.get('/trabajadores-ops/anticipos', { params })
    const d = apiResponse.unwrap(res) as any
    const list = Array.isArray(d?.items) ? d.items : (Array.isArray(d) ? d : [])
    anticipos.value = list.map((a: any) => {
      const totalAbonos = Array.isArray(a.abonos)
        ? a.abonos.reduce((sum: number, ab: any) => sum + Number(ab?.monto ?? 0), 0)
        : 0

      return {
        ...a,
        saldoPendiente: Math.max(0, Number(a?.monto ?? 0) - totalAbonos),
      }
    })
  } catch {
    anticipos.value = []
    notify.error('Error al cargar anticipos')
  } finally {
    loadingAnt.value = false
  }
}

async function registrarLabor() {
  savingLabor.value = true
  try {
    const cantidad = Number(laborForm.cantidad ?? 0)

    await api.post('/trabajadores-ops/labores', {
      trabajadorId: laborForm.trabajadorId,
      laborTarifaId: laborSeleccionada.value?.tarifaId,
      laborTipoId: laborForm.laborTipoId,
      fecha: laborForm.fecha,
      cantidadRealizado: cantidad,
      valorUnitario: laborForm.valorUnitario,
      observaciones: laborForm.notas || undefined,
    })
    notify.success('Labor registrada')
    laborForm.laborTipoId = undefined
    laborForm.cantidad = 1
    laborForm.valorUnitario = undefined
    laborForm.notas = ''
    await fetchLaboresHoy()
    await fetchTrabajadores()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al registrar labor')
  } finally {
    savingLabor.value = false
  }
}

function abrirPagarModal(t: any) {
  trabSeleccionado.value = t
  pagarForm.monto = t.saldoTotal ?? 0
  pagarForm.notas = ''
  modalPagar.value = true
}

async function pagarTrabajador() {
  savingPagar.value = true
  try {
    await api.post('/trabajadores-ops/pagos', {
      trabajadorId: trabSeleccionado.value.id,
      fecha: todayISO(),
      montoBase: pagarForm.monto,
      observaciones: pagarForm.notas || undefined,
    })
    notify.success('Pago registrado')
    modalPagar.value = false
    await fetchTrabajadores()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al pagar')
  } finally {
    savingPagar.value = false
  }
}

function abrirAnticipoModal(t: any) {
  trabSeleccionado.value = t
  anticipoForm.tipo = 'ANTICIPO'
  anticipoForm.monto = 0
  anticipoForm.descripcion = ''
  modalAnticipo.value = true
}

async function registrarAnticipo() {
  savingAnticipo.value = true
  try {
    await api.post('/trabajadores-ops/anticipos', {
      trabajadorId: trabSeleccionado.value.id,
      tipo: anticipoForm.tipo,
      monto: anticipoForm.monto,
      fecha: todayISO(),
      motivo: anticipoForm.descripcion || undefined,
      observaciones: anticipoForm.descripcion || undefined,
    })
    notify.success('Anticipo registrado')
    modalAnticipo.value = false
    if (tabActivo.value === 'anticipos') await fetchAnticipos()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al registrar anticipo')
  } finally {
    savingAnticipo.value = false
  }
}

function abrirAbonoModal(a: any) {
  anticipoSeleccionado.value = a
  abonoForm.monto = a.saldoPendiente ?? a.saldo ?? 0
  abonoForm.notas = ''
  modalAbono.value = true
}

async function registrarAbono() {
  savingAbono.value = true
  try {
    await api.post('/trabajadores-ops/abonos', {
      trabajadorId: anticipoSeleccionado.value.trabajadorId,
      anticipoPrestamoId: anticipoSeleccionado.value.id,
      monto: abonoForm.monto,
      fecha: todayISO(),
      observaciones: abonoForm.notas || undefined,
    })
    notify.success('Abono registrado')
    modalAbono.value = false
    await fetchAnticipos()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al registrar abono')
  } finally {
    savingAbono.value = false
  }
}

watch(tabActivo, (t) => {
  if (t === 'labores') fetchLaboresHoy()
  if (t === 'anticipos') fetchAnticipos()
})

onMounted(async () => {
  await Promise.all([fetchTrabajadores(), fetchTiposLabor(), fetchLaboresHoy()])
})
</script>
