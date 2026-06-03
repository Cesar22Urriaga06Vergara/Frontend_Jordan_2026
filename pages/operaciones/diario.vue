<template>
  <div class="space-y-6">
    <!-- Header con selector de fecha -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Gestión de Planta</h1>
        <p class="text-sm text-gray-500">Apertura, producción, cierre e historial operativo.</p>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-600 whitespace-nowrap">Fecha:</label>
        <input
          v-model="fechaSeleccionada"
          type="date"
          class="form-input w-auto"
          :max="hoy"
          @change="onFechaChange"
        />
        <button
          v-if="fechaSeleccionada !== hoy"
          class="text-xs text-blue-600 hover:underline whitespace-nowrap"
          @click="fechaSeleccionada = hoy; onFechaChange()"
        >Hoy</button>
      </div>
    </div>

    <!-- Alerta día anterior sin cerrar -->
    <div v-if="diaPendiente && fechaSeleccionada === hoy" class="bg-red-50 border border-red-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div class="flex-1 flex items-start gap-2">
        <AlertTriangle class="h-5 w-5 text-red-700 mt-1" />
        <div>
          <p class="text-sm font-semibold text-red-700">Hay un día sin cerrar: {{ diaPendiente }}</p>
          <p class="text-xs text-red-500 mt-0.5">Debes cerrarlo antes de poder abrir el día de hoy.</p>
        </div>
      </div>
      <button
        class="btn-danger whitespace-nowrap text-sm"
        @click="irACerrarDiaPendiente"
      >Ir a cerrar {{ diaPendiente }}</button>
    </div>

    <div v-if="loadingEstado" class="card text-center text-gray-400 py-8">Cargando estado…</div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Apertura" :value="estado.apertura ? 'Registrada' : 'Sin abrir'" :icon="CalendarDays" color="blue" />
      <StatCard :label="jornadaCardLabel" :value="jornadaCardValue" :icon="CheckCircle" color="green" />
      <StatCard label="Pedidos pendientes" :value="String(estado.pedidosPendientes ?? 0)" :icon="ClipboardList" color="orange" />
      <StatCard label="Rutas abiertas" :value="String(estado.rutasAbiertas ?? 0)" :icon="Truck" color="red" />
    </div>

    <div class="card space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold text-gray-700">Apertura de jornada - {{ fechaSeleccionada }}</h2>
        <span class="px-2 py-0.5 rounded-full text-xs font-medium" :class="estado.abierto ? 'bg-green-100 text-green-700' : (estado.apertura ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700')">
          {{ estado.abierto ? 'Jornada abierta' : (estado.apertura ? 'Jornada cerrada' : 'Jornada: Sin Iniciar') }}
        </span>
      </div>

      <div v-if="!estado.apertura || (estado.cierre && reopening)" class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-600">Inventario inicial</span>
            <button class="btn-secondary text-xs py-1.5 px-2 inline-flex items-center gap-1" @click="agregarInventario">
              <Plus class="h-4 w-4" />
              Añadir producto
            </button>
          </div>
          <div v-if="!aperturaInventario.length" class="rounded-lg border border-dashed border-gray-200 bg-gray-50 text-center py-7 px-4 mb-3">
            <ClipboardList class="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p class="font-medium text-gray-700">Sin productos iniciales</p>
            <p class="text-sm text-gray-500 mt-1">Agrega solo los productos con inventario al iniciar el día.</p>
          </div>
          <div v-for="(item, i) in aperturaInventario" :key="i" class="flex gap-2 mb-2">
            <select v-model="item.productoId" class="form-input flex-1">
              <option :value="undefined">Seleccionar…</option>
              <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
            </select>
            <input v-model.number="item.cantidadInicial" class="form-input w-24" type="number" min="0" placeholder="Cant." />
            <button class="text-red-400 hover:text-red-600 text-lg leading-none mt-2" @click="aperturaInventario.splice(i, 1)">×</button>
          </div>
        </div>

        <div class="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-3">
          <FormField label="Saldo inicial ($)">
            <input v-model.number="aperturaSaldoInicial" class="form-input" type="number" min="0" />
          </FormField>
          <button class="btn-primary w-full inline-flex items-center justify-center gap-2" :disabled="savingApertura" @click="abrirDia">
            <CalendarDays class="h-4 w-4" />
            {{ savingApertura ? 'Abriendo…' : 'Abrir jornada' }}
          </button>
          <p class="text-xs text-gray-500">Al abrir la jornada se habilitan producción, rutas, ventas y cierre.</p>
        </div>
      </div>

      <div v-else class="text-sm text-gray-500">
        El día ya fue abierto.
        <span v-if="estado.apertura?.saldoInicial !== undefined">
          Saldo inicial: {{ formatCurrency(estado.apertura.saldoInicial) }}
        </span>
        <div v-if="estado.apertura?.createdAt" class="mt-1 text-xs text-gray-400">
          Hora de apertura: {{ formatDateTime(estado.apertura.createdAt) }}
        </div>
      </div>
    </div>

    <!-- Día cerrado: botón para abrir nueva jornada -->
    <div v-if="estado.cierre && !reopening" class="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <p class="text-sm font-semibold text-gray-700">Iniciar nueva jornada</p>
        <p class="text-xs text-gray-400 mt-0.5">La jornada del {{ hoy }} está cerrada. Puedes abrir una nueva.</p>
      </div>
      <button class="btn-primary whitespace-nowrap" @click="reopening = true">Abrir nuevo día</button>
    </div>

    <div v-if="estado.apertura" class="card space-y-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="font-semibold text-gray-800">Registrar producción</h2>
          <p class="text-sm text-gray-500">Agrega los productos fabricados antes de cerrar la jornada.</p>
        </div>
        <button v-if="!estado.cierre" class="btn-secondary text-xs py-1.5 px-2 inline-flex items-center gap-1" @click="agregarProduccion">
          <Plus class="h-4 w-4" />
          Añadir
        </button>
      </div>

      <div v-if="!estado.cierre">
        <div class="mb-3">
          <div v-if="!produccionItems.length" class="rounded-lg border border-dashed border-gray-200 bg-gray-50 text-center py-7 px-4 mb-3">
            <ClipboardList class="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p class="font-medium text-gray-700">Aún no has agregado producción</p>
            <p class="text-sm text-gray-500 mt-1">Usa Añadir para cargar producto y cantidad producida.</p>
          </div>
          <div v-for="(item, i) in produccionItems" :key="i" class="flex gap-2 mb-2">
            <select v-model="item.productoId" class="form-input flex-1">
              <option :value="undefined">Seleccionar…</option>
              <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
            </select>
            <input v-model.number="item.cantidad" class="form-input w-24" type="number" min="1" placeholder="Cant." />
            <button class="text-red-400 hover:text-red-600 text-lg leading-none mt-2" @click="produccionItems.splice(i, 1)">×</button>
          </div>
        </div>

        <button class="btn-primary inline-flex items-center gap-2" :disabled="savingProduccion || !produccionItems.some(i => i.productoId && i.cantidad > 0)" @click="registrarProduccion">
          <ClipboardList class="h-4 w-4" />
          {{ savingProduccion ? 'Guardando…' : 'Guardar producción' }}
        </button>
      </div>

      <div v-else class="text-sm text-gray-500">El día ya está cerrado. Producción bloqueada.</div>
    </div>

    <div v-if="estado.apertura && !estado.cierre" class="card space-y-4">
      <div>
        <h2 class="font-semibold text-gray-800">Cerrar día</h2>
        <p class="text-sm text-gray-500">Verifica caja e inventario final antes de bloquear operaciones.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Saldo contado en caja ($)">
          <input v-model.number="cierreForm.saldoContado" class="form-input" type="number" min="0" />
        </FormField>
        <FormField label="Observaciones" class="sm:col-span-2">
          <textarea v-model="cierreForm.observaciones" rows="2" class="form-input resize-none" />
        </FormField>
      </div>

      <div class="space-y-3">
        <h3 class="text-sm font-semibold text-gray-700">Conteo final de inventario</h3>
        <div v-for="item in cierreInventario" :key="item.productoId" class="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3 items-end">
          <div>
            <p class="text-sm font-medium text-gray-700">{{ item.nombre }}</p>
            <p class="text-xs text-gray-400">Esperado: {{ item.cantidadEsperada }}</p>
          </div>
          <input v-model.number="item.cantidadContada" class="form-input" type="number" min="0" />
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button class="btn-danger" :disabled="savingCierre" @click="cerrarDia">
          {{ savingCierre ? 'Cerrando…' : 'Cerrar día' }}
        </button>
        <p class="text-xs text-gray-400">Esto bloqueará nuevas operaciones del día.</p>
      </div>
    </div>

    <div v-if="estado.cierre && !reopening" class="card text-center text-gray-500 text-sm">
      Día cerrado.
      <span v-if="estado.cierre?.createdAt" class="text-gray-400">
        Hora de cierre: {{ formatDateTime(estado.cierre.createdAt) }}.
      </span>
      Puedes consultar el historial abajo.
    </div>

    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold text-gray-700">Historial</h2>
        <button class="text-xs text-blue-600 hover:underline inline-flex items-center gap-1" @click="fetchHistorial">
          <RefreshCw class="h-3.5 w-3.5" />
          Actualizar
        </button>
      </div>

      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b text-xs uppercase">
            <th class="pb-2 font-medium">Fecha</th>
            <th class="pb-2 font-medium text-right">Saldo calculado</th>
            <th class="pb-2 font-medium text-right">Saldo contado</th>
            <th class="pb-2 font-medium text-center">Caja cuadrada</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="h in historial" :key="h.id" class="border-b border-gray-50">
            <td class="py-2">{{ formatDate(h.fecha) }}</td>
            <td class="py-2 text-right">{{ formatCurrency(h.cierreCaja?.saldoCalculado ?? 0) }}</td>
            <td class="py-2 text-right">{{ formatCurrency(h.cierreCaja?.saldoContado ?? 0) }}</td>
            <td class="py-2 text-center">{{ h.cajaCuadrada ? 'Sí' : 'No' }}</td>
          </tr>
          <tr v-if="!historial.length">
            <td colspan="4" class="py-4 text-center text-gray-400">Sin historial</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertTriangle, CalendarDays, CheckCircle, ClipboardList, Plus, RefreshCw, Truck } from 'lucide-vue-next'
