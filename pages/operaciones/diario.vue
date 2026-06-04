<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        >
          Hoy
        </button>
      </div>
    </div>

    <div
      v-if="diaPendiente && fechaSeleccionada === hoy"
      class="rounded-lg border border-red-200 bg-red-50 p-4"
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-start gap-3">
          <AlertTriangle class="mt-0.5 h-5 w-5 text-red-700" />
          <div>
            <p class="text-sm font-semibold text-red-700">Hay una jornada sin cerrar: {{ diaPendiente }}</p>
            <p class="mt-0.5 text-xs text-red-500">Debes liquidarla antes de abrir el día de hoy.</p>
          </div>
        </div>
        <button class="btn-danger whitespace-nowrap text-sm" @click="irACerrarDiaPendiente">
          Ir a cerrar {{ diaPendiente }}
        </button>
      </div>
    </div>

    <div v-if="loadingEstado" class="card py-8 text-center text-gray-400">Cargando estado...</div>

    <template v-else>
      <section class="rounded-lg border p-5 shadow-sm" :class="jornadaState.wrapperClass">
        <div class="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div class="flex items-start gap-4">
            <div
              class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
              :class="jornadaState.iconClass"
            >
              <component :is="jornadaState.icon" class="h-6 w-6" />
            </div>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="jornadaState.badgeClass">
                  {{ jornadaState.badge }}
                </span>
                <span class="text-sm text-gray-500">{{ formatDate(fechaSeleccionada) }}</span>
              </div>
              <h2 class="mt-2 text-xl font-bold text-gray-900">{{ jornadaState.title }}</h2>
              <p class="mt-1 max-w-2xl text-sm text-gray-600">{{ jornadaState.description }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:w-[620px]">
            <div
              v-for="item in jornadaStats"
              :key="item.label"
              class="rounded-lg border border-white/70 bg-white/80 p-3 shadow-sm"
            >
              <div class="mb-2 flex h-8 w-8 items-center justify-center rounded-lg" :class="item.iconClass">
                <component :is="item.icon" class="h-4 w-4" />
              </div>
              <p class="text-[11px] font-bold uppercase text-gray-400">{{ item.label }}</p>
              <p class="mt-1 text-lg font-black text-gray-900">{{ item.value }}</p>
            </div>
          </div>
        </div>
      </section>

      <section v-if="!estado.apertura || (estado.cierre && reopening)" class="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
        <div class="card">
          <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-xs font-bold uppercase text-gray-400">Paso 1</p>
              <h2 class="mt-1 font-semibold text-gray-800">Apertura de jornada</h2>
            </div>
            <button class="btn-secondary inline-flex items-center gap-1 text-xs" @click="agregarInventario">
              <Plus class="h-4 w-4" />
              Añadir producto
            </button>
          </div>

          <div class="mb-3 flex items-center justify-between">
            <span class="text-sm font-medium text-gray-600">Inventario inicial</span>
            <span class="text-xs text-gray-400">{{ aperturaInventario.length }} líneas</span>
          </div>

          <div v-if="!aperturaInventario.length" class="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
            <PackagePlus class="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p class="font-medium text-gray-700">Sin productos iniciales</p>
            <p class="mt-1 text-sm text-gray-500">Agrega solo los productos con inventario al iniciar el día.</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="(item, i) in aperturaInventario"
              :key="i"
              class="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px_36px]"
            >
              <select v-model="item.productoId" class="form-input">
                <option :value="undefined">Seleccionar...</option>
                <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
              </select>
              <input v-model.number="item.cantidadInicial" class="form-input" type="number" min="0" placeholder="Cant." />
              <button class="rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600" @click="aperturaInventario.splice(i, 1)">
                ×
              </button>
            </div>
          </div>
        </div>

        <aside class="card bg-blue-50/60">
          <p class="text-xs font-bold uppercase text-blue-500">Confirmación</p>
          <h3 class="mt-1 font-semibold text-gray-800">Abrir planta</h3>
          <p class="mt-2 text-sm text-gray-500">Al abrir la jornada se habilitan pedidos, rutas, ventas y cierre.</p>

          <div class="mt-5 space-y-3">
            <FormField label="Saldo inicial ($)">
              <input v-model.number="aperturaSaldoInicial" class="form-input" type="number" min="0" />
            </FormField>
            <button class="btn-primary inline-flex w-full items-center justify-center gap-2" :disabled="savingApertura" @click="abrirDia">
              <CalendarDays class="h-4 w-4" />
              {{ savingApertura ? 'Abriendo...' : 'Abrir jornada' }}
            </button>
          </div>
        </aside>
      </section>

      <section v-else class="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
        <div class="space-y-5">
          <div class="card">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p class="text-xs font-bold uppercase text-gray-400">Resumen</p>
                <h2 class="mt-1 font-semibold text-gray-800">Jornada del {{ formatDate(fechaSeleccionada) }}</h2>
                <p class="mt-2 text-sm text-gray-500">
                  Saldo inicial: {{ formatCurrency(estado.apertura?.saldoInicial ?? 0) }}
                </p>
                <p v-if="estado.apertura?.createdAt" class="mt-1 text-xs text-gray-400">
                  Apertura: {{ formatDateTime(estado.apertura.createdAt) }}
                </p>
              </div>
              <span
                class="rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="estado.cierre ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'"
              >
                {{ estado.cierre ? 'Cerrada' : 'Abierta' }}
              </span>
            </div>

            <div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div class="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p class="text-xs font-bold uppercase text-gray-400">Inventario inicial</p>
                <p class="mt-1 text-xl font-black text-gray-900">{{ inventarioInicialTotal }}</p>
              </div>
              <div class="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p class="text-xs font-bold uppercase text-gray-400">Producción</p>
                <p class="mt-1 text-xl font-black text-gray-900">{{ produccionTotal }}</p>
              </div>
              <div class="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p class="text-xs font-bold uppercase text-gray-400">Cierre</p>
                <p class="mt-1 text-xl font-black text-gray-900">{{ estado.cierre ? 'Listo' : 'Pendiente' }}</p>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p class="text-xs font-bold uppercase text-gray-400">Paso 2</p>
                <h2 class="mt-1 font-semibold text-gray-800">Registrar producción</h2>
                <p class="mt-1 text-sm text-gray-500">Agrega lo fabricado antes de cerrar la jornada.</p>
              </div>
              <button
                v-if="!estado.cierre"
                class="btn-secondary inline-flex items-center gap-1 text-xs"
                @click="agregarProduccion"
              >
                <Plus class="h-4 w-4" />
                Añadir
              </button>
            </div>

            <div v-if="estado.cierre" class="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
              El día ya está cerrado. Producción bloqueada.
            </div>

            <div v-else>
              <div v-if="!produccionItems.length" class="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-7 text-center">
                <Factory class="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p class="font-medium text-gray-700">Aún no has agregado producción</p>
                <p class="mt-1 text-sm text-gray-500">Usa Añadir para cargar producto y cantidad producida.</p>
              </div>

              <div v-else class="space-y-2">
                <div
                  v-for="(item, i) in produccionItems"
                  :key="i"
                  class="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px_36px]"
                >
                  <select v-model="item.productoId" class="form-input">
                    <option :value="undefined">Seleccionar...</option>
                    <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
                  </select>
                  <input v-model.number="item.cantidad" class="form-input" type="number" min="1" placeholder="Cant." />
                  <button class="rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600" @click="produccionItems.splice(i, 1)">
                    ×
                  </button>
                </div>
              </div>

              <div class="mt-4 flex items-center gap-3">
                <button
                  class="btn-primary inline-flex items-center gap-2"
                  :disabled="savingProduccion || !produccionItems.some(i => i.productoId && i.cantidad > 0)"
                  @click="registrarProduccion"
                >
                  <ClipboardList class="h-4 w-4" />
                  {{ savingProduccion ? 'Guardando...' : 'Guardar producción' }}
                </button>
                <span v-if="produccionRegistrada.length" class="text-xs text-gray-400">
                  {{ produccionRegistrada.length }} registros guardados
                </span>
              </div>
            </div>
          </div>
        </div>

        <aside v-if="!estado.cierre" class="card">
          <div class="mb-4">
            <p class="text-xs font-bold uppercase text-gray-400">Paso 3</p>
            <h2 class="mt-1 font-semibold text-gray-800">Cerrar jornada</h2>
            <p class="mt-1 text-sm text-gray-500">Verifica caja e inventario final antes de bloquear operaciones.</p>
          </div>

          <div class="mb-4 rounded-lg border p-3" :class="cierreBloqueado ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'">
            <div class="flex items-start gap-2">
              <component :is="cierreBloqueado ? AlertTriangle : CheckCircle2" class="mt-0.5 h-4 w-4" :class="cierreBloqueado ? 'text-amber-700' : 'text-green-700'" />
              <div>
                <p class="text-sm font-semibold" :class="cierreBloqueado ? 'text-amber-800' : 'text-green-700'">
                  {{ cierreBloqueado ? 'Faltan validaciones' : 'Listo para cerrar' }}
                </p>
                <p v-if="!cierreBloqueado" class="mt-0.5 text-xs text-green-700">Sin pedidos ni rutas abiertas.</p>
                <ul v-else class="mt-1 space-y-1 text-xs text-amber-700">
                  <li v-for="bloqueo in cierreBloqueos" :key="bloqueo">{{ bloqueo }}</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <FormField label="Saldo contado en caja ($)">
              <input v-model.number="cierreForm.saldoContado" class="form-input" type="number" min="0" />
            </FormField>
            <FormField label="Observaciones">
              <textarea v-model="cierreForm.observaciones" rows="2" class="form-input resize-none" />
            </FormField>
          </div>

          <div class="mt-5">
            <h3 class="mb-2 text-sm font-semibold text-gray-700">Conteo final de inventario</h3>
            <div v-if="!cierreInventario.length" class="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-400">
              Sin inventario inicial para contar.
            </div>
            <div v-else class="max-h-72 space-y-3 overflow-y-auto pr-1">
              <div v-for="item in cierreInventario" :key="item.productoId" class="grid grid-cols-[1fr_110px] gap-3 items-end">
                <div>
                  <p class="text-sm font-medium text-gray-700">{{ item.nombre }}</p>
                  <p class="text-xs text-gray-400">Esperado: {{ item.cantidadEsperada }}</p>
                </div>
                <input v-model.number="item.cantidadContada" class="form-input" type="number" min="0" />
              </div>
            </div>
          </div>

          <div class="mt-5">
            <h3 class="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Droplets class="h-4 w-4 text-blue-600" />
              Tanques de agua
            </h3>
            <div class="space-y-3">
              <div v-for="tanque in tanquesAgua" :key="tanque.nombre" class="grid grid-cols-[1fr_110px] gap-3 items-end">
                <div>
                  <p class="text-sm font-medium text-gray-700">{{ tanque.nombre }}</p>
                  <p class="text-xs text-gray-400">Litros al cierre</p>
                </div>
                <input v-model.number="tanque.litros" class="form-input" type="number" min="0" />
              </div>
            </div>
          </div>

          <button
            class="btn-danger mt-5 w-full"
            :disabled="savingCierre || cierreBloqueado"
            @click="cerrarDia"
          >
            {{ savingCierre ? 'Cerrando...' : 'Cerrar jornada' }}
          </button>
        </aside>

        <aside v-else class="card">
          <div class="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <p class="text-xs font-bold uppercase text-gray-400">Jornada cerrada</p>
            <p v-if="estado.cierre?.createdAt" class="mt-2 text-sm text-gray-600">
              Cierre: {{ formatDateTime(estado.cierre.createdAt) }}
            </p>
            <p class="mt-1 text-sm text-gray-500">Puedes consultar el historial operativo abajo.</p>
          </div>
          <button v-if="!reopening" class="btn-primary mt-4 w-full" @click="reopening = true">
            Abrir nuevo día
          </button>
        </aside>
      </section>

      <section class="card">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="font-semibold text-gray-700">Historial</h2>
          <button class="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline" @click="fetchHistorial">
            <RefreshCw class="h-3.5 w-3.5" />
            Actualizar
          </button>
        </div>

        <table class="w-full text-sm">
          <thead>
            <tr class="border-b text-left text-xs uppercase text-gray-500">
              <th class="pb-2 font-medium">Fecha</th>
              <th class="pb-2 text-right font-medium">Saldo calculado</th>
              <th class="pb-2 text-right font-medium">Saldo contado</th>
              <th class="pb-2 text-center font-medium">Caja cuadrada</th>
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
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Droplets,
  Factory,
  LockKeyhole,
  PackagePlus,
  Plus,
  RefreshCw,
  Truck,
  WalletCards,
} from 'lucide-vue-next'
import { formatCurrency, formatDate, formatDateTime, todayISO } from '~/utils/formats'
import { defaultTanquesAgua, mapTanquesCatalogo } from '~/utils/tanquesAgua'

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
const tanquesAgua = ref(defaultTanquesAgua())
const cierreForm = reactive({ saldoContado: 0, observaciones: '' })

