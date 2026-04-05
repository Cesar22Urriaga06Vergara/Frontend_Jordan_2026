<template>
  <div class="flex h-screen overflow-hidden bg-gray-100">
    <!-- Sidebar -->
    <aside
      class="flex flex-col w-64 bg-blue-950 text-white flex-shrink-0 transition-all duration-200"
      :class="{ '-translate-x-64': !sidebarOpen }"
    >
      <!-- Logo -->
      <div class="flex items-center gap-3 px-5 py-4 border-b border-blue-800">
        <div class="w-8 h-8 rounded-full bg-cyan-400 flex items-center justify-center font-bold text-blue-950 text-sm">
          J
        </div>
        <span class="font-semibold text-lg tracking-wide">JORDAN</span>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto py-4">
        <NavGroup label="General">
          <NavItem to="/" icon="🏠" label="Dashboard" />
        </NavGroup>

        <NavGroup label="Operaciones">
          <NavItem to="/diario" icon="📅" label="Flujo Diario" />
          <NavItem to="/pedidos" icon="📋" label="Pedidos" />
          <NavItem to="/rutas" icon="🚚" label="Rutas" />
          <NavItem to="/ventas" icon="💰" label="Ventas" />
          <NavItem to="/cartera" icon="📊" label="Cartera" />
        </NavGroup>

        <NavGroup label="Producción">
          <NavItem to="/produccion" icon="🏭" label="Producción" />
          <NavItem to="/inventario" icon="📦" label="Inventario" />
        </NavGroup>

        <NavGroup label="Trabajadores">
          <NavItem to="/trabajadores" icon="👷" label="Trabajadores" />
          <NavItem to="/caja" icon="🏦" label="Caja" />
        </NavGroup>

        <NavGroup label="Catálogos">
          <NavItem to="/catalogos/productos" icon="🛢" label="Productos" />
          <NavItem to="/catalogos/clientes" icon="👥" label="Clientes" />
          <NavItem to="/catalogos/trabajadores" icon="👷" label="Trabajadores" />
        </NavGroup>

        <NavGroup label="Sistema">
          <NavItem to="/reportes" icon="📈" label="Reportes" />
          <NavItem to="/configuracion" icon="⚙️" label="Configuración" />
        </NavGroup>
      </nav>

      <!-- User footer -->
      <div class="px-4 py-3 border-t border-blue-800 flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
          {{ userInitial }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ authStore.user?.nombre || 'Usuario' }}</p>
          <p class="text-xs text-blue-300 truncate">{{ authStore.user?.rol }}</p>
        </div>
        <button class="text-blue-300 hover:text-white text-lg" @click="logout">↩</button>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Top bar -->
      <header class="bg-white shadow-sm px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button class="text-gray-500 hover:text-gray-700 text-xl" @click="sidebarOpen = !sidebarOpen">
          ☰
        </button>
        <h1 class="font-semibold text-gray-700 flex-1">{{ pageTitle }}</h1>
      </header>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto p-5">
        <slot />
      </main>
    </div>

    <!-- Notifications -->
    <NotificationsToast />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

defineOptions({ name: 'DefaultLayout' })

const authStore = useAuthStore()
const route = useRoute()
const sidebarOpen = ref(true)

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

async function logout() {
  authStore.logout()
  navigateTo('/login')
}
</script>