import { formatCurrency, formatDate, formatDateTime, todayISO } from '~/utils/formats'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const notify = useNotification()
const apiResponse = useApiResponse()
const route = useRoute()
const router = useRouter()

const hoy = todayISO()
const fechaSeleccionada = ref(typeof route.query.fecha === 'string' ? route.query.fecha : hoy)
const loadingEstado = ref(true)
const savingApertura = ref(false)
const savingProduccion = ref(false)
const savingCierre = ref(false)
const diaPendiente = ref<string | null>(null)

const estado = ref<any>({ apertura: null, cierre: null, pedidosPendientes: 0, rutasAbiertas: 0 })
const reopening = ref(false)
const historial = ref<any[]>([])
const productos = ref<any[]>([])
const aperturaInventario = ref<{ productoId: number | undefined; cantidadInicial: number }[]>([])
const aperturaSaldoInicial = ref(0)
const produccionItems = ref<{ productoId: number | undefined; cantidad: number }[]>([])
const cierreInventario = ref<{ productoId: number; nombre: string; cantidadEsperada: number; cantidadContada: number }[]>([])
const cierreForm = reactive({ saldoContado: 0, observaciones: '' })

const jornadaCardLabel = computed(() => {
  if (!estado.value.apertura) return 'Jornada'
  return 'Cierre'
})
const jornadaCardValue = computed(() => {
  if (!estado.value.apertura) return 'Sin Iniciar'
  return estado.value.cierre ? 'Registrado' : 'Pendiente'
})

