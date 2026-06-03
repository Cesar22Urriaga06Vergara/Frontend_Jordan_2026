<template>
  <div>
    <div
      v-if="diaAbiertoPendiente && !diaAbiertoPendiente.esFechaActual"
      class="mb-6 rounded-lg border-2 border-amber-300 bg-amber-50 p-5 shadow-sm"
    >
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div class="flex items-start gap-3">
          <AlertTriangle class="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-700" />
          <div>
            <p class="text-base font-bold text-amber-950">
              ⚠️ Atención: La jornada del {{ formatDate(diaAbiertoPendiente.fecha) }} quedó abierta.
            </p>
            <p class="mt-1 text-sm text-amber-800">
              Cierra esta jornada antes de registrar pedidos, rutas o ventas.
            </p>
          </div>
        </div>
        <NuxtLink
          :to="{ path: '/operaciones/diario', query: { fecha: diaAbiertoPendiente.fecha } }"
          class="btn-primary inline-flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <CalendarDays class="h-4 w-4" />
          Ir a Liquidar Día Anterior
        </NuxtLink>
      </div>
    </div>

    <div
      v-else-if="!loadingEstado && estadoDia && !estadoDia.apertura"
      class="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-5 shadow-sm"
    >
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-base font-bold text-blue-950">Jornada: Sin Iniciar</p>
          <p class="mt-1 text-sm text-blue-800">
            Abre la Gestión de Planta para habilitar pedidos, rutas y ventas.
          </p>
        </div>
        <NuxtLink
          :to="{ path: '/operaciones/diario', query: { fecha: today, abrir: '1' } }"
          class="btn-primary inline-flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Rocket class="h-4 w-4" />
          Abrir Jornada de Hoy
        </NuxtLink>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        v-for="card in statCards"
        :key="card.label"
        :label="card.label"
        :value="card.value"
        :icon="card.icon"
        :color="card.color"
        :loading="loadingStats"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="bg-white rounded-lg shadow-sm p-5">
        <h2 class="font-semibold text-gray-700 mb-4">Estado de jornada - {{ todayLabel }}</h2>
        <div
          v-if="diaAbiertoPendiente && !diaAbiertoPendiente.esFechaActual"
          class="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3"
        >
          <div class="flex items-start gap-2">
            <AlertTriangle class="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
            <div class="min-w-0">
              <p class="text-sm font-semibold text-amber-900">
                Jornada abierta: {{ formatDate(diaAbiertoPendiente.fecha) }}
              </p>
              <NuxtLink
                :to="{ path: '/operaciones/diario', query: { fecha: diaAbiertoPendiente.fecha } }"
                class="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:underline"
              >
                Ir a liquidar jornada
                <ChevronRight class="h-3.5 w-3.5" />
              </NuxtLink>
            </div>
          </div>
        </div>
        <div v-if="loadingEstado" class="text-gray-400 text-sm">Cargando...</div>
        <div v-else class="space-y-3">
          <StatusRow label="Apertura registrada" :ok="estadoDia?.apertura != null" />
          <StatusRow label="Rutas liquidadas" :ok="estadoDia?.rutasAbiertas === 0" />
          <StatusRow
            label="Pedidos pendientes"
            :ok="estadoDia?.pedidosPendientes === 0"
            :detail="estadoDia?.pedidosPendientes > 0 ? `(${estadoDia.pedidosPendientes} pendientes)` : ''"
          />
          <StatusRow :label="jornadaStatusLabel" :ok="estadoDia?.cierre != null" />
        </div>
        <div class="mt-4">
          <NuxtLink
            to="/operaciones/diario"
            class="text-sm text-blue-600 hover:underline font-medium"
          >
            Ver Gestión de Planta →
          </NuxtLink>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-5">
        <h2 class="font-semibold text-gray-700 mb-4">Accesos rápidos</h2>
        <div class="grid grid-cols-2 gap-3">
          <QuickLink
            to="/pedidos/create"
            :icon="ClipboardList"
            label="Nuevo Pedido"
            :disabled="!puedeOperar"
            @blocked="mostrarBloqueoOperativo"
          />
          <QuickLink
            to="/ventas"
            :icon="Receipt"
            label="Registrar Venta"
            :disabled="!puedeOperar"
            @blocked="mostrarBloqueoOperativo"
          />
          <QuickLink
            to="/rutas"
            :icon="Truck"
            label="Gestionar Rutas"
            :disabled="!puedeOperar"
            @blocked="mostrarBloqueoOperativo"
          />
          <QuickLink to="/trabajadores" :icon="BriefcaseBusiness" label="Trabajadores" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AlertTriangle,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Receipt,
  Rocket,
  Truck,
  WalletCards,
} from 'lucide-vue-next'
import { formatCurrency, formatDate, todayISO } from '~/utils/formats'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const apiResponse = useApiResponse()
const notify = useNotification()
const loadingStats = ref(true)
const loadingEstado = ref(true)
const estadoDia = ref<any>(null)
const diaAbiertoPendiente = ref<any>(null)
let refreshTimer: ReturnType<typeof setInterval> | null = null

