<template>
  <div class="mx-auto max-w-5xl space-y-6">
    <template v-if="isEditing">
      <NuxtPage />
    </template>

      <button type="button" class="btn-secondary inline-flex items-center gap-2" @click="navigateTo('/pedidos')">
        <ArrowLeft class="h-4 w-4" />
        Volver a pedidos
      </button>

      <div v-if="loading" class="card flex h-40 items-center justify-center text-gray-400">
        Cargando...
      </div>

      <template v-else-if="pedido">
        <div class="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-3">
            <h1 class="truncate text-xl font-bold text-gray-800">{{ pedido.numeroPedido ?? pedido.numero ?? `Pedido #${pedido.id}` }}</h1>
            <EstadoBadge :estado="pedido.estado" />
          </div>
          <p class="mt-1 text-sm text-gray-500">{{ pedido.cliente?.nombre ?? 'Sin cliente' }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <NuxtLink
            v-if="puedeEditarPedido"
            :to="`/pedidos/${pedido.id}/edit`"
            class="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50"
          >
            <Pencil :size="15" /> Editar
          </NuxtLink>
          <button
            class="inline-flex items-center gap-1.5 rounded-lg border border-green-300 px-3 py-1.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-50"
            @click="imprimirPedido(pedido)"
          >
            <Printer :size="15" /> Imprimir
          </button>
          <button
            class="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-40"
            :disabled="deleting"
            @click="modalEliminarPedido?.open()"
          >
            <Trash2 :size="15" /> Eliminar
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div class="card space-y-4">
          <h2 class="font-semibold text-gray-700">Informacion del despacho</h2>
          <div class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div class="rounded-lg bg-gray-50 p-3">
              <p class="text-gray-500">Cliente</p>
              <p class="font-semibold text-gray-900">{{ pedido.cliente?.nombre ?? '-' }}</p>
            </div>
            <div class="rounded-lg bg-gray-50 p-3">
              <p class="text-gray-500">Trabajador</p>
              <p class="font-semibold text-gray-900">{{ pedido.trabajador?.nombre ?? '-' }}</p>
            </div>
            <div class="rounded-lg bg-gray-50 p-3">
              <p class="flex items-center gap-1.5 text-gray-500"><Phone class="h-4 w-4" /> Telefono</p>
              <p class="font-semibold text-gray-900">{{ telefonoPedido }}</p>
            </div>
            <div class="rounded-lg bg-gray-50 p-3">
              <p class="flex items-center gap-1.5 text-gray-500"><MapPin class="h-4 w-4" /> Direccion</p>
              <p class="font-semibold text-gray-900">{{ direccionPedido }}</p>
            </div>
            <div class="rounded-lg bg-gray-50 p-3">
              <p class="text-gray-500">Fecha</p>
              <p class="font-semibold text-gray-900">{{ formatDate(pedido.fechaPedido ?? pedido.fecha) }}</p>
            </div>
            <div class="rounded-lg bg-gray-50 p-3">
              <p class="text-gray-500">Total</p>
              <p class="font-semibold text-gray-900">{{ formatCurrency(pedido.totalPedido ?? totalPedido) }}</p>
            </div>
          </div>
          <div v-if="pedido.observaciones" class="rounded-lg border border-gray-100 p-3 text-sm">
            <p class="text-gray-500">Observaciones</p>
            <p class="mt-1 text-gray-800">{{ pedido.observaciones }}</p>
          </div>
        </div>

        <aside v-if="pedido.estado === 'PENDIENTE'" class="card h-fit border-blue-100 bg-blue-50/60">
          <p class="font-semibold text-blue-900">Pendiente de ruta</p>
          <p class="mt-1 text-sm text-blue-700">Asignalo desde Rutas cuando este listo para cargar.</p>
          <NuxtLink to="/rutas" class="btn-primary mt-4 flex justify-center">Ir a rutas</NuxtLink>
        </aside>

        <aside v-else-if="pedido.estado === 'REPROGRAMADO'" class="card h-fit border-purple-100 bg-purple-50/60">
          <p class="font-semibold text-purple-900">Reprogramado</p>
          <p class="mt-1 text-sm text-purple-700">
            Nueva fecha: {{ formatDate(pedido.fechaReprogramacion ?? pedido.fecha) }}
          </p>
          <p v-if="pedido.razonReprogramacion" class="mt-2 text-sm text-purple-700">
            {{ pedido.razonReprogramacion }}
          </p>
          <NuxtLink to="/rutas" class="btn-primary mt-4 flex justify-center">Asignar a ruta</NuxtLink>
        </aside>

        <aside v-else-if="pedido.estado === 'NO_ENTREGADO'" class="card h-fit border-orange-100 bg-orange-50/60">
          <p class="font-semibold text-orange-900">No entregado</p>
          <p class="mt-1 text-sm text-orange-700">Puede cargarse nuevamente a una ruta.</p>
          <NuxtLink to="/rutas" class="btn-primary mt-4 flex justify-center">Asignar a ruta</NuxtLink>
        </aside>
      </div>

      <div class="card overflow-x-auto p-0">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b text-xs uppercase text-gray-500">
              <th class="px-4 py-3 font-medium">Producto</th>
              <th class="px-4 py-3 font-medium">Cant.</th>
              <th class="px-4 py-3 font-medium">Precio</th>
              <th class="px-4 py-3 font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in pedido.detalles" :key="d.id" class="border-b border-gray-50 last:border-0">
              <td class="px-4 py-3 text-left font-medium text-gray-800">
                <div>{{ d.producto?.nombre ?? d.productoId }}</div>
                <ProductUnitBadge
                  v-if="d.producto"
                  :categoria="d.producto.categoria"
                  :unidad="d.producto.unidad"
                  class="mt-1"
                />
              </td>
              <td class="px-4 py-3">{{ d.cantidad }}</td>
              <td class="px-4 py-3 text-right">{{ formatCurrency(d.precioUnitario) }}</td>
              <td class="px-4 py-3 text-right font-semibold">{{ formatCurrency(d.subtotal) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="transicionesDisponibles.length" class="card">
        <h2 class="mb-3 font-semibold text-gray-700">Cambiar estado</h2>
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

      <div v-else class="card py-12 text-center text-gray-400">Pedido no encontrado.</div>

      <div
        v-if="modalEstado"
        class="fixed inset-0 z-50 flex items-stretch justify-center bg-black/40 p-0 sm:items-center sm:p-4"
        @click.self="modalEstado = false"
      >
        <div class="max-h-[100dvh] w-full max-w-md space-y-4 overflow-y-auto rounded-none bg-white p-4 shadow-xl sm:max-h-[90vh] sm:rounded-lg sm:p-6">
          <h3 class="font-bold text-gray-800">Cambiar a: {{ estadoDestino }}</h3>

          <FormField label="Notas (opcional)">
            <textarea v-model="estadoNotas" rows="3" class="form-input resize-none" />
          </FormField>

          <div v-if="['NO_ENTREGADO', 'REPROGRAMADO', 'CANCELADO'].includes(estadoDestino)">
            <FormField :label="estadoDestino === 'CANCELADO' ? 'Motivo de cancelacion' : 'Motivo de no entrega'">
              <input v-model="motivoNoEntrega" class="form-input" />
            </FormField>
          </div>

          <div v-if="estadoDestino === 'REPROGRAMADO'">
            <FormField label="Fecha reprogramada *">
              <input v-model="fechaReprogramacion" type="date" class="form-input" :min="todayISOLocal()" />
            </FormField>
          </div>

          <div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button class="btn-secondary" @click="modalEstado = false">Cancelar</button>
            <button class="btn-primary" :disabled="saving" @click="confirmarCambioEstado">
              {{ saving ? 'Guardando...' : 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>

      <ModalConfirmacion
        ref="modalCancelConfirm"
        titulo="Cancelar este pedido"
        descripcion="Una vez cancelado, el pedido no podra ser entregado."
        textoConfirm="Si, cancelar"
        textoCancel="Volver"
        :detalles="{ Pedido: pedido?.numero, Cliente: pedido?.cliente?.nombre }"
        advertencia="Se requiere motivo de cancelacion."
        @confirm="procederCancelar"
        @cancel="modalCancelConfirm?.close()"
      />

      <ModalConfirmacion
        ref="modalEliminarPedido"
        titulo="Eliminar pedido"
        descripcion="El pedido se eliminara definitivamente si aun no tiene venta ni historial operativo."
        textoConfirm="Eliminar"
        textoCancel="Cancelar"
        :detalles="{ Pedido: pedido?.numero, Cliente: pedido?.cliente?.nombre }"
        advertencia="Para pedidos ya entregados o facturados usa cancelar/anular segun corresponda."
        @confirm="eliminarPedido"
        @cancel="modalEliminarPedido?.close()"
      />
    </template>

    <div v-else class="card py-12 text-center text-gray-400">Pedido no encontrado.</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { formatCurrency, formatDate, todayISO, todayISOLocal } from '~/utils/formats'
import { ArrowLeft, MapPin, Pencil, Phone, Printer, Trash2 } from 'lucide-vue-next'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const isEditing = computed(() => route.path.endsWith('/edit'))
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
const fechaReprogramacion = ref(todayISOLocal())
const modalCancelConfirm = ref()
const modalEliminarPedido = ref()
const deleting = ref(false)

const TRANSICIONES: Record<string, { valor: string; label: string; color?: string }[]> = {
  PENDIENTE: [
    { valor: 'REPROGRAMADO', label: 'Reprogramar' },
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
    { valor: 'REPROGRAMADO', label: 'Reprogramar' },
    { valor: 'CANCELADO', label: 'Cancelar' },
  ],
  REPROGRAMADO: [
    { valor: 'PENDIENTE', label: 'Re-poner pendiente' },
    { valor: 'REPROGRAMADO', label: 'Cambiar fecha' },
    { valor: 'CANCELADO', label: 'Cancelar' },
  ],
}

const transicionesDisponibles = computed(() =>
  pedido.value ? (TRANSICIONES[pedido.value.estado] ?? []) : [],
)

const puedeEditarPedido = computed(() =>
  pedido.value ? ['PENDIENTE', 'CARGADO_EN_RUTA'].includes(pedido.value.estado) : false,
)

const totalPedido = computed(() => {
  if (!Array.isArray(pedido.value?.detalles)) return 0
  return pedido.value.detalles.reduce((acc: number, d: any) => {
    const subtotal = Number(d?.subtotal ?? 0)
    if (subtotal > 0) return acc + subtotal
    return acc + Number(d?.cantidad ?? 0) * Number(d?.precioUnitario ?? 0)
  }, 0)
})

const direccionPedido = computed(() =>
  pedido.value?.cliente?.direccion || pedido.value?.direccionEntrega || pedido.value?.direccion || 'Sin direccion registrada',
)

const telefonoPedido = computed(() =>
  pedido.value?.cliente?.telefono || pedido.value?.cliente?.celular || 'Sin telefono',
)

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
  estadoDestino.value = estado
  estadoNotas.value = ''
  motivoNoEntrega.value = ''
  fechaReprogramacion.value = todayISOLocal()
  if (estado === 'CANCELADO') modalCancelConfirm.value?.open()
  else modalEstado.value = true
}

function procederCancelar() {
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
  if (estadoDestino.value === 'REPROGRAMADO' && !fechaReprogramacion.value) {
    notify.error('Debes indicar la fecha de reprogramacion')
    return
  }

  saving.value = true
  try {
    const payload: Record<string, any> = { estado: estadoDestino.value }
    if (estadoNotas.value) payload.observaciones = estadoNotas.value
    if (motivoNoEntrega.value && estadoDestino.value === 'REPROGRAMADO') {
      payload.razonReprogramacion = motivoNoEntrega.value
      payload.fechaReprogramacion = fechaReprogramacion.value
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

async function eliminarPedido() {
  if (!pedido.value) return
  deleting.value = true
  try {
    await api.delete(`/operaciones/pedidos/${pedido.value.id}`)
    notify.success(`Pedido ${pedido.value.numero} eliminado`)
    modalEliminarPedido.value?.close()
    await navigateTo('/pedidos')
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'No se pudo eliminar el pedido')
    modalEliminarPedido.value?.close()
  } finally {
    deleting.value = false
  }
}

onMounted(fetchPedido)
</script>