function syncCierreInventario() {
  const inventarios = estado.value?.apertura?.inventariosInicial ?? []
  const produccion = estado.value?.apertura?.producciondiaria ?? []
  cierreInventario.value = inventarios.map((item: any) => {
    const prod = produccion.find((p: any) => p.productoId === item.productoId)
    const cantidadEsperada = Number(item.cantidadInicial ?? 0) + Number(prod?.cantidad ?? 0)
    return {
      productoId: item.productoId,
      nombre: item.producto?.nombre ?? `Producto ${item.productoId}`,
      cantidadEsperada,
      cantidadContada: cantidadEsperada,
    }
  })
}

function onFechaChange() {
  reopening.value = false
  router.replace({ path: '/operaciones/diario', query: { fecha: fechaSeleccionada.value } })
  fetchEstado()
}

function irACerrarDiaPendiente() {
  if (diaPendiente.value) {
    fechaSeleccionada.value = diaPendiente.value
    onFechaChange()
  }
}

async function fetchEstado() {
  loadingEstado.value = true
  try {
    const [estadoRes, diaPendienteRes] = await Promise.allSettled([
      api.get('/diario/estado', { params: { fecha: fechaSeleccionada.value } }),
      api.get('/diario/dia-abierto-pendiente'),
    ])

    if (estadoRes.status === 'fulfilled') {
      estado.value = apiResponse.unwrap(estadoRes.value)
    } else {
      throw estadoRes.reason
    }

    if (diaPendienteRes.status === 'fulfilled') {
      const pendiente = apiResponse.unwrap(diaPendienteRes.value) as any
      diaPendiente.value = pendiente?.fecha && pendiente.fecha !== fechaSeleccionada.value
        ? pendiente.fecha
        : null
    } else {
      diaPendiente.value = null
    }

    syncCierreInventario()
  } catch (e: any) {
    // Detectar 409: día anterior sin cerrar
    const msg: string = e?.response?.data?.message ?? e?.message ?? ''
    const match = msg.match(/(\d{4}-\d{2}-\d{2})/)
    if (e?.response?.status === 409 && match) {
      diaPendiente.value = match[1]
    } else {
      notify.error('Error al cargar estado del día')
    }
  } finally {
    loadingEstado.value = false
  }
}