const today = todayISO()
const todayLabel = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
}).format(new Date())

type CardColor = 'green' | 'blue' | 'orange' | 'purple' | 'red'
const statCards = ref<{ label: string; value: string; icon?: any; color: CardColor }[]>([
  { label: 'Ventas hoy', value: '-', icon: Receipt, color: 'green' },
  { label: 'Pedidos activos', value: '-', icon: ClipboardList, color: 'blue' },
  { label: 'Cartera total', value: '-', icon: WalletCards, color: 'orange' },
  { label: 'Rutas activas', value: '-', icon: Truck, color: 'purple' },
])

const hayJornadaAnteriorPendiente = computed(() =>
  Boolean(diaAbiertoPendiente.value && !diaAbiertoPendiente.value.esFechaActual),
)
const puedeOperar = computed(() =>
  Boolean(estadoDia.value?.abierto && !hayJornadaAnteriorPendiente.value),
)
const jornadaStatusLabel = computed(() => {
  if (!estadoDia.value?.apertura) return 'Jornada: Sin Iniciar'
  if (estadoDia.value?.cierre) return 'Jornada cerrada'
  return 'Jornada abierta'
})

function mostrarBloqueoOperativo() {
  notify.error("Acceso Restringido: Es necesario iniciar la jornada en 'Gestión de Planta' para operar.")
}

async function fetchDashboard() {
  try {
    const [estadoRes, pedidosRes, diaPendienteRes] =
      await Promise.allSettled([
        api.get('/diario/estado', { params: { fecha: today } }),
        api.get('/operaciones/pedidos', { params: { estado: 'PENDIENTE', limit: 1 } }),
        api.get('/diario/dia-abierto-pendiente'),
      ])

    if (estadoRes.status === 'fulfilled') {
      const d = apiResponse.unwrap(estadoRes.value) as any
      estadoDia.value = d
      statCards.value[0].value = String(d?.ventasHoy ?? 0) + ' ventas'
      statCards.value[2].value = formatCurrency(Number(d?.carteraTotal ?? 0))
      statCards.value[3].value = String(d?.rutasAbiertas ?? 0)
    }

    if (pedidosRes.status === 'fulfilled') {
      const d = apiResponse.unwrap(pedidosRes.value) as any
      statCards.value[1].value = String(d?.total ?? 0)
    }
    if (diaPendienteRes.status === 'fulfilled') {
      diaAbiertoPendiente.value = apiResponse.unwrap(diaPendienteRes.value)
    }

    const fallas: string[] = []
    if (estadoRes.status === 'rejected') fallas.push('estado de jornada')
    if (pedidosRes.status === 'rejected') fallas.push('pedidos')
    if (fallas.length) {
      notify.error(`No se pudo cargar: ${fallas.join(', ')}`)
    }
  } catch {
    notify.error('No se pudo cargar el resumen del dashboard')
  } finally {
    loadingStats.value = false
    loadingEstado.value = false
  }
}

onMounted(() => {
  fetchDashboard()
  refreshTimer = setInterval(fetchDashboard, 20000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>
