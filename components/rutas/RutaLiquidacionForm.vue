<template>
  <div class="space-y-4">
    <div class="border rounded-lg p-3 bg-gray-50">
      <div class="flex items-center justify-between gap-3 mb-3">
        <h3 class="text-sm font-semibold text-gray-700">Estado de entrega por pedido</h3>
        <span class="text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded-full px-2 py-1">
          {{ ctx.liqForm.pedidos.length }} pedidos
        </span>
      </div>
      <div class="space-y-2">
        <div v-for="p in ctx.liqForm.pedidos" :key="p.pedidoId" class="p-3 bg-white rounded-lg border border-gray-200 space-y-3">
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
                <span class="truncate">{{ d.productoNombre }} · {{ d.cantidad }} x ${{ Number(d.precioUnitario).toLocaleString('es-CO') }}</span>
                <span class="font-medium text-gray-700">${{ Number(d.subtotal).toLocaleString('es-CO') }}</span>
              </div>
            </div>
            <p v-else class="text-xs text-gray-400">Sin detalle de productos.</p>
          </div>

          <select v-model="p.estadoEntrega" class="form-input text-sm py-2" @change="ctx.onCambioEstadoEntrega(p)">
            <option value="ENTREGADO_PAGADO">Entregado y cobrado</option>
            <option value="ENTREGADO_CREDITO">Entregado a crédito</option>
            <option value="NO_ENTREGADO">No entregado</option>
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

          <p v-if="p.estadoEntrega === 'ENTREGADO_PAGADO'" class="text-xs text-gray-500">
            Pagado: <strong>${{ ctx.montoPagadoPedido(p).toLocaleString('es-CO') }}</strong>
            · A cartera: <strong class="text-orange-600">${{ ctx.carteraPedido(p).toLocaleString('es-CO') }}</strong>
          </p>

          <div v-if="p.estadoEntrega === 'ENTREGADO_PAGADO'" class="pt-1">
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
              :class="ctx.estadoPagoPedidoClass(p)"
            >
              {{ ctx.estadoPagoPedidoLabel(p) }}
            </span>
          </div>
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
        <p class="text-gray-500">Total crédito</p>
        <p class="font-semibold text-orange-700">${{ numEs(ctx.totalCarteraCalculado) }}</p>
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
    </div>

    <div class="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-3">
      <FormField label="Gastos de ruta ($)">
        <input v-model.number="ctx.liqForm.gastosRuta" class="form-input" type="number" min="0" step="1" @blur="useMoneyInput().handleMoneyBlur" />
      </FormField>
      <FormField label="Notas">
        <textarea v-model="ctx.liqForm.notas" rows="2" class="form-input resize-none" />
      </FormField>
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <button class="btn-primary inline-flex items-center gap-2" :disabled="saving" @click="$emit('confirm')">
        {{ saving ? 'Guardando…' : 'Registrar liquidación' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toValue } from 'vue'
import { useRutaLiquidacion } from '~/composables/useRutaLiquidacion'
import { useMoneyInput } from '~/composables/useMoneyInput'

defineProps<{
  saving: boolean
  ctx: ReturnType<typeof useRutaLiquidacion>
}>()

defineEmits<{
  confirm: []
}>()

function numEs(v: unknown) {
  return Number(toValue(v)).toLocaleString('es-CO')
}
</script>
