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
      <!-- Logo -->
      <div class="flex items-center gap-3 px-5 py-5 border-b border-blue-800 bg-gradient-to-r from-blue-950 to-blue-900">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-400 flex items-center justify-center font-bold text-blue-950 text-lg shadow-lg">
          J
        </div>
        <div class="flex-1">
          <span class="font-bold text-lg tracking-widest text-white">JORDAN</span>
          <p class="text-xs text-blue-300">Gestión 2026</p>
        </div>
        <!-- Cerrar en móvil -->
        <button class="lg:hidden text-blue-300 hover:text-white p-1 rounded transition-colors" @click="sidebarOpen = false">
          ✕
        </button>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto py-4">
        <NavGroup label="General">
          <NavItem to="/" icon="🏠" label="Dashboard" @click="closeSidebarOnMobile" />
        </NavGroup>

        <NavGroup label="Operaciones">
          <NavItem to="/diario" icon="📅" label="Flujo Diario" @click="closeSidebarOnMobile" />
          <NavItem to="/pedidos" icon="📋" label="Pedidos" @click="closeSidebarOnMobile" />
          <NavItem to="/rutas" icon="🚚" label="Rutas" @click="closeSidebarOnMobile" />
          <NavItem to="/ventas" icon="💰" label="Ventas" @click="closeSidebarOnMobile" />
          <NavItem to="/cartera" icon="📊" label="Cartera" @click="closeSidebarOnMobile" />
        </NavGroup>

        <NavGroup label="Producción">
          <NavItem to="/produccion" icon="🏭" label="Producción" @click="closeSidebarOnMobile" />
          <NavItem to="/inventario" icon="📦" label="Inventario" @click="closeSidebarOnMobile" />
        </NavGroup>

        <NavGroup label="Trabajadores">
          <NavItem to="/trabajadores" icon="👷" label="Trabajadores" @click="closeSidebarOnMobile" />
          <NavItem to="/caja" icon="🏦" label="Caja" @click="closeSidebarOnMobile" />
        </NavGroup>

        <NavGroup label="Catálogos">
          <NavItem to="/catalogos/productos" icon="🛢" label="Productos" @click="closeSidebarOnMobile" />
          <NavItem to="/catalogos/clientes" icon="👥" label="Clientes" @click="closeSidebarOnMobile" />
          <NavItem to="/catalogos/trabajadores" icon="👷" label="Trabajadores" @click="closeSidebarOnMobile" />
        </NavGroup>

        <NavGroup label="Sistema">
          <NavItem to="/reportes" icon="📈" label="Reportes" @click="closeSidebarOnMobile" />
          <NavItem to="/configuracion" icon="⚙️" label="Configuración" @click="closeSidebarOnMobile" />
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
        <button class="text-blue-300 hover:text-white text-xl hover:bg-blue-800 rounded-full p-1 transition-colors" @click="logout" title="Cerrar sesión">
          ⏻
        </button>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col overflow-hidden min-w-0">
      <!-- Top bar -->
      <header class="bg-white border-b-2 border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-col gap-2 flex-shrink-0 shadow-sm">
        <div class="flex items-center gap-3">
          <button class="text-gray-500 hover:text-blue-600 text-xl transition-colors flex-shrink-0 p-1 rounded hover:bg-gray-100" @click="sidebarOpen = !sidebarOpen">
            ☰
          </button>
          <h1 class="text-lg sm:text-2xl font-bold text-gray-900 truncate">{{ pageTitle }}</h1>
        </div>
        <div class="pl-9">
          <Breadcrumb :crumbs="breadcrumbs" />
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto px-3 py-3 sm:px-6 sm:py-5 bg-gray-50">
        <slot />
      </main>
    </div>

    <!-- Notifications -->
    <NotificationsToast />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import Breadcrumb from '~/components/layout/Breadcrumb.vue'

defineOptions({ name: 'DefaultLayout' })

const authStore = useAuthStore()
const route = useRoute()

// En desktop empieza abierto, en móvil cerrado
const sidebarOpen = ref(false)

onMounted(() => {
  sidebarOpen.value = window.innerWidth >= 1024
})

function closeSidebarOnMobile() {
  if (window.innerWidth < 1024) sidebarOpen.value = false
}

const userInitial = computed(() =>
  authStore.user?.nombre?.charAt(0).toUpperCase() ?? 'U',
)

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/': 'Dashboard',
    '/diario': 'Flujo Diario',
    '/pedidos': 'Pedidos',
    '/rutas': 'Rutas',
    '/ventas': 'Ventas',
    '/cartera': 'Cartera',
    '/produccion': 'Producción',
    '/inventario': 'Inventario',
    '/trabajadores': 'Trabajadores',
    '/caja': 'Caja',
    '/catalogos/productos': 'Catálogo de Productos',
    '/catalogos/clientes': 'Catálogo de Clientes',
    '/catalogos/trabajadores': 'Catálogo de Trabajadores',
    '/reportes': 'Reportes',
    '/configuracion': 'Configuración',
  }
  return titles[route.path] ?? 'JORDAN'
})

const breadcrumbs = computed(() => {
  const crumbMap: Record<string, { label: string; href: string }[]> = {
    '/': [{ label: 'Dashboard', href: '/' }],
    '/diario': [{ label: 'Flujo Diario', href: '/diario' }],
    '/pedidos': [{ label: 'Pedidos', href: '/pedidos' }],
    '/rutas': [{ label: 'Rutas', href: '/rutas' }],
    '/ventas': [{ label: 'Ventas', href: '/ventas' }],
    '/cartera': [{ label: 'Cartera', href: '/cartera' }],
    '/produccion': [{ label: 'Producción', href: '/produccion' }],
    '/inventario': [{ label: 'Inventario', href: '/inventario' }],
    '/trabajadores': [{ label: 'Trabajadores', href: '/trabajadores' }],
    '/caja': [{ label: 'Caja', href: '/caja' }],
    '/catalogos/productos': [
      { label: 'Catálogos', href: '/catalogos/productos' },
      { label: 'Productos', href: '/catalogos/productos' },
    ],
    '/catalogos/clientes': [
      { label: 'Catálogos', href: '/catalogos/clientes' },
      { label: 'Clientes', href: '/catalogos/clientes' },
    ],
    '/catalogos/trabajadores': [
      { label: 'Catálogos', href: '/catalogos/trabajadores' },
      { label: 'Trabajadores', href: '/catalogos/trabajadores' },
    ],
    '/reportes': [{ label: 'Reportes', href: '/reportes' }],
    '/configuracion': [{ label: 'Configuración', href: '/configuracion' }],
  }
  
  return crumbMap[route.path] ?? [{ label: 'Página', href: route.path }]
})

async function logout() {
  authStore.logout()
  navigateTo('/login')
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
