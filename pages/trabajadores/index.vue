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
                  <button class="btn-secondary text-xs py-1 px-2 inline-flex items-center gap-1" @click="abrirPrestamoModalConTrabajador(t)">
                    <WalletCards class="h-3.5 w-3.5" />
                    Préstamo
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
      <div class="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div class="card space-y-5">
          <div>
            <h2 class="font-semibold text-gray-800">Registrar labor</h2>
            <p class="text-sm text-gray-500">
              El valor se define aquí. Catálogo solo guarda la modalidad de pago del trabajador.
            </p>
          </div>

          <FormField label="Trabajador *">
            <select v-model="laborForm.trabajadorId" class="form-input" @change="onTrabajadorChange">
              <option :value="undefined">Seleccionar trabajador…</option>
              <option v-for="t in trabajadores" :key="t.id" :value="t.id">
                {{ t.nombre }} · {{ modalidadPagoLabel(t.modalidadPago) }}
              </option>
            </select>
          </FormField>

          <div
            v-if="trabajadorSeleccionado"
            class="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900"
          >
            <p class="font-medium">{{ trabajadorSeleccionado.nombre }}</p>
            <p class="mt-1 text-indigo-700">
              Modalidad: {{ modalidadPagoLabel(trabajadorSeleccionado.modalidadPago) }}
              <span v-if="trabajadorSeleccionado.modalidadPago === 'POR_JORNADA' && tarifaJornadaReferencia > 0">
                · Referencia jornada {{ formatCurrency(tarifaJornadaReferencia) }}
              </span>
            </p>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Tipo de labor *">
              <select v-model.number="laborForm.laborTipoId" class="form-input" @change="onLaborTipoChange">
                <option :value="undefined">Seleccionar labor…</option>
                <option v-for="l in laborOpciones" :key="l.id" :value="l.id">
                  {{ l.nombre }}
                </option>
              </select>
            </FormField>
            <FormField label="Fecha">
              <input v-model="laborForm.fecha" class="form-input" type="date" />
            </FormField>
            <FormField :label="cantidadLabel">
              <input v-model.number="laborForm.cantidad" class="form-input" type="number" min="0.01" step="0.01" />
            </FormField>
            <FormField :label="valorUnitarioLabel">
              <input
                v-model.number="laborForm.valorUnitario"
                class="form-input"
                type="number"
                min="1"
                step="1"
                :placeholder="valorUnitarioPlaceholder"
              />
            </FormField>
            <FormField label="Notas" class="md:col-span-2">
              <input v-model="laborForm.notas" class="form-input" placeholder="Opcional" />
            </FormField>
          </div>

          <button
            class="btn-primary inline-flex items-center gap-2"
            :disabled="savingLabor || !puedeRegistrarLabor"
            @click="registrarLabor"
          >
            <ClipboardList class="h-4 w-4" />
            {{ savingLabor ? 'Guardando…' : `Registrar labor ${formatCurrency(montoEstimado)}` }}
          </button>
        </div>

        <aside class="card h-fit space-y-4 bg-slate-50">
          <div>
            <p class="text-xs font-bold uppercase text-slate-500">Cálculo</p>
            <h3 class="mt-1 font-semibold text-gray-800">Total a acreditar</h3>
          </div>
          <div class="rounded-lg border border-slate-200 bg-white p-4">
            <p class="text-sm text-gray-500">{{ calculoDescripcion }}</p>
            <p class="mt-3 text-3xl font-black text-gray-900">{{ formatCurrency(montoEstimado) }}</p>
          </div>
          <p class="text-xs text-gray-500">
            Este monto se suma al saldo pendiente del trabajador. Luego lo pagas desde la pestaña Resumen.
          </p>
        </aside>
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
              <th class="pb-2 font-medium">Unidades</th>
              <th class="pb-2 font-medium">Causado</th>
              <th class="pb-2 font-medium">Pagado</th>
              <th class="pb-2 font-medium">Saldo</th>
              <th class="pb-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in laboresHoy" :key="l.id" class="border-b border-gray-50">
              <td class="py-1.5">{{ l.trabajador?.nombre ?? '—' }}</td>
              <td class="py-1.5">{{ l.laborTarifa?.laborTipo?.nombre ?? '—' }}</td>
              <td class="py-1.5 text-center">{{ l.cantidadRealizado ?? '—' }}</td>
              <td class="py-1.5 text-right text-gray-700">{{ formatCurrency(Number(l.montoAPagar ?? 0)) }}</td>
              <td class="py-1.5 text-right text-blue-700">{{ formatCurrency(Number(l.montoPagado ?? 0)) }}</td>
              <td class="py-1.5 text-right font-medium text-orange-700">{{ formatCurrency(Number(l.saldoPendiente ?? l.montoAPagar ?? 0)) }}</td>
              <td class="py-1.5 text-center">
                <span class="px-2 py-0.5 rounded text-xs font-semibold" :class="estadoLaborClass(l.estadoPago)">
                  {{ estadoLaborLabel(l.estadoPago) }}
                </span>
              </td>
            </tr>
            <tr v-if="!laboresHoy.length">
              <td colspan="7" class="py-4 text-center text-gray-400">Sin labores registradas hoy</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB: Préstamos -->
    <div v-if="tabActivo === 'prestamos'" class="space-y-4">
      <div class="flex gap-3 flex-col sm:flex-row sm:items-center">
        <select v-model="filtroTrabPrestamos" class="form-input flex-1" @change="fetchPrestamos">
          <option value="">Todos los trabajadores</option>
          <option v-for="t in trabajadores" :key="t.id" :value="t.id">{{ t.nombre }}</option>
        </select>
        <select v-model="trabSeleccionado" class="form-input flex-1" @change="prestamoForm.monto = 0">
          <option :value="null">Seleccionar trabajador para préstamo...</option>
          <option v-for="t in trabajadores" :key="t.id" :value="t">
            {{ t.nombre }} · Saldo: {{ formatCurrency(t.saldoTotal ?? 0) }}
          </option>
        </select>
        <button class="btn-primary inline-flex items-center gap-2 text-sm whitespace-nowrap" :disabled="!trabSeleccionado?.id" @click="abrirPrestamoModal(trabSeleccionado)">
          <Plus class="h-4 w-4" />
          Nuevo préstamo
        </button>
      </div>

      <div class="card overflow-x-auto p-0">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-center text-gray-500 border-b text-xs uppercase">
              <th class="px-4 py-3 font-medium">Trabajador</th>
              <th class="px-4 py-3 font-medium">Número</th>
              <th class="px-4 py-3 font-medium">Monto prestado</th>
              <th class="px-4 py-3 font-medium">Abonado</th>
              <th class="px-4 py-3 font-medium">Saldo pendiente</th>
              <th class="px-4 py-3 font-medium">Estado</th>
              <th class="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingPrestamos">
              <td colspan="7" class="px-4 py-8 text-center text-gray-400">Cargando…</td>
            </tr>
            <tr
              v-for="p in prestamos"
              :key="p.id"
              class="border-b border-gray-50 hover:bg-gray-50"
            >
              <td class="px-4 py-3">
                <p class="font-medium text-gray-800">{{ p.trabajador?.nombre ?? '—' }}</p>
              </td>
              <td class="px-4 py-3 font-medium">{{ p.numero ?? p.id }}</td>
              <td class="px-4 py-3 text-right font-medium">{{ formatCurrency(p.monto) }}</td>
              <td class="px-4 py-3 text-right text-blue-600">{{ formatCurrency(p.totalAbonado ?? 0) }}</td>
              <td class="px-4 py-3 text-right" :class="(p.saldoPendiente ?? 0) > 0 ? 'text-orange-600 font-semibold' : 'text-gray-400'">
                {{ formatCurrency(p.saldoPendiente ?? 0) }}
              </td>
              <td class="px-4 py-3">
                <EstadoBadge :estado="p.estado ?? 'ACTIVO'" />
              </td>
              <td class="px-4 py-3 text-right">
                <button
                  v-if="(p.saldoPendiente ?? 0) > 0"
                  class="text-xs text-blue-600 hover:underline font-medium"
                  @click="abrirAbonoModal(p)"
                >Abonar</button>
              </td>
            </tr>
            <tr v-if="!prestamos.length && !loadingPrestamos">
              <td colspan="7" class="px-4 py-8 text-center text-gray-400">Sin préstamos registrados.</td>
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

        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p class="text-[10px] font-semibold uppercase text-slate-500">Saldo antes</p>
            <p class="mt-1 text-lg font-bold text-slate-800">{{ formatCurrency(saldoAntesPago) }}</p>
          </div>
          <div class="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
            <p class="text-[10px] font-semibold uppercase text-blue-600">A pagar</p>
            <p class="mt-1 text-lg font-bold text-blue-800">{{ formatCurrency(Number(pagarForm.monto ?? 0)) }}</p>
          </div>
          <div class="rounded-lg border border-green-200 bg-green-50 px-3 py-2">
            <p class="text-[10px] font-semibold uppercase text-green-700">Saldo después</p>
            <p class="mt-1 text-lg font-bold text-green-800">{{ formatCurrency(saldoDespuesPago) }}</p>
          </div>
        </div>

        <div v-if="tipoPagoPreview" class="flex justify-center">
          <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide" :class="tipoPagoPreview === 'TOTAL' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'">
            Pago {{ tipoPagoPreview === 'TOTAL' ? 'total' : 'parcial' }}
          </span>
        </div>

        <div class="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          Un <strong>anticipo</strong> entrega dinero por adelantado y crea deuda. Un <strong>pago</strong> cubre labores ya causadas y reduce el saldo pendiente.
        </div>

        <FormField label="Monto a pagar ($) *">
          <CurrencyInput v-model="pagarForm.monto" placeholder="$0" />
          <button
            type="button"
            class="mt-2 text-xs font-medium text-blue-600 hover:underline"
            @click="pagarForm.monto = trabSeleccionado?.saldoTotal ?? 0"
          >
            Pagar saldo completo
          </button>
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

    <!-- Modal anticipo (en Resumen) -->
    <div
      v-if="modalAnticipo"
      class="fixed inset-0 bg-black/40 flex items-stretch justify-center z-50 p-0 sm:items-center sm:p-4"
      @click.self="modalAnticipo = false"
    >
      <div class="bg-white rounded-none shadow-xl w-full max-w-md p-4 sm:rounded-lg sm:p-6 space-y-4 max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto">
        <h2 class="font-bold text-gray-800">Anticipo de labor — {{ trabSeleccionado?.nombre }}</h2>
        <p class="text-sm text-gray-500">Adelanto sobre lo que va a ganar hoy. Se descuenta automáticamente del saldo total.</p>

        <FormField label="Monto ($) *">
          <CurrencyInput v-model="anticipoForm.monto" placeholder="$0" />
        </FormField>
        <FormField label="Observaciones">
          <input v-model="anticipoForm.descripcion" class="form-input" />
        </FormField>

        <div class="flex justify-end gap-2 pt-2">
          <button class="btn-secondary" @click="modalAnticipo = false">Cancelar</button>
          <button class="btn-primary" :disabled="savingAnticipo || !anticipoForm.monto" @click="registrarAnticipo">
            {{ savingAnticipo ? 'Guardando…' : 'Registrar anticipo' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal préstamo -->
    <div
      v-if="modalPrestamo"
      class="fixed inset-0 bg-black/40 flex items-stretch justify-center z-50 p-0 sm:items-center sm:p-4"
      @click.self="modalPrestamo = false"
    >
      <div class="bg-white rounded-none shadow-xl w-full max-w-md p-4 sm:rounded-lg sm:p-6 space-y-4 max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto">
        <h2 class="font-bold text-gray-800">Nuevo préstamo — {{ trabSeleccionado?.nombre }}</h2>
        <p class="text-sm text-gray-500">Dinero prestado que el trabajador debe devolver mediante abonos.</p>

        <FormField label="Monto a prestar ($) *">
          <CurrencyInput v-model="prestamoForm.monto" placeholder="$0" />
        </FormField>
        <FormField label="Motivo">
          <input v-model="prestamoForm.motivo" class="form-input" placeholder="Ej: Emergencia personal" />
        </FormField>
        <FormField label="Observaciones">
          <textarea v-model="prestamoForm.observaciones" class="form-input resize-none" rows="2" />
        </FormField>

        <div class="flex justify-end gap-2 pt-2">
          <button class="btn-secondary" @click="modalPrestamo = false">Cancelar</button>
          <button class="btn-primary" :disabled="savingPrestamo || !prestamoForm.monto" @click="registrarPrestamo">
            {{ savingPrestamo ? 'Guardando…' : 'Registrar préstamo' }}
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
          <CurrencyInput v-model="abonoForm.monto" placeholder="$0" />
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
import { ClipboardList, HandCoins, Plus, RefreshCw, UsersRound, WalletCards } from 'lucide-vue-next'
import { formatCurrency, todayISO } from '~/utils/formats'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const notify = useNotification()
const apiResponse = useApiResponse()

const TABS = [
  { id: 'resumen', label: 'Resumen', icon: UsersRound },
  { id: 'labores', label: 'Labores', icon: ClipboardList },
  { id: 'prestamos', label: 'Préstamos', icon: WalletCards },
]
const tabActivo = ref('resumen')

const loadingTrab = ref(true)
const trabajadores = ref<any[]>([])
const laboresDisponibles = ref<any[]>([])
const tiposLabor = ref<any[]>([])
const laboresHoy = ref<any[]>([])
const loadingPrestamos = ref(false)
const prestamos = ref<any[]>([])
const filtroTrabPrestamos = ref<number | ''>('')

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
const saldoAntesPago = ref(0)
const saldoDespuesPago = computed(() =>
  Math.max(0, saldoAntesPago.value - Number(pagarForm.monto ?? 0)),
)
const tipoPagoPreview = computed(() => {
  const monto = Number(pagarForm.monto ?? 0)
  if (monto <= 0) return ''
  return monto >= saldoAntesPago.value ? 'TOTAL' : 'PARCIAL'
})

function estadoLaborLabel(estado?: string) {
  const labels: Record<string, string> = {
    PENDIENTE: 'Pendiente',
    PARCIAL: 'Parcial',
    PAGADA: 'Pagada',
    ANULADA: 'Anulada',
  }
  return labels[String(estado ?? 'PENDIENTE')] ?? estado ?? 'Pendiente'
}

function estadoLaborClass(estado?: string) {
  const classes: Record<string, string> = {
    PENDIENTE: 'bg-orange-100 text-orange-700',
    PARCIAL: 'bg-yellow-100 text-yellow-800',
    PAGADA: 'bg-green-100 text-green-700',
    ANULADA: 'bg-gray-100 text-gray-500',
  }
  return classes[String(estado ?? 'PENDIENTE')] ?? classes.PENDIENTE
}

// Anticipo
const modalAnticipo = ref(false)
const savingAnticipo = ref(false)
const anticipoForm = reactive({ monto: 0, descripcion: '' })

// Préstamo
const modalPrestamo = ref(false)
const savingPrestamo = ref(false)
const prestamoForm = reactive({ monto: 0, motivo: '', observaciones: '' })

// Abono
const modalAbono = ref(false)
const savingAbono = ref(false)
const abonoForm = reactive({ monto: 0, notas: '' })

const trabajadoresActivos = computed(() => trabajadores.value.filter((t) => t.activo).length)
const saldoTotalTrabajadores = computed(() =>
  trabajadores.value.reduce((sum, t) => sum + Number(t?.saldoTotal ?? 0), 0),
)
const trabajadorSeleccionado = computed(() =>
  trabajadores.value.find((t) => t.id === laborForm.trabajadorId),
)
const laborOpciones = computed(() => {
  const modalidad = trabajadorSeleccionado.value?.modalidadPago
  const base = modalidad
    ? tiposLabor.value.filter((tipo: any) => tipo.tipo === modalidad)
    : tiposLabor.value

  return base.map((tipo: any) => {
    const tarifa = laboresDisponibles.value.find(
      (l: any) => l.laborTipoId === tipo.id || l.laborTipo?.id === tipo.id,
    )
    return {
      ...tipo,
      tarifaId: tarifa?.id,
      tarifa: Number(tarifa?.tarifa ?? 0),
    }
  })
})
const tarifaJornadaReferencia = computed(() => {
  if (trabajadorSeleccionado.value?.modalidadPago === 'POR_JORNADA') {
    return Number(trabajadorSeleccionado.value?.tarifaBase ?? 0)
  }
  const tarifa = laboresDisponibles.value.find(
    (l: any) => l?.laborTipo?.tipo === 'POR_JORNADA' && Number(l?.tarifa ?? 0) > 0,
  )
  return Number(tarifa?.tarifa ?? 0)
})
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
const puedeRegistrarLabor = computed(() =>
  Boolean(
    laborForm.trabajadorId &&
    laborForm.laborTipoId &&
    Number(laborForm.cantidad ?? 0) > 0 &&
    Number(laborForm.valorUnitario ?? 0) > 0,
  ),
)
const calculoDescripcion = computed(() => {
  const cantidad = Number(laborForm.cantidad ?? 0)
  const valor = Number(laborForm.valorUnitario ?? 0)
  if (!laborSeleccionada.value || cantidad <= 0 || valor <= 0) {
    return 'Completa trabajador, labor, unidades y valor unitario.'
  }
  const unidad = tipoPagoLabel(laborSeleccionada.value.tipo)
  return `${cantidad} ${unidad} × ${formatCurrency(valor)}`
})

function modalidadPagoLabel(modalidad?: string) {
  if (modalidad === 'POR_HORA') return 'Por hora'
  if (modalidad === 'POR_PACA') return 'Por paca'
  if (modalidad === 'POR_JORNADA') return 'Por jornada'
  return 'Sin definir'
}

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

async function onTrabajadorChange() {
  laborForm.laborTipoId = undefined
  laborForm.valorUnitario = undefined
  laborForm.cantidad = 1
  await fetchLaboresDisponibles()
}

async function fetchLaboresDisponibles() {
  if (!laborForm.trabajadorId) {
    laboresDisponibles.value = []
    return
  }
  try {
    const res = await api.get(`/catalogos/trabajadores/${laborForm.trabajadorId}`)
    const d = apiResponse.unwrap(res) as any
    laboresDisponibles.value = d.laboresDisponibles ?? []
  } catch {
    laboresDisponibles.value = []
    notify.error('Error al cargar datos del trabajador')
  }
}

function onLaborTipoChange() {
  const seleccionada = laborSeleccionada.value
  laborForm.valorUnitario = undefined

  if (seleccionada?.tipo === 'POR_JORNADA') {
    const referencia = tarifaJornadaReferencia.value
    if (referencia > 0) laborForm.valorUnitario = referencia
    laborForm.cantidad = 1
    return
  }

  if (seleccionada?.tipo === 'POR_HORA') {
    laborForm.cantidad = 8
    return
  }

  if (seleccionada?.tipo === 'POR_PACA') {
    laborForm.cantidad = 1
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

async function fetchPrestamos() {
  loadingPrestamos.value = true
  try {
    const params: Record<string, any> = {}
    if (filtroTrabPrestamos.value) params.trabajadorId = filtroTrabPrestamos.value
    const res = await api.get('/trabajadores-ops/anticipos', { params })
    const d = apiResponse.unwrap(res) as any
    const list = Array.isArray(d?.items) ? d.items : (Array.isArray(d) ? d : [])
    
    // Filtrar solo PRESTAMO y calcular saldo pendiente
    prestamos.value = list
      .filter((a: any) => a.tipo === 'PRESTAMO')
      .map((a: any) => {
        const totalAbonos = Array.isArray(a.abonos)
          ? a.abonos.reduce((sum: number, ab: any) => sum + Number(ab?.monto ?? 0), 0)
          : 0

        return {
          ...a,
          totalAbonado: totalAbonos,
          saldoPendiente: Math.max(0, Number(a?.monto ?? 0) - totalAbonos),
        }
      })
  } catch {
    prestamos.value = []
    notify.error('Error al cargar préstamos')
  } finally {
    loadingPrestamos.value = false
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
  saldoAntesPago.value = Number(t.saldoTotal ?? 0)
  pagarForm.monto = saldoAntesPago.value
  pagarForm.notas = ''
  modalPagar.value = true
}

async function pagarTrabajador() {
  savingPagar.value = true
  try {
    const saldo = saldoAntesPago.value
    if (Number(pagarForm.monto ?? 0) > saldo) {
      notify.error(`El monto no puede superar el saldo pendiente (${formatCurrency(saldo)})`)
      return
    }
    const res = await api.post('/trabajadores-ops/pagos', {
      trabajadorId: trabSeleccionado.value.id,
      fecha: todayISO(),
      montoBase: pagarForm.monto,
      observaciones: pagarForm.notas || undefined,
    })
    const d = apiResponse.unwrap(res) as any
    const etiqueta = d?.tipoPago === 'PARCIAL' ? 'Pago parcial registrado' : 'Pago total registrado'
    notify.success(`${etiqueta}. Nuevo saldo: ${formatCurrency(d?.saldoDespues ?? 0)}`)
    modalPagar.value = false
    await Promise.all([fetchTrabajadores(), fetchLaboresHoy()])
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al pagar')
  } finally {
    savingPagar.value = false
  }
}

function abrirAnticipoModal(t: any) {
  trabSeleccionado.value = t
  anticipoForm.monto = 0
  anticipoForm.descripcion = ''
  modalAnticipo.value = true
}

async function registrarAnticipo() {
  savingAnticipo.value = true
  try {
    await api.post('/trabajadores-ops/anticipos', {
      trabajadorId: trabSeleccionado.value.id,
      tipo: 'ANTICIPO',
      monto: anticipoForm.monto,
      fecha: todayISO(),
      motivo: anticipoForm.descripcion || undefined,
      observaciones: anticipoForm.descripcion || undefined,
    })
    notify.success('Anticipo registrado')
    modalAnticipo.value = false
    await fetchTrabajadores()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al registrar anticipo')
  } finally {
    savingAnticipo.value = false
  }
}

function abrirPrestamoModal(t?: any) {
  if (!t && !trabSeleccionado.value?.id) {
    notify.error('Selecciona un trabajador primero')
    return
  }
  if (t) {
    trabSeleccionado.value = t
  }
  prestamoForm.monto = 0
  prestamoForm.motivo = ''
  prestamoForm.observaciones = ''
  modalPrestamo.value = true
}

function abrirPrestamoModalConTrabajador(t: any) {
  trabSeleccionado.value = t
  prestamoForm.monto = 0
  prestamoForm.motivo = ''
  prestamoForm.observaciones = ''
  modalPrestamo.value = true
}

async function registrarPrestamo() {
  savingPrestamo.value = true
  try {
    await api.post('/trabajadores-ops/anticipos', {
      trabajadorId: trabSeleccionado.value.id,
      tipo: 'PRESTAMO',
      monto: prestamoForm.monto,
      fecha: todayISO(),
      motivo: prestamoForm.motivo || undefined,
      observaciones: prestamoForm.observaciones || undefined,
    })
    notify.success('Préstamo registrado')
    modalPrestamo.value = false
    await fetchPrestamos()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al registrar préstamo')
  } finally {
    savingPrestamo.value = false
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
    await fetchPrestamos()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al registrar abono')
  } finally {
    savingAbono.value = false
  }
}

watch(tabActivo, (t) => {
  if (t === 'labores') fetchLaboresHoy()
  if (t === 'prestamos') fetchPrestamos()
})

onMounted(async () => {
  await Promise.all([fetchTrabajadores(), fetchTiposLabor(), fetchLaboresHoy()])
})
</script>
