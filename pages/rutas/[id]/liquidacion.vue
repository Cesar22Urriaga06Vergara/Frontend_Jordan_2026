<template>
  <div class="min-h-[calc(100vh-8rem)] flex flex-col space-y-6">
    <header class="flex flex-wrap items-start gap-4 border-b border-gray-200 pb-4">
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn-secondary inline-flex items-center gap-2 text-sm"
          @click="router.push(`/rutas/${id}`)"
        >
          <ArrowLeft :size="18" /> Volver a la ruta
        </button>
        <button
          type="button"
          class="btn-secondary inline-flex items-center gap-2 text-sm"
          @click="router.push('/rutas')"
        >
          Listado de rutas
        </button>
      </div>
      <div v-if="ruta" class="flex-1 min-w-0 text-right sm:text-left">
        <p class="text-xs uppercase tracking-wide text-gray-500">Liquidación</p>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900 truncate">{{ ruta.numero }}</h1>
        <div v-if="ruta.estado" class="mt-1 flex flex-wrap gap-2 justify-end sm:justify-start">
          <EstadoBadge :estado="ruta.estado" />
          <span class="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-1">
            {{ ruta.itemsRuta?.length ?? 0 }} pedidos
          </span>
        </div>
      </div>
    </header>

    <div v-if="loading" class="card flex-1 flex items-center justify-center py-20 text-gray-500">
      Cargando…
    </div>

    <div v-else-if="loadError" class="card text-red-600">
      {{ loadError }}
    </div>

    <template v-else-if="ruta">
      <div v-if="ruta.estado !== 'EN_LIQUIDACION'" class="card space-y-4">
        <p class="text-gray-700">
          Solo podés usar esta pantalla cuando la ruta está en <strong>En liquidación</strong>.
        </p>
        <p class="text-sm text-gray-500">
          Estado actual: <EstadoBadge :estado="ruta.estado" />
        </p>
        <button type="button" class="btn-primary" @click="router.push(`/rutas/${id}`)">
          Ir al detalle de la ruta
        </button>
      </div>

      <div v-else class="flex-1 flex flex-col">
        <div class="card flex-1 space-y-4 shadow-md border-gray-200">
          <div class="flex items-start gap-3">
            <div class="h-11 w-11 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
              <ClipboardList class="h-5 w-5" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-900">Registrar liquidación</h2>
            <p class="text-sm text-gray-600 mt-1">
                Marca entrega, forma de pago y valores recibidos por pedido.
            </p>
            </div>
          </div>
          <RutaLiquidacionForm :ctx="liq" :saving="saving" @confirm="liquidarRuta" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, ClipboardList } from 'lucide-vue-next'
import { useRutaLiquidacion } from '~/composables/useRutaLiquidacion'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const api = useApi()
const notify = useNotification()
const apiResponse = useApiResponse()
const liq = useRutaLiquidacion()

const id = computed(() => Number(route.params.id))

const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const ruta = ref<any>(null)

async function fetchRuta() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await api.get(`/operaciones/rutas/${id.value}`)
    ruta.value = apiResponse.unwrap(res)
    if (ruta.value?.estado === 'EN_LIQUIDACION') {
      liq.resetFromItemsRuta(ruta.value.itemsRuta ?? [])
    }
  } catch {
    loadError.value = 'No se pudo cargar la ruta.'
    ruta.value = null
  } finally {
    loading.value = false
  }
}

watch(id, () => fetchRuta())

async function liquidarRuta() {
  if (!ruta.value) return
  saving.value = true
  try {
    const ok = await liq.submitLiquidacion(api, ruta.value.id, notify)
    if (!ok) return
    await router.push('/rutas')
  } catch (e: any) {
    const backendErrors = Array.isArray(e?.response?.data?.errors)
      ? e.response.data.errors.join(' | ')
      : ''
    notify.error(backendErrors || e?.response?.data?.message || e?.message || 'Error al liquidar')
  } finally {
    saving.value = false
  }
}

onMounted(fetchRuta)
</script>
