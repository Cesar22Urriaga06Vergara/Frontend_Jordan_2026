<template>
  <div class="space-y-6">
    <section
      class="rounded-lg border p-5 shadow-sm"
      :class="operationalPanel.wrapperClass"
    >
      <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-start gap-4">
          <div
            class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
            :class="operationalPanel.iconClass"
          >
            <component :is="operationalPanel.icon" class="h-6 w-6" />
          </div>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="operationalPanel.badgeClass">
                {{ operationalPanel.badge }}
              </span>
              <span class="text-sm text-gray-500">{{ todayLabel }}</span>
            </div>
            <h2 class="mt-2 text-xl font-bold text-gray-900">{{ operationalPanel.title }}</h2>
            <p class="mt-1 max-w-2xl text-sm text-gray-600">{{ operationalPanel.description }}</p>
          </div>
        </div>

        <NuxtLink
          :to="operationalPanel.to"
          class="btn-primary inline-flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <component :is="operationalPanel.actionIcon" class="h-4 w-4" />
          {{ operationalPanel.actionLabel }}
        </NuxtLink>
      </div>
    </section>

    <ReprogramadosAlert />

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

    <section v-if="stockBajo.length" class="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-start gap-3">
          <AlertTriangle class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
          <div>
            <p class="text-sm font-semibold text-amber-900">Stock casi agotado</p>
            <p class="mt-1 text-sm text-amber-800">
              {{ stockBajoResumen }}. Revisa inventario para producir o ajustar stock.
            </p>
          </div>
        </div>
        <NuxtLink to="/inventario" class="btn-secondary inline-flex items-center justify-center gap-2 text-sm">
          Ver inventario
          <ChevronRight class="h-4 w-4" />
        </NuxtLink>
      </div>
    </section>

    <div class="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <section class="card">
        <div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="text-xs font-bold uppercase text-gray-400">Control de jornada</p>
            <h2 class="mt-1 font-semibold text-gray-800">Estado operativo de hoy</h2>
          </div>
          <NuxtLink
            to="/operaciones/diario"
            class="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
          >
            Ver Gestión de Planta
            <ChevronRight class="h-4 w-4" />
          </NuxtLink>
        </div>

        <div v-if="loadingEstado" class="text-sm text-gray-400">Cargando estado...</div>
        <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div
            v-for="item in statusChecks"
            :key="item.label"
            class="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
          >
            <div
              class="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
              :class="statusToneClass(item.tone).icon"
            >
              <component :is="item.icon" class="h-4 w-4" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-800">{{ item.label }}</p>
              <p class="mt-0.5 text-xs" :class="statusToneClass(item.tone).text">{{ item.detail }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="mb-5 flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-bold uppercase text-gray-400">Acciones</p>
            <h2 class="mt-1 font-semibold text-gray-800">Accesos rápidos</h2>
          </div>
          <span
            class="rounded-full px-2.5 py-1 text-xs font-semibold"
            :class="puedeOperar ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
          >
            {{ puedeOperar ? 'Habilitado' : 'Bloqueado' }}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <QuickLink
            to="/pedidos/create"
            :icon="ClipboardList"
            label="Nuevo pedido"
            :disabled="!puedeOperar"
            @blocked="mostrarBloqueoOperativo"
          />
          <QuickLink
            to="/ventas"
            :icon="Receipt"
            label="Registrar venta"
            :disabled="!puedeOperar"
            @blocked="mostrarBloqueoOperativo"
          />
          <QuickLink
            to="/rutas"
            :icon="Truck"
            label="Gestionar rutas"
            :disabled="!puedeOperar"
            @blocked="mostrarBloqueoOperativo"
          />
          <QuickLink to="/trabajadores" :icon="BriefcaseBusiness" label="Labores y pagos" />
        </div>

        <div v-if="!puedeOperar" class="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-500">
          Inicia o liquida la jornada desde Gestión de Planta para habilitar operaciones.
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  LockKeyhole,
  Receipt,
  Rocket,
  Truck,
  WalletCards,
} from 'lucide-vue-next'
import { formatCurrency, formatDate, todayISOLocal } from '~/utils/formats'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const apiResponse = useApiResponse()
const notify = useNotification()
const loadingStats = ref(true)
const loadingEstado = ref(true)
const estadoDia = ref<any>(null)
const diaAbiertoPendiente = ref<any>(null)
const stockBajo = ref<any[]>([])
let refreshTimer: ReturnType<typeof setInterval> | null = null