const jornadaState = computed(() => {
  if (!estado.value.apertura) {
    return {
      icon: CalendarDays,
      badge: 'Sin iniciar',
      title: 'Jornada sin iniciar',
      description: 'Registra saldo e inventario inicial para abrir la operación del día.',
      wrapperClass: 'border-blue-200 bg-blue-50',
      iconClass: 'bg-blue-100 text-blue-700',
      badgeClass: 'bg-blue-100 text-blue-700',
    }
  }

  if (estado.value.cierre) {
    return {
      icon: LockKeyhole,
      badge: 'Cerrada',
      title: 'Jornada cerrada',
      description: 'El día quedó liquidado y las operaciones están bloqueadas.',
      wrapperClass: 'border-gray-200 bg-white',
      iconClass: 'bg-gray-100 text-gray-600',
      badgeClass: 'bg-gray-100 text-gray-600',
    }
  }

  return {
    icon: CheckCircle2,
    badge: 'Abierta',
    title: 'Jornada activa',
    description: 'Pedidos, rutas y ventas están habilitados. Mantén producción y cierre al día.',
    wrapperClass: 'border-green-200 bg-green-50',
    iconClass: 'bg-green-100 text-green-700',
    badgeClass: 'bg-green-100 text-green-700',
  }
})

const jornadaStats = computed(() => [
  {
    icon: CalendarDays,
    label: 'Apertura',
    value: estado.value.apertura ? 'Registrada' : 'Sin abrir',
    iconClass: 'bg-blue-100 text-blue-700',
  },
  {
    icon: Clock3,
    label: 'Cierre',
    value: !estado.value.apertura ? 'Sin iniciar' : (estado.value.cierre ? 'Registrado' : 'Pendiente'),
    iconClass: estado.value.cierre ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700',
  },
  {
    icon: ClipboardList,
    label: 'Pedidos',
    value: String(estado.value.pedidosPendientes ?? 0),
    iconClass: 'bg-orange-100 text-orange-700',
  },
  {
    icon: Truck,
    label: 'Rutas',
    value: String(estado.value.rutasAbiertas ?? 0),
    iconClass: 'bg-red-100 text-red-700',
  },
])

