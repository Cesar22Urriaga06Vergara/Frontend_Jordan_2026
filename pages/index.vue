<template>
  <div>
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

    <!-- Estado del día -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="bg-white rounded-lg shadow-sm p-5">
        <h2 class="font-semibold text-gray-700 mb-4">Estado del día — {{ todayLabel }}</h2>
        <div
          v-if="diaAbiertoPendiente"
          class="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3"
        >
          <div class="flex items-start gap-2">
            <AlertTriangle class="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
            <div class="min-w-0">
              <p class="text-sm font-semibold text-amber-900">Día abierto: {{ formatDate(diaAbiertoPendiente.fecha) }}</p>
              <NuxtLink
                :to="{ path: '/operaciones/diario', query: { fecha: diaAbiertoPendiente.fecha } }"
                class="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:underline"
              >
                Ir al día abierto
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
          <StatusRow label="Día cerrado" :ok="estadoDia?.cierre != null" />
        </div>
        <div class="mt-4">
          <NuxtLink
            to="/operaciones/diario"
            class="text-sm text-blue-600 hover:underline font-medium"
          >Ver flujo diario →</NuxtLink>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-5">
        <h2 class="font-semibold text-gray-700 mb-4">Accesos rápidos</h2>
        <div class="grid grid-cols-2 gap-3">
          <QuickLink to="/pedidos" :icon="ClipboardList" label="Nuevo Pedido" />
          <QuickLink to="/ventas" :icon="Receipt" label="Registrar Venta" />
          <QuickLink to="/rutas" :icon="Truck" label="Gestionar Rutas" />
          <QuickLink to="/trabajadores" :icon="BriefcaseBusiness" label="Trabajadores" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertTriangle, BriefcaseBusiness, ChevronRight, ClipboardList, Receipt, Truck, WalletCards } from 'lucide-vue-next'
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
  { label: 'Ventas hoy', value: '—', icon: Receipt, color: 'green' },
  { label: 'Pedidos activos', value: '—', icon: ClipboardList, color: 'blue' },
  { label: 'Cartera total', value: '—', icon: WalletCards, color: 'orange' },
  { label: 'Rutas activas', value: '—', icon: Truck, color: 'purple' },
])

async function fetchDashboard() {
  try {
    const [estadoRes, pedidosRes, diaPendienteRes] =
      await Promise.allSettled([
        api.get(`/diario/estado?fecha=${today}`),
        api.get('/operaciones/pedidos?estado=PENDIENTE&limit=1'),
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
    if (estadoRes.status === 'rejected') fallas.push('estado del dia')
    if (pedidosRes.status === 'rejected') fallas.push('pedidos')
    if (fallas.length) {
      notify.error(`No se pudo cargar: ${fallas.join(', ')}`)
    }
  } catch (e) {
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
