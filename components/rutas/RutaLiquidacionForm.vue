<template>
  <div class="space-y-4">
    <div class="border rounded-lg p-3 bg-gray-50">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-3">
        <h3 class="text-sm font-semibold text-gray-700">Estado de entrega por pedido</h3>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            v-model="busquedaPedidos"
            class="form-input text-sm py-2 sm:w-64"
            type="search"
            placeholder="Buscar por pedido o cliente..."
            autocomplete="off"
          />
          <span class="text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded-full px-2 py-1 whitespace-nowrap">
            {{ pedidosVisibles.length }} / {{ ctx.liqForm.pedidos.length }} pedidos
          </span>
        </div>
      </div>

      <p
        v-if="busquedaPedidos.trim() && !pedidosVisibles.length"
        class="mb-3 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800"
      >
        Sin coincidencias para "{{ busquedaPedidos.trim() }}".
      </p>

      <div class="space-y-2">
        <div v-for="p in pedidosVisibles" :key="p.pedidoId" class="p-3 bg-white rounded-lg border border-gray-200 space-y-3">
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-700 truncate">{{ p.numero }}</p>
              <p class="text-xs text-gray-500 truncate">Cliente: {{ p.clienteNombre }}</p>
            </div>
            <span class="text-xs text-gray-500">${{ Number(p.montoPedido || 0).toLocaleString('es-CO') }}</span>
          </div>

          <div class="rounded-md border border-gray-100 bg-gray-50 p-2">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Desglose</p>
            <div v-if="p.detalles.length" class="space-y-1">
              <div
                v-for="(d, idx) in p.detalles"
                :key="`${p.pedidoId}-${idx}`"
                class="text-xs text-gray-600 flex items-center justify-between gap-2"
              >
                <span class="truncate">{{ d.productoNombre }} - {{ d.cantidad }} x ${{ Number(d.precioUnitario).toLocaleString('es-CO') }}</span>
                <span class="font-medium text-gray-700">${{ Number(d.subtotal).toLocaleString('es-CO') }}</span>
              </div>
            </div>
            <p v-else class="text-xs text-gray-400">Sin detalle de productos.</p>
          </div>

          <select v-model="p.estadoEntrega" class="form-input text-sm py-2" @change="ctx.onCambioEstadoEntrega(p)">
            <option value="ENTREGADO_PAGADO">Entregado y cobrado</option>
            <option value="ENTREGADO_CREDITO">Entregado a credito</option>
            <option value="REPROGRAMAR">Reprogramar para proxima ruta</option>
            <option value="NO_ENTREGADO">No entregado final</option>
            <option value="CANCELAR">Cancelar pedido</option>
            <option value="DEVUELTO">Devuelto</option>
          </select>

          <div v-if="p.estadoEntrega === 'ENTREGADO_PAGADO'" class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select v-model="p.tipoPago" class="form-input text-sm" @change="ctx.onCambioTipoPago(p)">
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="AMBOS">Ambos</option>
            </select>

            <input
              v-if="p.tipoPago === 'EFECTIVO' || p.tipoPago === 'AMBOS'"
              v-model.number="p.montoEfectivo"
              class="form-input text-sm"
              type="number"
              min="0"
              step="1"
              placeholder="Monto efectivo"
              @blur="useMoneyInput().handleMoneyBlur"
            />

            <input
              v-if="p.tipoPago === 'TRANSFERENCIA' || p.tipoPago === 'AMBOS'"
              v-model.number="p.montoTransferencia"
              class="form-input text-sm"
              type="number"
              min="0"
              step="1"
              placeholder="Monto transferencia"
              @blur="useMoneyInput().handleMoneyBlur"
            />
          </div>

          <div v-if="p.estadoEntrega === 'ENTREGADO_PAGADO' && ctx.estadoPagoPedidoLabel(p) !== 'Pagado completo'" class="text-xs text-orange-700">
            {{ ctx.estadoPagoPedidoLabel(p) }}
          </div>

          <div v-if="!ctx.pedidoEntregado(p)" class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <FormField v-if="p.estadoEntrega === 'REPROGRAMAR'" label="Fecha reprogramada *">
              <input
                v-model="p.fechaReprogramacion"
                class="form-input text-sm"
                type="date"
                :min="todayISOLocal()"
              />
            </FormField>

            <FormField :label="p.estadoEntrega === 'REPROGRAMAR' ? 'Motivo reprogramacion *' : p.estadoEntrega === 'DEVUELTO' ? 'Motivo del devuelto *' : 'Motivo no entrega'">
              <input
                v-model="p.razonNoEntrega"
                class="form-input text-sm"
                type="text"
                :placeholder="p.estadoEntrega === 'REPROGRAMAR' ? 'Ej. cliente pide entregar en otra fecha' : p.estadoEntrega === 'DEVUELTO' ? 'Ej. producto dañado' : 'Ej. cliente no recibe hoy'"
              />
            </FormField>

            <FormField v-if="p.estadoEntrega === 'REPROGRAMAR'" label="Detalle adicional">
              <input
                v-model="p.razonReprogramacion"
                class="form-input text-sm"
                type="text"
                placeholder="Ej. entregar en la manana"
              />
            </FormField>

            <FormField label="Observaciones">
              <input
                v-model="p.observaciones"
                class="form-input text-sm"
                type="text"
              />
            </FormField>
          </div>

          <p v-if="p.estadoEntrega === 'ENTREGADO_PAGADO'" class="text-xs text-gray-500">
            Pagado: <strong>${{ ctx.montoPagadoPedido(p).toLocaleString('es-CO') }}</strong>
            - A cartera: <strong class="text-orange-600">${{ ctx.carteraPedido(p).toLocaleString('es-CO') }}</strong>
          </p>

          <div v-if="p.estadoEntrega === 'ENTREGADO_PAGADO'" class="pt-1">
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
              :class="ctx.estadoPagoPedidoClass(p)"
            >
              {{ ctx.estadoPagoPedidoLabel(p) }}
            </span>
          </div>

          <p v-if="p.estadoEntrega === 'REPROGRAMAR'" class="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
            No genera venta, caja ni cartera. Queda reprogramado y disponible para que el administrador lo suba a una ruta cuando corresponda (hoy o despues).
          </p>
          <p v-if="p.estadoEntrega === 'NO_ENTREGADO'" class="rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
            No genera venta ni descuenta inventario. Queda registrado como no entregado y disponible para otra ruta.
          </p>
          <p v-if="p.estadoEntrega === 'CANCELAR'" class="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
            No genera venta ni descuenta inventario. El pedido queda cancelado.
          </p>
          <p v-if="p.estadoEntrega === 'DEVUELTO'" class="rounded-md border border-purple-100 bg-purple-50 px-3 py-2 text-xs text-purple-700">
            El pedido se marca como devuelto y se retira de la ruta actual. Puede ser re-asignado a otra ruta si es necesario.
          </p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <p class="text-gray-500">Total pedidos ruta</p>
        <p class="font-semibold text-gray-700">${{ numEs(ctx.totalPedidosRutaCalculado) }}</p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <p class="text-gray-500">Total entregado</p>
        <p class="font-semibold text-green-700">${{ numEs(ctx.totalEntregadoCalculado) }}</p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <p class="text-gray-500">Total credito</p>
        <p class="font-semibold text-orange-700">${{ numEs(ctx.totalCarteraCalculado) }}</p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <p class="text-gray-500">Gastos ruta</p>
        <p class="font-semibold text-red-700">${{ numEs(ctx.liqForm.gastosRuta) }}</p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <p class="text-gray-500">Efectivo reportado</p>
        <p class="font-semibold text-gray-700">${{ numEs(ctx.totalEfectivoCalculado) }}</p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <p class="text-gray-500">Transferencia reportada</p>
        <p class="font-semibold text-gray-700">${{ numEs(ctx.totalTransferenciaCalculado) }}</p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <p class="text-gray-500">Total no entregado</p>
        <p class="font-semibold text-rose-700">${{ numEs(ctx.totalNoEntregadoCalculado) }}</p>
      </div>
    </div>

    <div class="rounded-lg border border-gray-200 bg-white p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
      <p class="text-gray-600">Total recibido: <strong class="text-gray-900">${{ numEs(ctx.totalRecibidoCalculado) }}</strong></p>
      <p class="text-orange-600">Total cartera: <strong>${{ numEs(ctx.totalCarteraCalculado) }}</strong></p>
      <p class="text-red-600">Gastos ruta: <strong>${{ numEs(ctx.liqForm.gastosRuta) }}</strong></p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-3">
      <FormField label="Gastos de ruta ($)">
        <input v-model.number="ctx.liqForm.gastosRuta" class="form-input" type="number" min="0" step="1" @blur="useMoneyInput().handleMoneyBlur" />
      </FormField>
      <FormField :label="Number(ctx.liqForm.gastosRuta || 0) > 0 ? 'Nota del gasto *' : 'Notas'">
        <textarea
          v-model="ctx.liqForm.notas"
          rows="2"
          class="form-input resize-none"
          :placeholder="Number(ctx.liqForm.gastosRuta || 0) > 0 ? 'Detalle el motivo del egreso de esta ruta' : ''"
        />
      </FormField>
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <button class="btn-primary inline-flex items-center gap-2" :disabled="saving" @click="openReview">
        {{ saving ? 'Guardando...' : 'Revisar liquidacion' }}
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="showReview"
        class="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 p-0 sm:items-center sm:p-4"
        @click.self="showReview = false"
      >
        <div class="flex w-full max-w-5xl flex-col overflow-hidden rounded-none bg-white shadow-xl sm:max-h-[92vh] sm:rounded-lg">
          <div class="border-b border-gray-200 bg-gray-50 p-4 sm:p-5">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p class="text-xs font-bold uppercase text-gray-400">Revision final</p>
                <h3 class="text-lg font-bold text-gray-900">Confirmar liquidacion de ruta</h3>
                <p class="mt-1 text-sm text-gray-600">
                  Esta accion puede crear ventas, pagos, cartera, movimientos de caja e inventario.
                </p>
              </div>
              <button class="rounded-lg px-3 py-1 text-sm text-gray-500 hover:bg-white" @click="showReview = false">
                Cerrar
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-4 sm:p-5">
            <div class="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 lg:grid-cols-7">
              <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p class="text-gray-500">Entregado</p>
                <p class="font-semibold text-green-700">${{ numEs(ctx.totalEntregadoCalculado) }}</p>
              </div>
              <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p class="text-gray-500">Efectivo</p>
                <p class="font-semibold text-gray-900">${{ numEs(ctx.totalEfectivoCalculado) }}</p>
              </div>
              <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p class="text-gray-500">Transferencia</p>
                <p class="font-semibold text-gray-900">${{ numEs(ctx.totalTransferenciaCalculado) }}</p>
              </div>
              <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p class="text-gray-500">Cartera</p>
                <p class="font-semibold text-orange-700">${{ numEs(ctx.totalCarteraCalculado) }}</p>
              </div>
              <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p class="text-gray-500">Gastos ruta</p>
                <p class="font-semibold text-red-700">${{ numEs(ctx.liqForm.gastosRuta) }}</p>
              </div>
              <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p class="text-gray-500">No entregado</p>
                <p class="font-semibold text-rose-700">${{ numEs(ctx.totalNoEntregadoCalculado) }}</p>
              </div>
              <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p class="text-gray-500">Reprogramados</p>
                <p class="font-semibold text-blue-700">{{ ctx.pedidosReprogramados.value.length }}</p>
              </div>
            </div>

            <div class="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Revise productos y valores antes de confirmar. Los reprogramados no generan caja ni cartera hasta entregarse.
            </div>

            <div class="mt-4 overflow-hidden rounded-lg border border-gray-200">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th class="px-3 py-2 font-medium">Pedido</th>
                    <th class="px-3 py-2 font-medium">Cliente</th>
                    <th class="px-3 py-2 font-medium">Productos</th>
                    <th class="px-3 py-2 font-medium">Decision</th>
                    <th class="px-3 py-2 text-right font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in pedidosOrdenados" :key="`review-${p.pedidoId}`" class="border-t border-gray-100">
                    <td class="px-3 py-2 font-medium text-gray-800">{{ p.numero }}</td>
                    <td class="px-3 py-2 text-gray-600">{{ p.clienteNombre }}</td>
                    <td class="px-3 py-2 text-gray-600">{{ ctx.productosResumen(p) }}</td>
                    <td class="px-3 py-2">
                      <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                        {{ ctx.estadoEntregaLabel(p) }}
                      </span>
                      <p v-if="p.estadoEntrega === 'REPROGRAMAR'" class="mt-1 text-xs text-gray-500">
                        {{ p.fechaReprogramacion }}
                      </p>
                    </td>
                    <td class="px-3 py-2 text-right font-semibold text-gray-800">${{ numEs(p.montoPedido) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="flex flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 p-4 sm:flex-row sm:justify-end">
            <button class="btn-secondary" :disabled="saving" @click="showReview = false">
              Volver a editar
            </button>
            <button
              class="btn-primary"
              :disabled="saving"
              @click="showReview = false; $emit('confirm')"
            >
              {{ saving ? 'Liquidando...' : 'Confirmar y liquidar ruta' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toValue } from 'vue'
import { useRutaLiquidacion } from '~/composables/useRutaLiquidacion'
import { useMoneyInput } from '~/composables/useMoneyInput'
import { todayISO, todayISOLocal } from '~/utils/formats'

const props = defineProps<{
  saving: boolean
  ctx: ReturnType<typeof useRutaLiquidacion>
}>()

defineEmits<{
  confirm: []
}>()

const showReview = ref(false)
const notify = useNotification()

const pedidosVisibles = computed(() => toValue(props.ctx.pedidosVisibles))
const pedidosOrdenados = computed(() => toValue(props.ctx.pedidosOrdenados))
const busquedaPedidos = computed({
  get: () => props.ctx.busquedaPedidos.value,
  set: (value: string) => {
    props.ctx.busquedaPedidos.value = value
  },
})

function openReview() {
  if (Number(props.ctx.liqForm.gastosRuta || 0) > 0 && !props.ctx.liqForm.notas?.trim()) {
    notify.error('La nota del gasto de ruta es obligatoria cuando registras un gasto.')
    return
  }
  const reprogramadoSinFecha = props.ctx.liqForm.pedidos.find(
    (p) => p.estadoEntrega === 'REPROGRAMAR' && !p.fechaReprogramacion,
  )
  if (reprogramadoSinFecha) {
    notify.error(`Selecciona la fecha de reprogramacion para ${reprogramadoSinFecha.numero}`)
    return
  }
  const reprogramadoSinMotivo = props.ctx.liqForm.pedidos.find(
    (p) => p.estadoEntrega === 'REPROGRAMAR' && !(p.razonReprogramacion || p.razonNoEntrega).trim(),
  )
  if (reprogramadoSinMotivo) {
    notify.error(`Indica el motivo de reprogramacion para ${reprogramadoSinMotivo.numero}`)
    return
  }
  showReview.value = true
}

function numEs(v: unknown) {
  return Number(toValue(v)).toLocaleString('es-CO')
}
</script>