const produccionRegistrada = computed(() => estado.value?.apertura?.producciondiaria ?? [])
const inventarioInicialTotal = computed(() => {
  const inventarios = estado.value?.apertura?.inventariosInicial ?? []
  return inventarios.reduce((sum: number, item: any) => sum + Number(item.cantidadInicial ?? 0), 0)
})
const produccionTotal = computed(() =>
  produccionRegistrada.value.reduce((sum: number, item: any) => sum + Number(item.cantidad ?? item.cantidadProducida ?? 0), 0),
)
const cierreBloqueos = computed(() => {
  const bloqueos: string[] = []
  const pedidos = Number(estado.value.pedidosPendientes ?? 0)
  const rutas = Number(estado.value.rutasAbiertas ?? 0)
  if (pedidos > 0) bloqueos.push(`${pedidos} pedidos pendientes`)
  if (rutas > 0) bloqueos.push(`${rutas} rutas abiertas`)
  return bloqueos
})
const cierreBloqueado = computed(() => cierreBloqueos.value.length > 0)

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
      api.get('/diario/dia-abierto-pendiente', { params: { fecha: fechaSeleccionada.value } }),
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
    notify.error('Error al cargar el historial del día')
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

async function fetchTanquesAgua() {
  try {
    const res = await api.get('/diario/tanques-agua')
    const tanques = apiResponse.list(res)
    tanquesAgua.value = mapTanquesCatalogo(tanques)
  } catch {
    tanquesAgua.value = defaultTanquesAgua()
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
      tanquesAgua: tanquesAgua.value.map(tanque => ({
        tanqueAguaId: tanque.id,
        nombre: tanque.nombre,
        litros: Number(tanque.litros ?? 0),
      })),
      inventario: cierreInventario.value.map(item => ({
        productoId: item.productoId,
        cantidadContada: item.cantidadContada,
      })),
    }, { params: { fecha: fechaSeleccionada.value } })
    notify.success('Día cerrado correctamente')
    diaPendiente.value = null
    tanquesAgua.value = defaultTanquesAgua()
    await Promise.all([fetchEstado(), fetchHistorial()])
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al cerrar día')
  } finally {
    savingCierre.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchEstado(), fetchHistorial(), fetchProductos(), fetchTanquesAgua()])
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