async function fetchHistorial() {
  try {
    const res = await api.get('/diario/historial', { params: { limit: 10 } })
    historial.value = apiResponse.list(res)
  } catch {
    historial.value = []
    notify.error('Error al cargar el historial del dia')
  }
}

async function fetchProductos() {
  try {
    const res = await api.get('/catalogos/productos', { params: { activo: 'true', limit: 200 } })
    productos.value = apiResponse.list(res)
  } catch {
    productos.value = []
    notify.error('Error al cargar productos')
  }
}

function agregarInventario() {
  aperturaInventario.value.push({ productoId: undefined, cantidadInicial: 0 })
}

function agregarProduccion() {
  produccionItems.value.push({ productoId: undefined, cantidad: 1 })
}

async function abrirDia() {
  savingApertura.value = true
  try {
    await api.post('/diario/apertura', {
      fecha: fechaSeleccionada.value,
      saldoInicial: aperturaSaldoInicial.value,
      inventario: aperturaInventario.value.filter(i => i.productoId).map(i => ({
        productoId: i.productoId,
        cantidadInicial: i.cantidadInicial,
      })),
      observaciones: `Apertura manual ${fechaSeleccionada.value}`,
    })
    notify.success('Día abierto')
    reopening.value = false
    aperturaInventario.value = []
    aperturaSaldoInicial.value = 0
    await fetchEstado()
  } catch (e: any) {
    const msg: string = e?.response?.data?.message ?? e?.message ?? ''
    const match = msg.match(/(\d{4}-\d{2}-\d{2})/)
    if (e?.response?.status === 409 && match) {
      diaPendiente.value = match[1]
      notify.error(msg)
    } else {
      notify.error(msg || 'Error al abrir día')
    }
  } finally {
    savingApertura.value = false
  }
}

async function registrarProduccion() {
  savingProduccion.value = true
  try {
    await api.post('/diario/produccion', {
      items: produccionItems.value.filter(i => i.productoId && i.cantidad > 0).map(i => ({
        productoId: i.productoId,
        cantidad: i.cantidad,
      })),
    })
    notify.success('Producción registrada')
    produccionItems.value = []
    await fetchEstado()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al registrar producción')
  } finally {
    savingProduccion.value = false
  }
}

async function cerrarDia() {
  savingCierre.value = true
  try {
    await api.post('/diario/cierre', {
      saldoContado: cierreForm.saldoContado,
      observaciones: cierreForm.observaciones,
      inventario: cierreInventario.value.map(item => ({
        productoId: item.productoId,
        cantidadContada: item.cantidadContada,
      })),
    }, { params: { fecha: fechaSeleccionada.value } })
    notify.success('Día cerrado correctamente')
    diaPendiente.value = null
    await Promise.all([fetchEstado(), fetchHistorial()])
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al cerrar día')
  } finally {
    savingCierre.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchEstado(), fetchHistorial(), fetchProductos()])
})

watch(
  () => route.query.fecha,
  (fecha) => {
    if (typeof fecha === 'string' && fecha !== fechaSeleccionada.value) {
      fechaSeleccionada.value = fecha
      onFechaChange()
    }
  },
)
</script>
