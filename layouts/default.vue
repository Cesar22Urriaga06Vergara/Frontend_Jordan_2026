<template>
  <div class="flex h-screen overflow-hidden bg-gray-50">

    <!-- Backdrop móvil -->
    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 bg-black/50 z-20 lg:hidden"
        @click="sidebarOpen = false"
      />
    </Transition>

    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-30 flex flex-col bg-gradient-to-b from-blue-950 to-blue-900 text-white flex-shrink-0 shadow-xl transition-all duration-300
             lg:static lg:z-auto lg:translate-x-0 lg:overflow-hidden"
      :class="sidebarOpen
        ? 'w-64 translate-x-0'
        : 'w-64 -translate-x-full lg:w-0'"
    >
      <!-- Logo → public/LOGO.png -->
      <div class="flex items-center gap-3 px-5 py-5 border-b border-blue-800 bg-gradient-to-r from-blue-950 to-blue-900">
        <div
          class="h-11 w-11 shrink-0 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-lg ring-2 ring-cyan-400/50 ring-offset-2 ring-offset-blue-950"
          aria-hidden="true"
        >
          <img src="/LOGO.png" alt="" class="h-9 w-9 object-contain" width="36" height="36" />
        </div>
        <div class="flex-1">
          <span class="font-bold text-lg tracking-widest text-white">JORDAN</span>
          <p class="text-xs text-blue-300">Gestión 2026</p>
        </div>
        <!-- Cerrar en móvil -->
        <button class="lg:hidden text-blue-300 hover:text-white p-1 rounded transition-colors" @click="sidebarOpen = false">
            <ArrowLeft class="h-5 w-5" />
          </button>
        </div>

        <!-- Nav -->
        <nav class="flex-1 overflow-y-auto py-4">
          <NavGroup label="General">
            <NavItem to="/" :icon="Home" label="Dashboard" @click="closeSidebarOnMobile" />
          </NavGroup>

          <NavGroup label="Operaciones">
            <NavItem to="/operaciones/diario" :icon="CalendarDays" label="Gestión de Planta" @click="closeSidebarOnMobile" />
            <NavItem to="/pedidos" :icon="ClipboardList" label="Pedidos" @click="closeSidebarOnMobile" />
            <NavItem to="/rutas" :icon="Truck" label="Rutas" @click="closeSidebarOnMobile" />
            <NavItem to="/ventas" :icon="Receipt" label="Ventas" @click="closeSidebarOnMobile" />
            <NavItem to="/operaciones/cartera" :icon="WalletCards" label="Cartera" @click="closeSidebarOnMobile" />
          </NavGroup>

          <NavGroup label="Producción">
            <NavItem to="/produccion" :icon="Factory" label="Producción" @click="closeSidebarOnMobile" />
            <NavItem to="/inventario" :icon="Boxes" label="Inventario" @click="closeSidebarOnMobile" />
          </NavGroup>

          <NavGroup label="Personal y Caja">
            <NavItem to="/trabajadores" :icon="BriefcaseBusiness" label="Labores y Pagos" @click="closeSidebarOnMobile" />
            <NavItem to="/operaciones/caja" :icon="CreditCard" label="Caja" @click="closeSidebarOnMobile" />
          </NavGroup>

          <NavGroup label="Catálogos">
            <NavItem to="/catalogos/productos" :icon="Package" label="Productos" @click="closeSidebarOnMobile" />
            <NavItem to="/catalogos/clientes" :icon="UserRound" label="Clientes" @click="closeSidebarOnMobile" />
            <NavItem to="/catalogos/trabajadores" :icon="BriefcaseBusiness" label="Trabajadores" @click="closeSidebarOnMobile" />
            <NavItem to="/catalogos/trabajador-tipos" :icon="UserCog" label="Tipos trabajador" @click="closeSidebarOnMobile" />
            <NavItem to="/catalogos/labor-tipos" :icon="Layers3" label="Tipos de labor" @click="closeSidebarOnMobile" />
          </NavGroup>

          <NavGroup label="Sistema">
            <NavItem to="/reportes" :icon="BarChart3" label="Reportes" @click="closeSidebarOnMobile" />
            <NavItem to="/configuracion" :icon="Settings" label="Configuración" @click="closeSidebarOnMobile" />
          </NavGroup>
        </nav>
      <!-- User footer -->
      <div class="px-4 py-4 border-t border-blue-800 bg-gradient-to-r from-blue-900 to-blue-950 flex items-center gap-3 rounded-t-lg">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-300 to-blue-400 flex items-center justify-center text-sm font-bold text-blue-950 shadow-md flex-shrink-0">
          {{ userInitial }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-white truncate">{{ authStore.user?.nombre || 'Usuario' }}</p>
          <p class="text-xs text-blue-200 truncate">{{ authStore.user?.rol }}</p>
        </div>
        <button class="text-blue-300 hover:text-white hover:bg-blue-800 rounded-full p-1 transition-colors" @click="logout" title="Cerrar sesión">
          <LogOut class="h-5 w-5" />
        </button>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col overflow-hidden min-w-0">
      <!-- Top bar -->
      <header class="bg-white border-b-2 border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-col gap-2 flex-shrink-0 shadow-sm">
        <div class="flex items-center gap-3">
          <button class="text-gray-500 hover:text-blue-600 transition-colors flex-shrink-0 p-1 rounded hover:bg-gray-100" @click="sidebarOpen = !sidebarOpen">
            <Menu class="h-5 w-5" />
          </button>
          <h1 class="text-lg sm:text-2xl font-bold text-gray-900 truncate">{{ pageTitle }}</h1>
        </div>
        <div class="pl-9">
          <Breadcrumb :crumbs="breadcrumbs" />
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto px-3 py-3 sm:px-6 sm:py-5 bg-gray-50">
        <div
          v-if="diaAbiertoPendiente && route.path !== '/operaciones/diario'"
          class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm"
        >
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-start gap-3">
              <AlertTriangle class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
              <div>
                <p class="text-sm font-semibold">Jornada abierta sin cierre</p>
                <p class="text-xs text-amber-800">
                  Hay una jornada abierta del {{ formatDate(diaAbiertoPendiente.fecha) }}. Revísala antes de avanzar con otra fecha.
                </p>
              </div>
            </div>
            <NuxtLink
              :to="{ path: '/operaciones/diario', query: { fecha: diaAbiertoPendiente.fecha } }"
              class="btn-secondary inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm"
            >
              Ir a liquidar jornada
              <ChevronRight class="h-4 w-4" />
            </NuxtLink>
          </div>
        </div>
        <slot />
      </main>
    </div>

    <!-- Notifications -->
    <NotificationsToast />
  </div>
</template>

<script setup lang="ts">
import { AlertTriangle, ArrowLeft, BarChart3, Boxes, BriefcaseBusiness, CalendarDays, ChevronRight, ClipboardList, CreditCard, Factory, Home, Layers3, LogOut, Menu, Package, Receipt, Settings, Truck, UserCog, UserRound, WalletCards } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'
import Breadcrumb from '~/components/layout/Breadcrumb.vue'
import { formatDate, todayISO } from '~/utils/formats'

defineOptions({ name: 'DefaultLayout' })

const authStore = useAuthStore()
const route = useRoute()
const api = useApi()
const apiResponse = useApiResponse()

// En desktop empieza abierto, en móvil cerrado
const sidebarOpen = ref(false)
const diaAbiertoPendiente = ref<any>(null)

onMounted(() => {
  sidebarOpen.value = window.innerWidth >= 1024
  fetchDiaAbiertoPendiente()
})

watch(() => route.fullPath, () => {
  fetchDiaAbiertoPendiente()
})

function closeSidebarOnMobile() {
  if (window.innerWidth < 1024) sidebarOpen.value = false
}

const userInitial = computed(() =>
  authStore.user?.nombre?.charAt(0).toUpperCase() ?? 'U',
)

const pageTitle = computed(() => resolvePageMeta(route.path).title)

const breadcrumbs = computed(() => resolvePageMeta(route.path).crumbs)

function resolvePageMeta(path: string): {
  title: string
  crumbs: { label: string; href: string }[]
} {
  const staticPages: Record<string, { title: string; crumbs: { label: string; href: string }[] }> = {
    '/': { title: 'Dashboard', crumbs: [{ label: 'Dashboard', href: '/' }] },
    '/operaciones/diario': {
      title: 'Gestión de Planta',
      crumbs: [{ label: 'Gestión de Planta', href: '/operaciones/diario' }],
    },
    '/pedidos': { title: 'Pedidos', crumbs: [{ label: 'Pedidos', href: '/pedidos' }] },
    '/rutas': { title: 'Rutas', crumbs: [{ label: 'Rutas', href: '/rutas' }] },
    '/ventas': { title: 'Ventas', crumbs: [{ label: 'Ventas', href: '/ventas' }] },
    '/operaciones/cartera': {
      title: 'Cartera',
      crumbs: [{ label: 'Cartera', href: '/operaciones/cartera' }],
    },
    '/operaciones/caja': {
      title: 'Caja',
      crumbs: [{ label: 'Caja', href: '/operaciones/caja' }],
    },
    '/produccion': {
      title: 'Producción',
      crumbs: [{ label: 'Producción', href: '/produccion' }],
    },
    '/inventario': { title: 'Inventario', crumbs: [{ label: 'Inventario', href: '/inventario' }] },
    '/trabajadores': {
      title: 'Labores y Pagos',
      crumbs: [
        { label: 'Personal y Caja', href: '/trabajadores' },
        { label: 'Labores y Pagos', href: '/trabajadores' },
      ],
    },
    '/catalogos/productos': {
      title: 'Catálogo de Productos',
      crumbs: [
        { label: 'Catálogos', href: '/catalogos/productos' },
        { label: 'Productos', href: '/catalogos/productos' },
      ],
    },
    '/catalogos/clientes': {
      title: 'Catálogo de Clientes',
      crumbs: [
        { label: 'Catálogos', href: '/catalogos/clientes' },
        { label: 'Clientes', href: '/catalogos/clientes' },
      ],
    },
    '/catalogos/trabajadores': {
      title: 'Catálogo de Trabajadores',
      crumbs: [
        { label: 'Catálogos', href: '/catalogos/trabajadores' },
        { label: 'Trabajadores', href: '/catalogos/trabajadores' },
      ],
    },
    '/catalogos/labor-tipos': {
      title: 'Tipos de Labor',
      crumbs: [
        { label: 'Catálogos', href: '/catalogos/labor-tipos' },
        { label: 'Tipos de labor', href: '/catalogos/labor-tipos' },
      ],
    },
    '/catalogos/trabajador-tipos': {
      title: 'Tipos de Trabajador',
      crumbs: [
        { label: 'Catálogos', href: '/catalogos/trabajador-tipos' },
        { label: 'Tipos de trabajador', href: '/catalogos/trabajador-tipos' },
      ],
    },
    '/reportes': { title: 'Reportes', crumbs: [{ label: 'Reportes', href: '/reportes' }] },
    '/configuracion': {
      title: 'Configuración',
      crumbs: [{ label: 'Configuración', href: '/configuracion' }],
    },
  }

  if (staticPages[path]) return staticPages[path]

  if (path === '/pedidos/create') {
    return {
      title: 'Nuevo Pedido',
      crumbs: [
        { label: 'Pedidos', href: '/pedidos' },
        { label: 'Nuevo', href: path },
      ],
    }
  }

  if (/^\/pedidos\/[^/]+\/edit$/.test(path)) {
    return {
      title: 'Editar Pedido',
      crumbs: [
        { label: 'Pedidos', href: '/pedidos' },
        { label: 'Editar', href: path },
      ],
    }
  }

  if (/^\/pedidos\/[^/]+$/.test(path)) {
    return {
      title: 'Detalle de Pedido',
      crumbs: [
        { label: 'Pedidos', href: '/pedidos' },
        { label: 'Detalle', href: path },
      ],
    }
  }

  if (/^\/rutas\/[^/]+\/liquidacion$/.test(path)) {
    const rutaId = path.split('/')[2]
    return {
      title: 'Liquidación de Ruta',
      crumbs: [
        { label: 'Rutas', href: '/rutas' },
        { label: `Ruta ${rutaId}`, href: `/rutas/${rutaId}` },
        { label: 'Liquidación', href: path },
      ],
    }
  }

  if (/^\/rutas\/[^/]+$/.test(path)) {
    return {
      title: 'Detalle de Ruta',
      crumbs: [
        { label: 'Rutas', href: '/rutas' },
        { label: 'Detalle', href: path },
      ],
    }
  }

  const catalogCreateMatch = path.match(/^\/catalogos\/([^/]+)\/create$/)
  if (catalogCreateMatch) {
    const section = catalogCreateMatch[1]
    const label = catalogLabel(section)
    return {
      title: `Nuevo ${singularCatalogLabel(section)}`,
      crumbs: [
        { label: 'Catálogos', href: `/catalogos/${section}` },
        { label, href: `/catalogos/${section}` },
        { label: 'Nuevo', href: path },
      ],
    }
  }

  const catalogEditMatch = path.match(/^\/catalogos\/([^/]+)\/[^/]+$/)
  if (catalogEditMatch) {
    const section = catalogEditMatch[1]
    const label = catalogLabel(section)
    return {
      title: `Editar ${singularCatalogLabel(section)}`,
      crumbs: [
        { label: 'Catálogos', href: `/catalogos/${section}` },
        { label, href: `/catalogos/${section}` },
        { label: 'Editar', href: path },
      ],
    }
  }

  return { title: 'JORDAN', crumbs: [{ label: 'Página', href: path }] }
}

function catalogLabel(section: string): string {
  const labels: Record<string, string> = {
    productos: 'Productos',
    clientes: 'Clientes',
    trabajadores: 'Trabajadores',
    'labor-tipos': 'Tipos de labor',
    'trabajador-tipos': 'Tipos de trabajador',
  }
  return labels[section] ?? 'Catálogo'
}

function singularCatalogLabel(section: string): string {
  const labels: Record<string, string> = {
    productos: 'Producto',
    clientes: 'Cliente',
    trabajadores: 'Trabajador',
    'trabajador-tipos': 'Tipo de trabajador',
  }
  return labels[section] ?? 'Registro'
}

async function logout() {
  await authStore.logout()
  navigateTo('/auth')
}

async function fetchDiaAbiertoPendiente() {
  try {
    const fecha = todayISO()
    const res = await api.get('/diario/dia-abierto-pendiente', { params: { fecha } })
    const pendiente = apiResponse.unwrap(res) as any
    diaAbiertoPendiente.value = pendiente?.fecha && pendiente.fecha !== fecha ? pendiente : null
  } catch {
    diaAbiertoPendiente.value = null
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
