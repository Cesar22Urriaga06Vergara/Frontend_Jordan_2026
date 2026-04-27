<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-800">Trabajadores</h1>

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
      >{{ tab.label }}</button>
    </div>

    <!-- TAB: Resumen trabajadores -->
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
              <td class="px-4 py-3 font-medium text-gray-800">{{ t.nombre }}</td>
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
                  <button class="text-xs text-blue-600 hover:underline" @click="abrirPagarModal(t)">Pagar</button>
                  <button class="text-xs text-purple-600 hover:underline" @click="abrirAnticipoModal(t)">Anticipo</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB: Registrar labor -->
    <div v-if="tabActivo === 'labores'" class="space-y-4">
      <div class="card space-y-4 max-w-lg">
        <h2 class="font-semibold text-gray-700">Registrar labor</h2>

        <FormField label="Trabajador *">
          <select v-model="laborForm.trabajadorId" class="form-input" @change="fetchLaboresDisponibles">
            <option :value="undefined">Seleccionar…</option>
            <option v-for="t in trabajadores" :key="t.id" :value="t.id">{{ t.nombre }}</option>
          </select>
        </FormField>
        <FormField label="Tipo de labor *">
          <select v-model="laborForm.laborId" class="form-input">
            <option :value="undefined">Seleccionar…</option>
            <option v-for="l in laboresDisponibles" :key="l.id" :value="l.id">
              {{ l.laborTipo?.nombre }} — {{ formatCurrency(Number(l.tarifa ?? 0)) }}/u
            </option>
          </select>
        </FormField>
        <FormField label="Cantidad">
          <input v-model.number="laborForm.cantidad" class="form-input" type="number" min="1" />
        </FormField>
        <FormField label="Fecha">
          <input v-model="laborForm.fecha" class="form-input" type="date" />
        </FormField>
        <FormField label="Notas">
          <input v-model="laborForm.notas" class="form-input" />
        </FormField>

        <button
          class="btn-primary"
          :disabled="savingLabor || !laborForm.trabajadorId || !laborForm.laborId"
          @click="registrarLabor"
        >{{ savingLabor ? 'Guardando…' : 'Registrar labor' }}</button>
      </div>

      <!-- Labores del día -->
      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-sm text-gray-700">Labores de hoy</h3>
          <button class="text-xs text-blue-600 hover:underline" @click="fetchLaboresHoy">Actualizar</button>
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
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="modalPagar = false"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
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
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="modalAnticipo = false"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
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
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="modalAbono = false"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
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
import { formatCurrency, todayISO } from '~/utils/formats'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const notify = useNotification()
const apiResponse = useApiResponse()

const TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'labores', label: 'Labores' },
  { id: 'anticipos', label: 'Anticipos / Deudas' },
]
const tabActivo = ref('resumen')

const loadingTrab = ref(true)
const trabajadores = ref<any[]>([])
const laboresDisponibles = ref<any[]>([])
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
  laborId: undefined as number | undefined,
  cantidad: 1,
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

async function fetchLaboresDisponibles() {
  if (!laborForm.trabajadorId) { laboresDisponibles.value = []; return }
  try {
    const res = await api.get(`/catalogos/trabajadores/${laborForm.trabajadorId}`)
    const d = apiResponse.unwrap(res) as any
    laboresDisponibles.value = d.laboresDisponibles ?? []
  } catch {
    laboresDisponibles.value = []
    notify.error('Error al cargar labores disponibles')
  }
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
    const tarifa = laboresDisponibles.value.find((l: any) => l.id === laborForm.laborId)
    const cantidad = Number(laborForm.cantidad ?? 0)
    const valorTarifa = Number(tarifa?.tarifa ?? 0)

    await api.post('/trabajadores-ops/labores', {
      trabajadorId: laborForm.trabajadorId,
      laborTarifaId: laborForm.laborId,
      fecha: laborForm.fecha,
      cantidadRealizado: cantidad,
      montoAPagar: cantidad * valorTarifa,
      observaciones: laborForm.notas || undefined,
    })
    notify.success('Labor registrada')
    laborForm.laborId = undefined
    laborForm.cantidad = 1
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
  await fetchTrabajadores()
})
</script>
