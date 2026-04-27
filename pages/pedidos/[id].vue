<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <!-- Back -->
    <NuxtLink to="/pedidos" class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
      ← Volver a pedidos
    </NuxtLink>

    <!-- Loading -->
    <div v-if="loading" class="card flex items-center justify-center h-40 text-gray-400">
      Cargando…
    </div>

    <template v-else-if="pedido">
      <!-- Header -->
      <div class="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold text-gray-800">{{ pedido.numeroPedido ?? pedido.numero ?? `Pedido #${pedido.id}` }}</h1>
          <p class="text-sm text-gray-500 mt-0.5">{{ pedido.cliente?.nombre ?? '—' }}</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-300 text-green-700 hover:bg-green-50 text-sm font-medium transition-colors"
            @click="imprimirPedido(pedido)"
          >
            <Printer :size="15" /> Imprimir ticket
          </button>
          <EstadoBadge :estado="pedido.estado" />
        </div>
      </div>

      <!-- Info -->
      <div class="card grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <p class="text-gray-500">Fecha</p>
          <p class="font-medium">{{ formatDate(pedido.fechaPedido ?? pedido.fecha) }}</p>
        </div>
        <div>
          <p class="text-gray-500">Total</p>
          <p class="font-medium">{{ formatCurrency(pedido.totalPedido ?? totalPedido) }}</p>
        </div>
        <div v-if="pedido.observaciones">
          <p class="text-gray-500">Observaciones</p>
          <p class="font-medium">{{ pedido.observaciones }}</p>
        </div>
      </div>

      <!-- Detalles -->
      <div class="card">
        <h2 class="font-semibold text-gray-700 mb-3">Productos</h2>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 border-b border-gray-100">
              <th class="pb-2 font-medium">Producto</th>
              <th class="pb-2 font-medium text-center">Cant.</th>
              <th class="pb-2 font-medium text-right">Precio</th>
              <th class="pb-2 font-medium text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="d in pedido.detalles"
              :key="d.id"
              class="border-b border-gray-50 last:border-0"
            >
              <td class="py-2">{{ d.producto?.nombre ?? d.productoId }}</td>
              <td class="py-2 text-center">{{ d.cantidad }}</td>
              <td class="py-2 text-right">{{ formatCurrency(d.precioUnitario) }}</td>
              <td class="py-2 text-right">{{ formatCurrency(d.subtotal) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Panel ir a rutas (solo cuando está PENDIENTE) -->
      <div v-if="pedido.estado === 'PENDIENTE'" class="card border-l-4 border-blue-400 bg-blue-50">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p class="font-semibold text-blue-800 text-sm">Este pedido está pendiente de cargarse</p>
            <p class="text-xs text-blue-600 mt-0.5">Para asignarlo a una ruta, hazlo desde la sección de Rutas. Ahí podrás ver todos los pedidos pendientes y cargarlos de una vez.</p>
          </div>
          <NuxtLink to="/rutas" class="btn-primary whitespace-nowrap flex items-center gap-1 justify-center">
            → Ir a Rutas
          </NuxtLink>
        </div>
      </div>

      <!-- Cambio de estado -->
      <div class="card" v-if="transicionesDisponibles.length">
        <h2 class="font-semibold text-gray-700 mb-3">Cambiar estado</h2>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="t in transicionesDisponibles"
            :key="t.valor"
            class="btn-primary"
            :class="t.color"
            @click="abrirModalEstado(t.valor)"
          >
            {{ t.label }}
          </button>
        </div>
      </div>
    </template>

    <div v-else class="card text-center text-gray-400 py-12">Pedido no encontrado.</div>

    <!-- Modal cambio estado -->
    <div
      v-if="modalEstado"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="modalEstado = false"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h3 class="font-bold text-gray-800">Cambiar a: {{ estadoDestino }}</h3>

        <FormField label="Notas (opcional)">
          <textarea v-model="estadoNotas" rows="3" class="form-input resize-none" />
        </FormField>

        <div v-if="['NO_ENTREGADO', 'REPROGRAMADO', 'CANCELADO'].includes(estadoDestino)">
          <FormField :label="estadoDestino === 'CANCELADO' ? 'Motivo de cancelacion' : 'Motivo de no entrega'">
            <input v-model="motivoNoEntrega" class="form-input" />
          </FormField>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button class="btn-secondary" @click="modalEstado = false">Cancelar</button>
          <button class="btn-primary" :disabled="saving" @click="confirmarCambioEstado">
            {{ saving ? 'Guardando…' : 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Confirmación Cancelación -->
    <ModalConfirmacion
      ref="modalCancelConfirm"
      titulo="¿Cancelar este pedido?"
      descripcion="Una vez cancelado, el pedido no podrá ser entregado. Esta acción no puede deshacerse."
      textoConfirm="Sí, cancelar"
      textoCancel="Volver atrás"
      :detalles="{ Pedido: pedido?.numero, Cliente: pedido?.cliente?.nombre }"
      advertencia="Se requiere motivo de cancelación."
      @confirm="procederCancelar"
      @cancel="modalCancelConfirm?.close()"
    />
  </div>
</template>

<script setup lang="ts">
import { formatCurrency, formatDate } from '~/utils/formats'
import { X, Printer } from 'lucide-vue-next'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const api = useApi()
const notify = useNotification()
const apiResponse = useApiResponse()
const { imprimirPedido } = usePrintTicket()

const loading = ref(true)
const pedido = ref<any>(null)
const saving = ref(false)
const modalEstado = ref(false)
const estadoDestino = ref('')
const estadoNotas = ref('')
const motivoNoEntrega = ref('')
const modalCancelConfirm = ref()

const TRANSICIONES: Record<string, { valor: string; label: string; color?: string }[]> = {
  PENDIENTE: [
    { valor: 'CANCELADO', label: 'Cancelar pedido', color: 'bg-red-600 hover:bg-red-700' },
  ],
  CARGADO_EN_RUTA: [
    { valor: 'ENTREGADO', label: 'Marcar entregado', color: 'bg-green-600 hover:bg-green-700' },
    { valor: 'NO_ENTREGADO', label: 'No entregado' },
    { valor: 'REPROGRAMADO', label: 'Reprogramar' },
    { valor: 'DEVUELTO', label: 'Marcar devuelto' },
  ],
  NO_ENTREGADO: [
    { valor: 'PENDIENTE', label: 'Re-poner pendiente' },
    { valor: 'CANCELADO', label: 'Cancelar' },
  ],
  REPROGRAMADO: [
    { valor: 'PENDIENTE', label: 'Re-poner pendiente' },
    { valor: 'CANCELADO', label: 'Cancelar' },
  ],
}

const transicionesDisponibles = computed(() =>
  pedido.value ? (TRANSICIONES[pedido.value.estado] ?? []) : []
)

const totalPedido = computed(() => {
  if (!Array.isArray(pedido.value?.detalles)) return 0
  return pedido.value.detalles.reduce((acc: number, d: any) => {
    const subtotal = Number(d?.subtotal ?? 0)
    if (subtotal > 0) return acc + subtotal
    return acc + Number(d?.cantidad ?? 0) * Number(d?.precioUnitario ?? 0)
  }, 0)
})

async function fetchPedido() {
  loading.value = true
  try {
    const res = await api.get(`/operaciones/pedidos/${route.params.id}`)
    pedido.value = apiResponse.unwrap(res)
  } catch {
    notify.error('No se pudo cargar el pedido')
  } finally {
    loading.value = false
  }
}

function abrirModalEstado(estado: string) {
  if (estado === 'CANCELADO') {
    // Si es cancelar, primero abre modal de confirmación
    modalCancelConfirm.value?.open()
    estadoDestino.value = estado
    estadoNotas.value = ''
    motivoNoEntrega.value = ''
  } else {
    // Otros cambios de estado van directo
    estadoDestino.value = estado
    estadoNotas.value = ''
    motivoNoEntrega.value = ''
    modalEstado.value = true
  }
}

function procederCancelar() {
  // Una vez confirmado en modal de confirmación, abre el modal de estado
  modalCancelConfirm.value?.close()
  modalEstado.value = true
}

async function confirmarCambioEstado() {
  if (estadoDestino.value === 'CANCELADO' && !motivoNoEntrega.value.trim()) {
    notify.error('Debes indicar el motivo de cancelacion')
    return
  }
  if (estadoDestino.value === 'REPROGRAMADO' && !motivoNoEntrega.value.trim()) {
    notify.error('Debes indicar el motivo de reprogramacion')
    return
  }

  saving.value = true
  try {
    const payload: Record<string, any> = { estado: estadoDestino.value }
    if (estadoNotas.value) payload.observaciones = estadoNotas.value
    if (motivoNoEntrega.value && estadoDestino.value === 'REPROGRAMADO') {
      payload.razonReprogramacion = motivoNoEntrega.value
    }
    if (motivoNoEntrega.value && estadoDestino.value === 'NO_ENTREGADO') {
      payload.observaciones = [estadoNotas.value, `Motivo no entrega: ${motivoNoEntrega.value}`]
        .filter(Boolean)
        .join(' | ')
    }
    if (motivoNoEntrega.value && estadoDestino.value === 'CANCELADO') {
      payload.razonCancelacion = motivoNoEntrega.value
    }
    await api.patch(`/operaciones/pedidos/${pedido.value.id}/estado`, payload)
    notify.success('Estado actualizado')
    modalEstado.value = false
    await fetchPedido()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al cambiar estado')
  } finally {
    saving.value = false
  }
}

onMounted(fetchPedido)
</script>