const today = todayISOLocal()
const todayLabel = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
}).format(new Date())

type CardColor = 'green' | 'blue' | 'orange' | 'purple' | 'red'
type StatusTone = 'ok' | 'pending' | 'blocked' | 'neutral'

const statCards = ref<{ label: string; value: string; icon?: any; color: CardColor }[]>([
  { label: 'Ventas hoy', value: '-', icon: Receipt, color: 'green' },
  { label: 'Pedidos activos', value: '-', icon: ClipboardList, color: 'blue' },
  { label: 'Cartera total', value: '-', icon: WalletCards, color: 'orange' },
  { label: 'Rutas activas', value: '-', icon: Truck, color: 'purple' },
])

const hayJornadaAnteriorPendiente = computed(() =>
  Boolean(diaAbiertoPendiente.value?.fecha && diaAbiertoPendiente.value.fecha !== today),
)
const puedeOperar = computed(() =>
  Boolean(estadoDia.value?.abierto && !hayJornadaAnteriorPendiente.value),
)
const stockBajoResumen = computed(() =>
  stockBajo.value
    .slice(0, 3)
    .map(item => `${item.producto?.nombre ?? item.productoId}: ${item.stockActual}/${item.stockMinimo}`)
    .join(', ') + (stockBajo.value.length > 3 ? ` y ${stockBajo.value.length - 3} más` : ''),
)

const operationalPanel = computed(() => {
  if (loadingEstado.value) {
    return {
      icon: CalendarDays,
      actionIcon: ArrowRight,
      badge: 'Consultando',
      title: 'Validando jornada',
      description: 'Estamos consultando el estado operativo antes de habilitar acciones.',
      actionLabel: 'Ver Gestión de Planta',
      to: '/operaciones/diario',
      wrapperClass: 'border-gray-200 bg-white',
      iconClass: 'bg-gray-100 text-gray-600',
      badgeClass: 'bg-gray-100 text-gray-600',
    }
  }

  if (hayJornadaAnteriorPendiente.value) {
    return {
      icon: AlertTriangle,
      actionIcon: CalendarDays,
      badge: 'Liquidación pendiente',
      title: `La jornada del ${formatDate(diaAbiertoPendiente.value.fecha)} quedó abierta`,
      description: 'Liquida ese día antes de registrar pedidos, rutas o ventas nuevas.',
      actionLabel: 'Ir a liquidar día anterior',
      to: { path: '/operaciones/diario', query: { fecha: diaAbiertoPendiente.value.fecha } },
      wrapperClass: 'border-amber-300 bg-amber-50',
      iconClass: 'bg-amber-100 text-amber-700',
      badgeClass: 'bg-amber-100 text-amber-800',
    }
  }

  if (!loadingEstado.value && estadoDia.value && !estadoDia.value.apertura) {
    return {
      icon: Rocket,
      actionIcon: ArrowRight,
      badge: 'Sin iniciar',
      title: 'Jornada sin iniciar',
      description: 'Abre la planta para habilitar pedidos, rutas, ventas y el cierre del día.',
      actionLabel: 'Abrir jornada de hoy',
      to: { path: '/operaciones/diario', query: { fecha: today, abrir: '1' } },
      wrapperClass: 'border-blue-200 bg-blue-50',
      iconClass: 'bg-blue-100 text-blue-700',
      badgeClass: 'bg-blue-100 text-blue-700',
    }
  }

  if (estadoDia.value?.abierto) {
    return {
      icon: CheckCircle2,
      actionIcon: ArrowRight,
      badge: 'Abierta',
      title: 'Jornada activa',
      description: 'Las operaciones están habilitadas. Revisa producción y cierre cuando termines el día.',
      actionLabel: 'Gestionar jornada',
      to: '/operaciones/diario',
      wrapperClass: 'border-green-200 bg-green-50',
      iconClass: 'bg-green-100 text-green-700',
      badgeClass: 'bg-green-100 text-green-700',
    }
  }

  return {
    icon: LockKeyhole,
    actionIcon: ArrowRight,
    badge: 'Cerrada',
    title: 'Jornada cerrada',
    description: 'El día ya fue liquidado. Puedes consultar el detalle en Gestión de Planta.',
    actionLabel: 'Ver detalle',
    to: '/operaciones/diario',
    wrapperClass: 'border-gray-200 bg-white',
    iconClass: 'bg-gray-100 text-gray-600',
    badgeClass: 'bg-gray-100 text-gray-600',
  }
})

