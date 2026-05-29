<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-start gap-4">
      <button
        type="button"
        class="btn-secondary inline-flex items-center gap-2 text-sm"
        @click="router.push('/rutas')"
      >
        <ArrowLeft :size="18" /> Volver al listado
      </button>
      <div v-if="ruta" class="flex-1 min-w-0">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-800 truncate">{{ ruta.numero }}</h1>
          <EstadoBadge :estado="ruta.estado" />
        </div>
        <p class="text-sm text-gray-500 mt-1">
          {{ formatDate(ruta.fecha) }}
          <span v-if="ruta.domiciliario?.nombre"> · {{ ruta.domiciliario.nombre }}</span>
        </p>
      </div>
      <button
        v-if="ruta"
        type="button"
        class="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-40"
        :disabled="deleting"
        @click="modalEliminarRuta?.open()"
      >
        <Trash2 :size="16" /> Eliminar ruta
      </button>
    </div>

    <div v-if="loading" class="card py-12 text-center text-gray-400">Cargando ruta…</div>
    <div v-else-if="loadError" class="card py-8 text-center text-red-600">{{ loadError }}</div>

    <template v-else-if="ruta">
      <!-- Pedidos -->
      <section class="card space-y-4">
        <h2 class="text-lg font-semibold text-gray-800">Pedidos en ruta ({{ ruta.itemsRuta?.length ?? 0 }})</h2>
        <ul class="text-sm divide-y divide-gray-100 border rounded-lg overflow-hidden">
          <li
            v-for="item in ruta.itemsRuta"
            :key="item.id"
            class="px-4 py-3 flex items-center justify-between gap-2 bg-white"
          >
            <span>{{ item.pedido?.numero ?? item.pedidoId }}</span>
            <div class="flex gap-2 items-center">
              <EstadoBadge :estado="item.pedido?.estado ?? ''" />
              <button
                v-if="puedeEditarPedidos"
                type="button"
                class="text-xs text-red-600 hover:underline"
                @click="quitarPedido(item.pedidoId)"
              >
                Quitar
              </button>
            </div>
          </li>
          <li v-if="!ruta.itemsRuta?.length" class="px-4 py-8 text-gray-400 text-center">Sin pedidos</li>
        </ul>

        <p
          v-if="puedeEditarPedidos"
          class="text-sm text-blue-800 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2"
        >
          Podés <strong>agregar o quitar</strong> pedidos mientras la ruta esté en <strong>Creada</strong> o
          <strong>Cargada</strong>. Al pulsar <strong>Salir a entregar</strong> ya no se puede modificar el cargue.
        </p>
      </section>

      <!-- Agregar pedidos -->
      <section v-if="puedeEditarPedidos" class="card space-y-3">
        <h2 class="text-lg font-semibold text-gray-800">Agregar pedidos pendientes</h2>
        <div v-if="loadingPendientes" class="text-sm text-gray-400">Cargando…</div>
        <div v-else-if="!pedidosPendientes.length" class="text-sm text-gray-400">No hay pedidos pendientes.</div>
        <div v-else class="space-y-1 max-h-56 overflow-y-auto border rounded-lg p-2 bg-gray-50">
          <label
            v-for="p in pedidosPendientes"
            :key="p.id"
            class="flex items-center gap-3 p-2 rounded hover:bg-white cursor-pointer text-sm"
            :class="pedidosSeleccionados.includes(p.id) ? 'bg-white ring-1 ring-blue-300' : ''"
          >
            <input v-model="pedidosSeleccionados" type="checkbox" :value="p.id" class="accent-blue-600" />
            <span class="font-medium text-gray-700">{{ p.numero ?? p.numeroPedido }}</span>
            <span class="text-gray-500 text-xs truncate">{{ p.cliente?.nombre ?? '' }}</span>
          </label>
        </div>
        <button
          type="button"
          class="btn-primary w-full sm:w-auto"
          :disabled="!pedidosSeleccionados.length || agregandoPedidos"
          @click="agregarPedidosSeleccionados"
        >
          {{ agregandoPedidos ? 'Agregando…' : `Agregar ${pedidosSeleccionados.length || ''} pedido(s)` }}
        </button>
      </section>

      <!-- Siguiente paso (acciones de estado) -->
      <section v-if="acciones.length" class="card space-y-3">
        <h2 class="text-lg font-semibold text-gray-800">Siguiente paso</h2>
        <div class="flex flex-wrap gap-3">
          <div v-for="a in acciones" :key="a.valor" class="flex flex-col gap-1 min-w-[200px] flex-1">
            <button
              type="button"
              :class="[
                'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition',
                a.variant === 'danger'
                  ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                  : 'bg-blue-950 text-white hover:bg-blue-900',
              ]"
              @click="cambiarEstadoRuta(a.valor)"
            >
              <component :is="a.icon" :size="18" />
              {{ a.label }}
            </button>
            <p v-if="a.hint" class="text-xs text-gray-500 px-0.5">{{ a.hint }}</p>
          </div>
        </div>
      </section>

      <!-- Liquidación: pantalla aparte -->
      <section
        v-if="ruta.estado === 'EN_LIQUIDACION'"
        class="card border-2 border-green-200 bg-gradient-to-br from-green-50 to-white space-y-3"
      >
        <h2 class="text-lg font-semibold text-gray-900">Listo para liquidar</h2>
        <p class="text-sm text-gray-600">
          Abrí el <strong>panel de liquidación</strong> en una vista dedicada (entregas, cobros y totales).
        </p>
        <button
          type="button"
          class="btn-primary bg-green-600 hover:bg-green-700 inline-flex items-center gap-2 w-full sm:w-auto"
          :disabled="navegandoLiquidacion"
          @click="abrirLiquidacion"
        >
          <span
            v-if="navegandoLiquidacion"
            class="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"
          />
          {{ navegandoLiquidacion ? 'Abriendo liquidación...' : 'Abrir panel de liquidación' }}
        </button>
      </section>

      <section v-if="ruta.estado === 'LIQUIDADA'" class="card border-green-200 bg-green-50/50">
        <p class="text-green-800 font-medium">Esta ruta ya fue liquidada.</p>
      </section>
      <section v-if="ruta.estado === 'ANULADA'" class="card border-gray-200 bg-gray-50">
        <p class="text-gray-700">Esta ruta fue anulada.</p>
      </section>
    </template>

    <ModalConfirmacion
      ref="modalAnulaConfirm"
      titulo="¿Anular esta ruta?"
      descripcion="No podrá liquidarse. Los pedidos volverán a estado pendiente donde aplique."
      textoConfirm="Anular"
      textoCancel="Volver"
      :detalles="{ Ruta: ruta?.numero, Trabajador: ruta?.domiciliario?.nombre }"
      advertencia="Esta acción no se puede deshacer."
      @confirm="procederAnular"
      @cancel="modalAnulaConfirm?.close()"
    />

    <ModalConfirmacion
      ref="modalEliminarRuta"
      titulo="Eliminar ruta"
      descripcion="La ruta se eliminara y sus pedidos volveran a pendiente si aun no tiene historial operativo."
      textoConfirm="Eliminar"
      textoCancel="Cancelar"
      :detalles="{ Ruta: ruta?.numero, Trabajador: ruta?.domiciliario?.nombre }"
      advertencia="Para rutas en entrega, liquidacion o liquidadas usa anular/cerrar segun corresponda."
      @confirm="eliminarRuta"
      @cancel="modalEliminarRuta?.close()"
    />
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '~/utils/formats'
import {
  ArrowLeft,
  Ban,
  ClipboardList,
  PackageCheck,
  Trash2,
  Truck,
} from 'lucide-vue-next'
definePageMeta({ middleware: 'auth' })

