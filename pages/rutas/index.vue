<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <h1 class="text-2xl font-bold text-gray-800">Rutas</h1>
      <button class="btn-primary flex items-center gap-2" @click="abrirModal()">
        <Plus :size="16" /> Nueva ruta
      </button>
    </div>

    <!-- Filtros -->
    <div class="card flex flex-wrap gap-3">
      <select v-model="filtroEstado" class="form-input flex-1 min-w-36 sm:flex-none sm:w-40" @change="pagina = 1; fetchRutas()">
        <option value="">Todos los estados</option>
        <option v-for="e in ESTADOS" :key="e" :value="e">{{ e }}</option>
      </select>
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
            <td colspan="6" class="px-4 py-8 text-center text-gray-400">Sin rutas.</td>
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
                <button class="flex items-center gap-1 text-xs text-blue-600 hover:underline" @click="abrirDetalle(r)">
                  <ArrowRight :size="14" /> Gestionar
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
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="modalForm = false"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 class="font-bold text-gray-800">Nueva ruta</h2>

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
          <button class="btn-primary" :disabled="saving" @click="crearRuta">
            {{ saving ? 'Creando…' : 'Crear' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Panel detalle / gestión -->
    <div
      v-if="modalDetalle && rutaActiva"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="cerrarDetalle"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between">
          <h2 class="font-bold text-gray-800">{{ rutaActiva.numero }}</h2>
          <EstadoBadge :estado="rutaActiva.estado" />
        </div>

        <!-- Pedidos de la ruta -->
        <div>
          <h3 class="text-sm font-semibold text-gray-600 mb-2">Pedidos ({{ rutaActiva.itemsRuta?.length ?? 0 }})</h3>
          <ul class="text-sm divide-y divide-gray-100">
            <li
              v-for="item in rutaActiva.itemsRuta"
              :key="item.id"
              class="py-2 flex items-center justify-between"
            >
              <span>{{ item.pedido?.numero ?? item.pedidoId }}</span>
              <div class="flex gap-2 items-center">
                <EstadoBadge :estado="item.pedido?.estado ?? ''" />
                <button
                  v-if="['CREADA', 'CARGADA'].includes(rutaActiva.estado)"
                  class="text-xs text-red-500 hover:underline"
                  @click="quitarPedido(item.pedidoId)"
                >Quitar</button>
              </div>
            </li>
            <li v-if="!rutaActiva.itemsRuta?.length" class="py-3 text-gray-400 text-center">Sin pedidos</li>
          </ul>
        </div>

        <!-- Agregar pedidos -->
        <div v-if="['CREADA', 'CARGADA'].includes(rutaActiva.estado)" class="border-t pt-4">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-gray-600">Agregar pedidos pendientes</h3>
            <span v-if="pedidosSeleccionados.length" class="text-xs text-blue-600">{{ pedidosSeleccionados.length }} seleccionado(s)</span>
          </div>

          <div v-if="loadingPendientes" class="text-xs text-gray-400 py-2">Cargando pedidos pendientes…</div>
          <div v-else-if="!pedidosPendientes.length" class="text-xs text-gray-400 py-2">No hay pedidos pendientes disponibles.</div>
          <div v-else class="space-y-1 max-h-48 overflow-y-auto border rounded-lg p-2 bg-gray-50">
            <label
              v-for="p in pedidosPendientes"
              :key="p.id"
              class="flex items-center gap-3 p-2 rounded hover:bg-white cursor-pointer text-sm"
              :class="pedidosSeleccionados.includes(p.id) ? 'bg-white ring-1 ring-blue-300' : ''"
            >
              <input
                type="checkbox"
                :value="p.id"
                v-model="pedidosSeleccionados"
                class="accent-blue-600"
              />
              <span class="font-medium text-gray-700">{{ p.numero ?? p.numeroPedido }}</span>
              <span class="text-gray-500 text-xs">{{ p.cliente?.nombre ?? '' }}</span>
            </label>
          </div>

          <button
            class="btn-primary mt-3 w-full"
            :disabled="!pedidosSeleccionados.length || agregandoPedidos"
            @click="agregarPedidosSeleccionados"
          >
            {{ agregandoPedidos ? 'Agregando…' : `Agregar ${pedidosSeleccionados.length || ''} pedido${pedidosSeleccionados.length !== 1 ? 's' : ''}` }}
          </button>
        </div>

        <!-- Transiciones de estado -->
        <div class="border-t pt-4 flex flex-wrap gap-2">
          <template v-for="t in transicionesRuta(rutaActiva.estado)" :key="t.valor">
            <button class="btn-primary text-sm" @click="cambiarEstadoRuta(t.valor)">{{ t.label }}</button>
          </template>
          <button
            v-if="rutaActiva.estado === 'EN_LIQUIDACION'"
            class="btn-primary bg-green-600 hover:bg-green-700 text-sm"
            @click="abrirLiquidacion"
          >Liquidar</button>
        </div>

        <button class="btn-secondary w-full" @click="cerrarDetalle">Cerrar</button>
      </div>
    </div>

    <!-- Modal liquidación -->
    <div
      v-if="modalLiquidacion"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="modalLiquidacion = false"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[85vh] overflow-y-auto">
        <h2 class="font-bold text-gray-800">Liquidar ruta</h2>

        <!-- Pedidos con estado de entrega -->
        <div class="border rounded-lg p-3 bg-gray-50">
          <h3 class="text-sm font-semibold text-gray-700 mb-2">Estado de entrega por pedido</h3>
          <div class="space-y-2">
            <div v-for="p in liqForm.pedidos" :key="p.pedidoId" class="p-2 bg-white rounded border border-gray-200 space-y-2">
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-700 truncate">{{ p.numero }}</p>
                  <p class="text-xs text-gray-500 truncate">Cliente: {{ p.clienteNombre }}</p>
                </div>
                <span class="text-xs text-gray-500">${{ Number(p.montoPedido || 0).toLocaleString('es-CO') }}</span>
              </div>

              <div class="rounded-md border border-gray-100 bg-gray-50 p-2">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Desglose</p>
                <div v-if="p.detalles.length" class="space-y-1">
                  <div
                    v-for="(d, idx) in p.detalles"
                    :key="`${p.pedidoId}-${idx}`"
                    class="text-xs text-gray-600 flex items-center justify-between gap-2"
                  >
                    <span class="truncate">{{ d.productoNombre }} · {{ d.cantidad }} x ${{ Number(d.precioUnitario).toLocaleString('es-CO') }}</span>
                    <span class="font-medium text-gray-700">${{ Number(d.subtotal).toLocaleString('es-CO') }}</span>
                  </div>
                </div>
                <p v-else class="text-xs text-gray-400">Sin detalle de productos.</p>
              </div>

              <select v-model="p.estadoEntrega" class="form-input text-sm py-2" @change="onCambioEstadoEntrega(p)">
                <option value="ENTREGADO_PAGADO">Entregado y cobrado</option>
                <option value="ENTREGADO_CREDITO">Entregado a crédito</option>
                <option value="NO_ENTREGADO">No entregado</option>
              </select>

              <div v-if="p.estadoEntrega === 'ENTREGADO_PAGADO'" class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select v-model="p.tipoPago" class="form-input text-sm" @change="onCambioTipoPago(p)">
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="AMBOS">Ambos</option>
                </select>

                <input
                  v-if="p.tipoPago === 'EFECTIVO' || p.tipoPago === 'AMBOS'"
                  v-model.number="p.montoEfectivo"
                  class="form-input text-sm"
                  type="number"
                  min="0"
                  placeholder="Monto efectivo"
                />

                <input
                  v-if="p.tipoPago === 'TRANSFERENCIA' || p.tipoPago === 'AMBOS'"
                  v-model.number="p.montoTransferencia"
                  class="form-input text-sm"
                  type="number"
                  min="0"
                  placeholder="Monto transferencia"
                />
              </div>

              <p v-if="p.estadoEntrega === 'ENTREGADO_PAGADO'" class="text-xs text-gray-500">
                Pagado: <strong>${{ montoPagadoPedido(p).toLocaleString('es-CO') }}</strong>
                · A cartera: <strong class="text-orange-600">${{ carteraPedido(p).toLocaleString('es-CO') }}</strong>
              </p>

              <div v-if="p.estadoEntrega === 'ENTREGADO_PAGADO'" class="pt-1">
                <span
                  class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  :class="estadoPagoPedidoClass(p)"
                >
                  {{ estadoPagoPedidoLabel(p) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="rounded-md border border-gray-200 bg-gray-50 p-2">
            <p class="text-gray-500">Total pedidos ruta</p>
            <p class="font-semibold text-gray-700">${{ totalPedidosRutaCalculado.toLocaleString('es-CO') }}</p>
          </div>
          <div class="rounded-md border border-gray-200 bg-gray-50 p-2">
            <p class="text-gray-500">Total entregado</p>
            <p class="font-semibold text-green-700">${{ totalEntregadoCalculado.toLocaleString('es-CO') }}</p>
          </div>
          <div class="rounded-md border border-gray-200 bg-gray-50 p-2">
            <p class="text-gray-500">Total crédito</p>
            <p class="font-semibold text-orange-700">${{ totalCarteraCalculado.toLocaleString('es-CO') }}</p>
          </div>
          <div class="rounded-md border border-gray-200 bg-gray-50 p-2">
            <p class="text-gray-500">Efectivo reportado</p>
            <p class="font-semibold text-gray-700">${{ totalEfectivoCalculado.toLocaleString('es-CO') }}</p>
          </div>
          <div class="rounded-md border border-gray-200 bg-gray-50 p-2">
            <p class="text-gray-500">Transferencia reportada</p>
            <p class="font-semibold text-gray-700">${{ totalTransferenciaCalculado.toLocaleString('es-CO') }}</p>
          </div>
          <div class="rounded-md border border-gray-200 bg-gray-50 p-2">
            <p class="text-gray-500">Total no entregado</p>
            <p class="font-semibold text-rose-700">${{ totalNoEntregadoCalculado.toLocaleString('es-CO') }}</p>
          </div>
        </div>

        <p class="text-xs text-gray-500 -mt-2">Total recibido: <strong>{{ totalRecibidoCalculado.toLocaleString('es-CO') }}</strong></p>
        <p class="text-xs text-orange-600 -mt-2">Total cartera (crédito): <strong>{{ totalCarteraCalculado.toLocaleString('es-CO') }}</strong></p>
        <FormField label="Gastos de ruta ($)">
          <input v-model.number="liqForm.gastosRuta" class="form-input" type="number" min="0" />
        </FormField>
        <FormField label="Notas">
          <textarea v-model="liqForm.notas" rows="2" class="form-input resize-none" />
        </FormField>

        <div class="flex justify-end gap-2 pt-2">
          <button class="btn-secondary" @click="modalLiquidacion = false">Cancelar</button>
          <button class="btn-primary" :disabled="saving" @click="liquidarRuta">
            {{ saving ? 'Liquidando…' : 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Confirmación Anulación -->
    <ModalConfirmacion
      ref="modalAnulaConfirm"
      titulo="¿Anular esta ruta?"
      descripcion="Una vez anulada, la ruta no podrá ser liquidada. Los pedidos volverán a estado PENDIENTE."
      textoConfirm="Sí, anular"
      textoCancel="Volver atrás"
      :detalles="{ Ruta: rutaActiva?.numero, Trabajador: rutaActiva?.domiciliario?.nombre }"
      advertencia="Esta acción no se puede deshacer."
      @confirm="procederAnular"
      @cancel="modalAnulaConfirm?.close()"
    />
  </div>
</template>

<script setup lang="ts">
import { formatDate, todayISO } from '~/utils/formats'
import { AlertTriangle, Plus, ArrowRight } from 'lucide-vue-next'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const notify = useNotification()
const apiResponse = useApiResponse()

const ESTADOS = ['CREADA', 'CARGADA', 'EN_ENTREGA', 'EN_LIQUIDACION', 'LIQUIDADA', 'ANULADA']

const loading = ref(true)
const saving = ref(false)
const rutas = ref<any[]>([])
const total = ref(0)
const pagina = ref(1)
const LIMITE = 15
const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / LIMITE)))
const filtroEstado = ref('')

const modalForm = ref(false)
const form = reactive({ fecha: todayISO(), domiciliarioId: undefined as number | undefined, observaciones: '' })
const errors = reactive({ fecha: '', domiciliarioId: '' })
const trabajadores = ref<any[]>([])

function validarForm(): boolean {
  errors.fecha = !form.fecha ? 'La fecha es requerida' : ''
  errors.domiciliarioId = !form.domiciliarioId ? 'Debes seleccionar un trabajador' : ''
  return !errors.fecha && !errors.domiciliarioId
}

const modalDetalle = ref(false)
const rutaActiva = ref<any>(null)
const modalAnulaConfirm = ref()
const pedidoIdAgregar = ref<number | undefined>(undefined)
const pedidosSeleccionados = ref<number[]>([])
const agregandoPedidos = ref(false)
const pedidosPendientes = ref<any[]>([])
const loadingPendientes = ref(false)

const modalLiquidacion = ref(false)
const liqForm = reactive({ 
  gastosRuta: 0, 
  notas: '',
  pedidos: [] as {
    pedidoId: number
    numero: string
    clienteNombre: string
    montoPedido: number
    detalles: {
      productoNombre: string
      cantidad: number
      precioUnitario: number
      subtotal: number
    }[]
    estadoEntrega: 'ENTREGADO_PAGADO' | 'ENTREGADO_CREDITO' | 'NO_ENTREGADO'
    tipoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'AMBOS'
    montoEfectivo: number
    montoTransferencia: number
  }[]
})

function montoPagadoPedido(p: any): number {
  if (p.estadoEntrega !== 'ENTREGADO_PAGADO') return 0
  const totalPedido = toNumberOrZero(p.montoPedido)
  const efectivo = toNumberOrZero(p.montoEfectivo)
  const transferencia = toNumberOrZero(p.montoTransferencia)

  if (p.tipoPago === 'EFECTIVO') return Math.min(totalPedido, efectivo)
  if (p.tipoPago === 'TRANSFERENCIA') return Math.min(totalPedido, transferencia)
  return Math.min(totalPedido, efectivo + transferencia)
}

function carteraPedido(p: any): number {
  const totalPedido = toNumberOrZero(p.montoPedido)
  if (p.estadoEntrega === 'NO_ENTREGADO') return 0
  if (p.estadoEntrega === 'ENTREGADO_CREDITO') return totalPedido
  return Math.max(0, totalPedido - montoPagadoPedido(p))
}

function estadoPagoPedidoLabel(p: any): string {
  const cartera = carteraPedido(p)
  if (cartera <= 0) return 'Pagado completo'
  return `Parcial, pasa ${formatCurrency(cartera)} a cartera`
}

function estadoPagoPedidoClass(p: any): string {
  return carteraPedido(p) <= 0
    ? 'bg-green-100 text-green-700'
    : 'bg-orange-100 text-orange-700'
}

function onCambioEstadoEntrega(p: any) {
  if (p.estadoEntrega === 'ENTREGADO_CREDITO') {
    p.tipoPago = 'EFECTIVO'
    p.montoEfectivo = 0
    p.montoTransferencia = 0
    return
  }

  if (p.estadoEntrega === 'NO_ENTREGADO') {
    p.tipoPago = 'EFECTIVO'
    p.montoEfectivo = 0
    p.montoTransferencia = 0
    return
  }

  p.tipoPago = p.tipoPago ?? 'EFECTIVO'
  if (p.tipoPago === 'EFECTIVO') {
    p.montoEfectivo = toNumberOrZero(p.montoEfectivo) || toNumberOrZero(p.montoPedido)
    p.montoTransferencia = 0
  }
  if (p.tipoPago === 'TRANSFERENCIA') {
    p.montoTransferencia = toNumberOrZero(p.montoTransferencia) || toNumberOrZero(p.montoPedido)
    p.montoEfectivo = 0
  }
}

function onCambioTipoPago(p: any) {
  if (p.tipoPago === 'EFECTIVO') {
    p.montoEfectivo = toNumberOrZero(p.montoPedido)
    p.montoTransferencia = 0
    return
  }
  if (p.tipoPago === 'TRANSFERENCIA') {
    p.montoTransferencia = toNumberOrZero(p.montoPedido)
    p.montoEfectivo = 0
    return
  }
  p.montoEfectivo = toNumberOrZero(p.montoEfectivo)
  p.montoTransferencia = toNumberOrZero(p.montoTransferencia)
}

const totalPedidosRutaCalculado = computed(() => {
  return liqForm.pedidos.reduce((acc, p) => acc + Number(p.montoPedido || 0), 0)
})

const totalCarteraCalculado = computed(() => {
  return liqForm.pedidos.reduce((acc, p) => acc + carteraPedido(p), 0)
})

const totalEfectivoCalculado = computed(() => {
  return liqForm.pedidos.reduce((acc, p) => {
    if (p.estadoEntrega !== 'ENTREGADO_PAGADO') return acc
    if (p.tipoPago === 'TRANSFERENCIA') return acc
    return acc + Math.max(0, toNumberOrZero(p.montoEfectivo))
  }, 0)
})

const totalTransferenciaCalculado = computed(() => {
  return liqForm.pedidos.reduce((acc, p) => {
    if (p.estadoEntrega !== 'ENTREGADO_PAGADO') return acc
    if (p.tipoPago === 'EFECTIVO') return acc
    return acc + Math.max(0, toNumberOrZero(p.montoTransferencia))
  }, 0)
})

const totalRecibidoCalculado = computed(() => {
  return totalEfectivoCalculado.value + totalTransferenciaCalculado.value
})

const totalEntregadoCalculado = computed(() => {
  return liqForm.pedidos
    .filter((p) => p.estadoEntrega !== 'NO_ENTREGADO')
    .reduce((acc, p) => acc + Number(p.montoPedido || 0), 0)
})

const totalNoEntregadoCalculado = computed(() => {
  return liqForm.pedidos
    .filter((p) => p.estadoEntrega === 'NO_ENTREGADO')
    .reduce((acc, p) => acc + Number(p.montoPedido || 0), 0)
})

const TRANSICIONES_RUTA: Record<string, { valor: string; label: string }[]> = {
  CREADA:  [{ valor: 'CARGADA', label: 'Marcar como cargada' }, { valor: 'ANULADA', label: 'Anular' }],
  CARGADA: [{ valor: 'EN_ENTREGA', label: 'Iniciar entrega' }, { valor: 'ANULADA', label: 'Anular' }],
  EN_ENTREGA: [{ valor: 'EN_LIQUIDACION', label: 'Pasar a liquidación' }],
  EN_LIQUIDACION: [],
}

function toNumberOrZero(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function transicionesRuta(estado: string) {
  return TRANSICIONES_RUTA[estado] ?? []
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
  form.fecha = todayISO()
  form.domiciliarioId = undefined
  form.observaciones = ''
  fetchTrabajadores()
  modalForm.value = true
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

async function abrirDetalle(ruta: any) {
  try {
    const res = await api.get(`/operaciones/rutas/${ruta.id}`)
    rutaActiva.value = apiResponse.unwrap(res)
  } catch {
    rutaActiva.value = ruta
    notify.error('No se pudo cargar el detalle completo de la ruta')
  }
  pedidoIdAgregar.value = undefined
  pedidosSeleccionados.value = []
  await fetchPedidosPendientes()
  modalDetalle.value = true
}

function cerrarDetalle() {
  modalDetalle.value = false
  rutaActiva.value = null
  pedidosPendientes.value = []
  pedidosSeleccionados.value = []
  fetchRutas()
}

async function fetchPedidosPendientes() {
  if (!rutaActiva.value) return
  loadingPendientes.value = true
  try {
    const res = await api.get('/operaciones/pedidos', {
      params: { estado: 'PENDIENTE', limit: 200 },
    })
    const d = apiResponse.unwrap(res) as any
    const lista = d.items ?? d.data ?? []
    // Solo excluir pedidos ya agregados a esta ruta; estado PENDIENTE ya lo cubre el backend
    const usados = new Set<number>((rutaActiva.value.itemsRuta ?? []).map((i: any) => i.pedidoId))
    pedidosPendientes.value = (Array.isArray(lista) ? lista : []).filter((p: any) => !usados.has(p.id))
  } catch {
    pedidosPendientes.value = []
    notify.error('No se pudieron cargar los pedidos pendientes')
  } finally {
    loadingPendientes.value = false
  }
}

async function agregarPedidosSeleccionados() {
  if (!pedidosSeleccionados.value.length) return
  agregandoPedidos.value = true
  try {
    let orden = (rutaActiva.value.itemsRuta?.length ?? 0) + 1
    for (const pedidoId of pedidosSeleccionados.value) {
      await api.post(`/operaciones/rutas/${rutaActiva.value.id}/pedidos`, {
        pedidoId,
        ordenEntrega: orden++,
      })
    }
    notify.success(`${pedidosSeleccionados.value.length} pedido(s) agregado(s)`)
    pedidosSeleccionados.value = []
    pedidoIdAgregar.value = undefined
    const res = await api.get(`/operaciones/rutas/${rutaActiva.value.id}`)
    rutaActiva.value = apiResponse.unwrap(res)
    await fetchPedidosPendientes()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al agregar pedidos')
  } finally {
    agregandoPedidos.value = false
  }
}

async function agregarPedido() {
  if (!pedidoIdAgregar.value) return
  try {
    const ordenEntrega = (rutaActiva.value.itemsRuta?.length ?? 0) + 1
    await api.post(`/operaciones/rutas/${rutaActiva.value.id}/pedidos`, {
      pedidoId: pedidoIdAgregar.value,
      ordenEntrega,
    })
    notify.success('Pedido agregado')
    pedidoIdAgregar.value = undefined
    const res = await api.get(`/operaciones/rutas/${rutaActiva.value.id}`)
    rutaActiva.value = apiResponse.unwrap(res)
    await fetchPedidosPendientes()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al agregar pedido')
  }
}

async function quitarPedido(pedidoId: number) {
  try {
    await api.delete(`/operaciones/rutas/${rutaActiva.value.id}/pedidos/${pedidoId}`)
    notify.success('Pedido removido')
    const res = await api.get(`/operaciones/rutas/${rutaActiva.value.id}`)
    rutaActiva.value = apiResponse.unwrap(res)
    await fetchPedidosPendientes()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al quitar pedido')
  }
}

function cambiarEstadoRuta(estadoNuevo: string) {
  if (estadoNuevo === 'ANULADA') {
    // Si es anular, primero abre modal de confirmación
    modalAnulaConfirm.value?.open()
  } else {
    // Otros cambios van directo
    procederCambioEstado(estadoNuevo)
  }
}

async function procederAnular() {
  modalAnulaConfirm.value?.close()
  await procederCambioEstado('ANULADA')
}

async function procederCambioEstado(estadoNuevo: string) {
  try {
    await api.patch(`/operaciones/rutas/${rutaActiva.value.id}/estado`, { estado: estadoNuevo })
    notify.success('Estado actualizado')
    const res = await api.get(`/operaciones/rutas/${rutaActiva.value.id}`)
    rutaActiva.value = apiResponse.unwrap(res)
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al cambiar estado')
  }
}

function abrirLiquidacion() {
  liqForm.gastosRuta = 0
  liqForm.notas = ''
  // Cargar pedidos de la ruta actual
  liqForm.pedidos = (rutaActiva.value?.itemsRuta ?? []).map((item: any) => ({
    pedidoId: item.pedidoId,
    numero: item.pedido?.numero || `Pedido ${item.pedidoId}`,
    clienteNombre: item.pedido?.cliente?.nombre || 'Cliente no disponible',
    montoPedido: Number((item.pedido?.detalles ?? []).reduce((acc: number, det: any) => acc + Number(det?.subtotal ?? 0), 0)),
    detalles: (item.pedido?.detalles ?? []).map((det: any) => ({
      productoNombre: det?.producto?.nombre || `Producto ${det?.productoId ?? ''}`,
      cantidad: Number(det?.cantidad ?? 0),
      precioUnitario: Number(det?.precioUnitario ?? 0),
      subtotal: Number(det?.subtotal ?? 0),
    })),
    estadoEntrega:
      item.pedido?.estado === 'NO_ENTREGADO'
        ? 'NO_ENTREGADO'
        : 'ENTREGADO_PAGADO',
    tipoPago: 'EFECTIVO',
    montoEfectivo: Number((item.pedido?.detalles ?? []).reduce((acc: number, det: any) => acc + Number(det?.subtotal ?? 0), 0)),
    montoTransferencia: 0,
  }))
  modalLiquidacion.value = true
}

async function liquidarRuta() {
  saving.value = true
  try {
    const pedidoExcedido = liqForm.pedidos.find((p) => {
      if (p.estadoEntrega !== 'ENTREGADO_PAGADO') return false
      return montoPagadoPedido(p) > toNumberOrZero(p.montoPedido)
    })
    if (pedidoExcedido) {
      notify.error(`El pago del pedido ${pedidoExcedido.numero} no puede superar su total`)
      return
    }

    const efectivoRecibido = toNumberOrZero(totalEfectivoCalculado.value)
    const transferenciaRecibida = toNumberOrZero(totalTransferenciaCalculado.value)
    const totalRecibido = toNumberOrZero(totalRecibidoCalculado.value)
    const totalCartera = toNumberOrZero(totalCarteraCalculado.value)
    const totalEntregado = toNumberOrZero(totalEntregadoCalculado.value)
    const diferencia = Number((totalEntregado - totalRecibido - totalCartera).toFixed(2))

    const partesObs = [
      efectivoRecibido > 0 ? `Efectivo: ${efectivoRecibido}` : '',
      transferenciaRecibida > 0 ? `Transferencia: ${transferenciaRecibida}` : '',
      totalCartera > 0 ? `Cartera: ${totalCartera}` : '',
      toNumberOrZero(liqForm.gastosRuta) > 0 ? `Gastos de ruta: ${toNumberOrZero(liqForm.gastosRuta)}` : '',
      liqForm.notas?.trim(),
    ].filter(Boolean).join(' | ')

    await api.post(`/operaciones/rutas/${rutaActiva.value.id}/liquidar`, {
      totalEntregado,
      totalRecaudado: totalRecibido,
      totalCartera,
      diferencia,
      efectivoRecibido,
      transferenciaRecibida,
      observaciones: partesObs || undefined,
      // Enviar estado específico de cada pedido
      pedidos: liqForm.pedidos.map(p => ({
        pedidoId: p.pedidoId,
        entregado: p.estadoEntrega !== 'NO_ENTREGADO',
        aCredito: p.estadoEntrega === 'ENTREGADO_CREDITO',
        tipoPago: p.estadoEntrega === 'ENTREGADO_PAGADO' ? p.tipoPago : undefined,
        montoEfectivo: p.estadoEntrega === 'ENTREGADO_PAGADO' ? toNumberOrZero(p.montoEfectivo) : 0,
        montoTransferencia: p.estadoEntrega === 'ENTREGADO_PAGADO' ? toNumberOrZero(p.montoTransferencia) : 0,
      }))
    })
    notify.success('Ruta liquidada')
    modalLiquidacion.value = false
    await fetchRutas() // Recargar para ver cambios
    cerrarDetalle()
  } catch (e: any) {
    const backendErrors = Array.isArray(e?.response?.data?.errors)
      ? e.response.data.errors.join(' | ')
      : ''
    const msg = backendErrors || e?.response?.data?.message || e?.message || 'Error al liquidar'
    notify.error(msg)
    console.error('Error liquidando ruta:', e)
  } finally {
    saving.value = false
  }
}

onMounted(fetchRutas)
</script>