const statusChecks = computed(() => {
  const pedidos = Number(estadoDia.value?.pedidosPendientes ?? 0)
  const rutas = Number(estadoDia.value?.rutasAbiertas ?? 0)

  return [
    {
      icon: CalendarDays,
      label: 'Apertura',
      detail: estadoDia.value?.apertura ? 'Registrada' : 'Pendiente',
      tone: estadoDia.value?.apertura ? 'ok' : 'pending',
    },
    {
      icon: ClipboardList,
      label: 'Pedidos',
      detail: pedidos > 0 ? `${pedidos} pendientes` : 'Sin pendientes',
      tone: pedidos > 0 ? 'pending' : 'ok',
    },
    {
      icon: Truck,
      label: 'Rutas',
      detail: rutas > 0 ? `${rutas} abiertas` : 'Sin rutas abiertas',
      tone: rutas > 0 ? 'pending' : 'ok',
    },
    {
      icon: ClipboardCheck,
      label: 'Cierre',
      detail: estadoDia.value?.cierre ? 'Registrado' : (estadoDia.value?.apertura ? 'Pendiente' : 'Sin iniciar'),
      tone: estadoDia.value?.cierre ? 'ok' : (estadoDia.value?.apertura ? 'neutral' : 'pending'),
    },
  ] as { icon: any; label: string; detail: string; tone: StatusTone }[]
})

function statusToneClass(tone: StatusTone) {
  return {
    ok: { icon: 'bg-green-100 text-green-700', text: 'text-green-700' },
    pending: { icon: 'bg-amber-100 text-amber-700', text: 'text-amber-700' },
    blocked: { icon: 'bg-red-100 text-red-700', text: 'text-red-700' },
    neutral: { icon: 'bg-blue-100 text-blue-700', text: 'text-blue-700' },
  }[tone]
}

function mostrarBloqueoOperativo() {
  notify.error("Acceso Restringido: Es necesario iniciar la jornada en 'Gestión de Planta' para operar.")
}

async function fetchDashboard() {
  try {
    const [estadoRes, pedidosRes, diaPendienteRes, stockBajoRes] =
      await Promise.allSettled([
        api.get('/diario/estado', { params: { fecha: today } }),
        api.get('/operaciones/pedidos', { params: { estado: 'PENDIENTE', limit: 1 } }),
        api.get('/diario/dia-abierto-pendiente', { params: { fecha: today } }),
        api.get('/inventarios/stock-bajo'),
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
      const pendiente = apiResponse.unwrap(diaPendienteRes.value) as any
      diaAbiertoPendiente.value = pendiente?.fecha && pendiente.fecha !== today ? pendiente : null
    }
    if (stockBajoRes.status === 'fulfilled') {
      stockBajo.value = apiResponse.list(stockBajoRes.value)
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
