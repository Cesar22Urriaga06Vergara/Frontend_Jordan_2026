<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Auditoría</h1>
        <p class="text-sm text-gray-500">Trazabilidad de cambios registrados en el sistema.</p>
      </div>
      <button class="btn-secondary inline-flex items-center gap-2" @click="fetchCambios">
        <RefreshCw class="h-4 w-4" />
        Actualizar
      </button>
    </div>

    <div class="card flex flex-wrap gap-3 items-end">
      <FormField label="Entidad">
        <input v-model="filtros.entidad" class="form-input w-40" placeholder="Venta, Pedido..." @keyup.enter="fetchCambios" />
      </FormField>
      <FormField label="Acción">
        <select v-model="filtros.accion" class="form-input w-36" @change="fetchCambios">
          <option value="">Todas</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
        </select>
      </FormField>
      <FormField label="Desde">
        <input v-model="filtros.fechaDesde" type="date" class="form-input w-40" @change="fetchCambios" />
      </FormField>
      <FormField label="Hasta">
        <input v-model="filtros.fechaHasta" type="date" class="form-input w-40" @change="fetchCambios" />
      </FormField>
      <FormField label="Buscar">
        <input v-model="busqueda" class="form-input w-48" placeholder="Palabra clave..." @keyup.enter="buscar" />
      </FormField>
      <button class="btn-primary" @click="buscar">Buscar</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4" v-if="resumenEntidades.length">
      <div v-for="item in resumenEntidades.slice(0, 6)" :key="item.entidad" class="card py-3">
        <p class="text-xs uppercase text-gray-500">{{ item.entidad }}</p>
        <p class="text-2xl font-bold text-gray-800">{{ item.total }}</p>
      </div>
    </div>

    <div class="card overflow-x-auto p-0">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-center text-gray-500 border-b text-xs uppercase">
            <th class="px-4 py-3 font-medium">Fecha</th>
            <th class="px-4 py-3 font-medium">Entidad</th>
            <th class="px-4 py-3 font-medium">ID</th>
            <th class="px-4 py-3 font-medium">Acción</th>
            <th class="px-4 py-3 font-medium">Usuario</th>
            <th class="px-4 py-3 font-medium">Detalle</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="px-4 py-8 text-center text-gray-400">Cargando…</td>
          </tr>
          <tr v-for="c in cambios" :key="c.id" class="border-b border-gray-50 hover:bg-gray-50">
            <td class="px-4 py-3 text-gray-500 whitespace-nowrap">{{ formatDateTime(c.fecha) }}</td>
            <td class="px-4 py-3 font-medium text-gray-800">{{ c.entidad }}</td>
            <td class="px-4 py-3 text-gray-600">{{ c.entidadId }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-0.5 rounded text-xs font-semibold" :class="accionClass(c.accion)">
                {{ c.accion }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-600">{{ c.usuario?.nombre ?? c.usuario?.email ?? '—' }}</td>
            <td class="px-4 py-3 text-left text-xs text-gray-500 max-w-md truncate">
              {{ c.razon || resumenCambio(c) }}
            </td>
          </tr>
          <tr v-if="!loading && !cambios.length">
            <td colspan="6" class="px-4 py-8 text-center text-gray-400">Sin registros de auditoría.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between text-sm text-gray-500">
      <span>{{ total }} registros</span>
      <div class="flex gap-2">
        <button class="btn-secondary px-3 py-1 text-xs" :disabled="pagina <= 1" @click="pagina--; fetchCambios()">Ant.</button>
        <span>{{ pagina }} / {{ totalPaginas }}</span>
        <button class="btn-secondary px-3 py-1 text-xs" :disabled="pagina >= totalPaginas" @click="pagina++; fetchCambios()">Sig.</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RefreshCw } from 'lucide-vue-next'
import { formatDateTime } from '~/utils/formats'

definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()
const api = useApi()
const apiResponse = useApiResponse()
const notify = useNotification()
const router = useRouter()

onMounted(() => {
  if (!authStore.isAdmin) {
    notify.error('Solo administradores pueden acceder a auditoría')
    router.replace('/')
    return
  }
  fetchResumen()
  fetchCambios()
})

const loading = ref(true)
const cambios = ref<any[]>([])
const resumenEntidades = ref<any[]>([])
const total = ref(0)
const pagina = ref(1)
const LIMITE = 25
const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / LIMITE)))
const busqueda = ref('')

const filtros = reactive({
  entidad: '',
  accion: '',
  fechaDesde: '',
  fechaHasta: '',
})

function accionClass(accion: string) {
  const classes: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
  }
  return classes[accion] ?? 'bg-gray-100 text-gray-600'
}

function resumenCambio(c: any) {
  if (c.cambiosDespues && typeof c.cambiosDespues === 'object') {
    return Object.keys(c.cambiosDespues).slice(0, 4).join(', ')
  }
  return '—'
}

async function fetchResumen() {
  try {
    const res = await api.get('/auditoria/resumen-por-entidad')
    const d = apiResponse.unwrap(res) as any
    resumenEntidades.value = Array.isArray(d) ? d : (d?.items ?? [])
  } catch {
    resumenEntidades.value = []
  }
}

async function fetchCambios() {
  loading.value = true
  try {
    const res = await api.get('/auditoria/cambios', {
      params: {
        page: pagina.value,
        limit: LIMITE,
        entidad: filtros.entidad || undefined,
        accion: filtros.accion || undefined,
        fechaDesde: filtros.fechaDesde || undefined,
        fechaHasta: filtros.fechaHasta || undefined,
      },
    })
    const d = apiResponse.unwrap(res) as any
    cambios.value = d.data ?? d.items ?? []
    total.value = d.pagination?.total ?? cambios.value.length
  } catch (e: any) {
    cambios.value = []
    notify.error(e?.response?.data?.message ?? 'Error cargando auditoría')
  } finally {
    loading.value = false
  }
}

async function buscar() {
  if (!busqueda.value.trim()) {
    pagina.value = 1
    await fetchCambios()
    return
  }
  loading.value = true
  try {
    const res = await api.get('/auditoria/buscar', {
      params: { q: busqueda.value.trim(), page: pagina.value, limit: LIMITE },
    })
    const d = apiResponse.unwrap(res) as any
    cambios.value = d.data ?? []
    total.value = d.pagination?.total ?? cambios.value.length
  } catch {
    notify.error('Error en búsqueda')
  } finally {
    loading.value = false
  }
}
</script>