type Accion = {
  valor: string
  label: string
  hint?: string
  variant?: 'danger'
  icon: typeof PackageCheck
}

const TRANSICIONES: Record<string, Accion[]> = {
  CREADA: [
    {
      valor: 'CARGADA',
      label: 'Carga lista',
      hint: 'Confirma que el pedido físico va en el vehículo.',
      icon: PackageCheck,
    },
    { valor: 'ANULADA', label: 'Anular ruta', variant: 'danger', icon: Ban },
  ],
  CARGADA: [
    {
      valor: 'EN_ENTREGA',
      label: 'Salir a entregar',
      hint: 'Bloquea cambios de pedidos en esta ruta.',
      icon: Truck,
    },
    { valor: 'ANULADA', label: 'Anular ruta', variant: 'danger', icon: Ban },
  ],
  EN_ENTREGA: [
    {
      valor: 'EN_LIQUIDACION',
      label: 'Fin de entrega',
      hint: 'Volviste a base. Después abrí el panel de liquidación para registrar cobros.',
      icon: ClipboardList,
    },
  ],
}

const route = useRoute()
const router = useRouter()
const api = useApi()
const notify = useNotification()
const apiResponse = useApiResponse()

const id = computed(() => Number(route.params.id))

const loading = ref(true)
const loadError = ref('')
const ruta = ref<any>(null)

const pedidosSeleccionados = ref<number[]>([])
const agregandoPedidos = ref(false)
const pedidosPendientes = ref<any[]>([])
const loadingPendientes = ref(false)
const modalAnulaConfirm = ref()
const modalEliminarRuta = ref()
const navegandoLiquidacion = ref(false)
const deleting = ref(false)

const puedeEditarPedidos = computed(() =>
  ['CREADA', 'CARGADA'].includes(ruta.value?.estado ?? ''),
)

const acciones = computed(() => {
  const e = ruta.value?.estado
  if (!e || e === 'EN_LIQUIDACION' || e === 'LIQUIDADA' || e === 'ANULADA') return []
  return TRANSICIONES[e] ?? []
})

async function fetchRuta() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await api.get(`/operaciones/rutas/${id.value}`)
    ruta.value = apiResponse.unwrap(res)
    pedidosSeleccionados.value = []
    await fetchPedidosPendientes()
  } catch {
    loadError.value = 'No se pudo cargar la ruta.'
    ruta.value = null
  } finally {
    loading.value = false
  }
}

async function fetchPedidosPendientes() {
  if (!ruta.value || !puedeEditarPedidos.value) {
    pedidosPendientes.value = []
    return
  }
  loadingPendientes.value = true
  try {
    const res = await api.get('/operaciones/pedidos', {
      params: { estado: 'PENDIENTE', limit: 200 },
    })
    const d = apiResponse.unwrap(res) as any
    const lista = d.items ?? d.data ?? []
    const usados = new Set<number>((ruta.value.itemsRuta ?? []).map((i: any) => i.pedidoId))
    pedidosPendientes.value = (Array.isArray(lista) ? lista : []).filter((p: any) => !usados.has(p.id))
  } catch {
    pedidosPendientes.value = []
    notify.error('No se pudieron cargar pedidos pendientes')
  } finally {
    loadingPendientes.value = false
  }
}

watch(id, () => fetchRuta())

async function agregarPedidosSeleccionados() {
  if (!pedidosSeleccionados.value.length || !ruta.value) return
  agregandoPedidos.value = true
  try {
    let orden = (ruta.value.itemsRuta?.length ?? 0) + 1
    for (const pedidoId of pedidosSeleccionados.value) {
      await api.post(`/operaciones/rutas/${ruta.value.id}/pedidos`, {
        pedidoId,
        ordenEntrega: orden++,
      })
    }
    notify.success(`${pedidosSeleccionados.value.length} pedido(s) agregado(s)`)
    pedidosSeleccionados.value = []
    await fetchRuta()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al agregar pedidos')
  } finally {
    agregandoPedidos.value = false
  }
}

async function quitarPedido(pedidoId: number) {
  if (!ruta.value) return
  try {
    await api.delete(`/operaciones/rutas/${ruta.value.id}/pedidos/${pedidoId}`)
    notify.success('Pedido removido')
    await fetchRuta()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al quitar pedido')
  }
}

function cambiarEstadoRuta(estadoNuevo: string) {
  if (estadoNuevo === 'ANULADA') modalAnulaConfirm.value?.open()
  else procederCambioEstado(estadoNuevo)
}

async function procederAnular() {
  modalAnulaConfirm.value?.close()
  await procederCambioEstado('ANULADA')
}

async function procederCambioEstado(estadoNuevo: string) {
  if (!ruta.value) return
  try {
    await api.patch(`/operaciones/rutas/${ruta.value.id}/estado`, { estado: estadoNuevo })
    notify.success('Estado actualizado')
    await fetchRuta()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al cambiar estado')
  }
}

async function abrirLiquidacion() {
  if (!ruta.value || navegandoLiquidacion.value) return
  navegandoLiquidacion.value = true
  await router.push(`/rutas/${ruta.value.id}/liquidacion`)
}

async function eliminarRuta() {
  if (!ruta.value) return
  deleting.value = true
  try {
    await api.delete(`/operaciones/rutas/${ruta.value.id}`)
    notify.success(`Ruta ${ruta.value.numero} eliminada`)
    modalEliminarRuta.value?.close()
    await router.push('/rutas')
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'No se pudo eliminar la ruta')
    modalEliminarRuta.value?.close()
  } finally {
    deleting.value = false
  }
}

onMounted(fetchRuta)
</script>
