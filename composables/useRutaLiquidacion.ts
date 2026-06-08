import { reactive, computed } from 'vue'
import { formatCurrency } from '~/utils/formats'
import type { AxiosInstance } from 'axios'

export type LiqPedidoForm = {
  pedidoId: number
  numero: string
  clienteNombre: string
  montoPedido: number
  detalles: {
    productoNombre: string
    cantidad: number
    precioUnitario: number
    subtotal: number
  }[]
  estadoEntrega:
    | 'ENTREGADO_PAGADO'
    | 'ENTREGADO_CREDITO'
    | 'REPROGRAMAR'
    | 'NO_ENTREGADO'
    | 'CANCELAR'
  tipoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'AMBOS'
  montoEfectivo: number
  montoTransferencia: number
}

function toNumberOrZero(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const SALDO_MINIMO_CARTERA = 50

export function useRutaLiquidacion() {
  const liqForm = reactive({
    gastosRuta: 0,
    notas: '',
    pedidos: [] as LiqPedidoForm[],
  })

  function montoPagadoPedido(p: LiqPedidoForm): number {
    if (p.estadoEntrega !== 'ENTREGADO_PAGADO') return 0
    const totalPedido = toNumberOrZero(p.montoPedido)
    const efectivo = toNumberOrZero(p.montoEfectivo)
    const transferencia = toNumberOrZero(p.montoTransferencia)

    if (p.tipoPago === 'EFECTIVO') return Math.min(totalPedido, efectivo)
    if (p.tipoPago === 'TRANSFERENCIA') return Math.min(totalPedido, transferencia)
    return Math.min(totalPedido, efectivo + transferencia)
  }

  function carteraPedido(p: LiqPedidoForm): number {
    const totalPedido = toNumberOrZero(p.montoPedido)
    if (!pedidoEntregado(p)) return 0
    if (p.estadoEntrega === 'ENTREGADO_CREDITO') return totalPedido
    return Math.max(0, totalPedido - montoPagadoPedido(p))
  }

  function estadoPagoPedidoLabel(p: LiqPedidoForm): string {
    const cartera = carteraPedido(p)
    if (cartera <= 0) return 'Pagado completo'
    return `Parcial, pasa ${formatCurrency(cartera)} a cartera`
  }

  function estadoPagoPedidoClass(p: LiqPedidoForm): string {
    return carteraPedido(p) <= 0
      ? 'bg-green-100 text-green-700'
      : 'bg-orange-100 text-orange-700'
  }

  function onCambioEstadoEntrega(p: LiqPedidoForm) {
    if (p.estadoEntrega === 'ENTREGADO_CREDITO') {
      p.tipoPago = 'EFECTIVO'
      p.montoEfectivo = 0
      p.montoTransferencia = 0
      return
    }

    if (!pedidoEntregado(p)) {
      p.tipoPago = 'EFECTIVO'
      p.montoEfectivo = 0
      p.montoTransferencia = 0
      return
    }

    p.tipoPago = p.tipoPago ?? 'EFECTIVO'
    if (p.tipoPago === 'EFECTIVO') {
      p.montoEfectivo = toNumberOrZero(p.montoEfectivo) || toNumberOrZero(p.montoPedido)
      p.montoTransferencia = 0
    }
    if (p.tipoPago === 'TRANSFERENCIA') {
      p.montoTransferencia = toNumberOrZero(p.montoTransferencia) || toNumberOrZero(p.montoPedido)
      p.montoEfectivo = 0
    }
  }

  function onCambioTipoPago(p: LiqPedidoForm) {
    if (p.tipoPago === 'EFECTIVO') {
      p.montoEfectivo = toNumberOrZero(p.montoPedido)
      p.montoTransferencia = 0
      return
    }
    if (p.tipoPago === 'TRANSFERENCIA') {
      p.montoTransferencia = toNumberOrZero(p.montoPedido)
      p.montoEfectivo = 0
      return
    }
    p.montoEfectivo = toNumberOrZero(p.montoEfectivo)
    p.montoTransferencia = toNumberOrZero(p.montoTransferencia)
  }

  const totalPedidosRutaCalculado = computed(() =>
    liqForm.pedidos.reduce((acc, p) => acc + Number(p.montoPedido || 0), 0),
  )

  const totalCarteraCalculado = computed(() =>
    liqForm.pedidos.reduce((acc, p) => acc + carteraPedido(p), 0),
  )

  const totalEfectivoCalculado = computed(() =>
    liqForm.pedidos.reduce((acc, p) => {
      if (p.estadoEntrega !== 'ENTREGADO_PAGADO') return acc
      if (p.tipoPago === 'TRANSFERENCIA') return acc
      return acc + Math.max(0, toNumberOrZero(p.montoEfectivo))
    }, 0),
  )

  const totalTransferenciaCalculado = computed(() =>
    liqForm.pedidos.reduce((acc, p) => {
      if (p.estadoEntrega !== 'ENTREGADO_PAGADO') return acc
      if (p.tipoPago === 'EFECTIVO') return acc
      return acc + Math.max(0, toNumberOrZero(p.montoTransferencia))
    }, 0),
  )

  const totalRecibidoCalculado = computed(
    () => totalEfectivoCalculado.value + totalTransferenciaCalculado.value,
  )

  const totalEntregadoCalculado = computed(() =>
    liqForm.pedidos
      .filter((p) => pedidoEntregado(p))
      .reduce((acc, p) => acc + Number(p.montoPedido || 0), 0),
  )

  const totalNoEntregadoCalculado = computed(() =>
    liqForm.pedidos
      .filter((p) => !pedidoEntregado(p))
      .reduce((acc, p) => acc + Number(p.montoPedido || 0), 0),
  )

  const pedidosEntregados = computed(() =>
    liqForm.pedidos.filter((p) => pedidoEntregado(p)),
  )

  const pedidosReprogramados = computed(() =>
    liqForm.pedidos.filter((p) => p.estadoEntrega === 'REPROGRAMAR'),
  )

  const pedidosNoEntregadosFinal = computed(() =>
    liqForm.pedidos.filter((p) => p.estadoEntrega === 'NO_ENTREGADO'),
  )

  const pedidosCancelados = computed(() =>
    liqForm.pedidos.filter((p) => p.estadoEntrega === 'CANCELAR'),
  )

  function pedidoEntregado(p: LiqPedidoForm): boolean {
    return p.estadoEntrega === 'ENTREGADO_PAGADO' || p.estadoEntrega === 'ENTREGADO_CREDITO'
  }

  function productosResumen(p: LiqPedidoForm): string {
    if (!p.detalles.length) return 'Sin productos'
    const base = p.detalles
      .slice(0, 2)
      .map((d) => `${d.productoNombre} x${toNumberOrZero(d.cantidad)}`)
      .join(', ')
    const restantes = p.detalles.length - 2
    return restantes > 0 ? `${base} +${restantes}` : base
  }

  function estadoEntregaLabel(p: LiqPedidoForm): string {
    if (p.estadoEntrega === 'ENTREGADO_PAGADO') return 'Entregado y cobrado'
    if (p.estadoEntrega === 'ENTREGADO_CREDITO') return 'Entregado a credito'
    if (p.estadoEntrega === 'REPROGRAMAR') return 'Reprogramar'
    if (p.estadoEntrega === 'CANCELAR') return 'Cancelar'
    return 'No entregado final'
  }

  function noEntregadoAccion(p: LiqPedidoForm) {
    if (p.estadoEntrega === 'REPROGRAMAR') return 'REPROGRAMAR'
    if (p.estadoEntrega === 'CANCELAR') return 'CANCELAR'
    return 'NO_ENTREGADO'
  }

  function resetFromItemsRuta(itemsRuta: any[]) {
    liqForm.gastosRuta = 0
    liqForm.notas = ''
    liqForm.pedidos = (itemsRuta ?? []).map((item: any) => ({
      pedidoId: item.pedidoId,
      numero: item.pedido?.numero || `Pedido ${item.pedidoId}`,
      clienteNombre: item.pedido?.cliente?.nombre || 'Cliente no disponible',
      montoPedido: Number(
        (item.pedido?.detalles ?? []).reduce(
          (acc: number, det: any) => acc + Number(det?.subtotal ?? 0),
          0,
        ),
      ),
      detalles: (item.pedido?.detalles ?? []).map((det: any) => ({
        productoNombre: det?.producto?.nombre || `Producto ${det?.productoId ?? ''}`,
        cantidad: Number(det?.cantidad ?? 0),
        precioUnitario: Number(det?.precioUnitario ?? 0),
        subtotal: Number(det?.subtotal ?? 0),
      })),
      estadoEntrega:
        item.pedido?.estado === 'NO_ENTREGADO' ? 'NO_ENTREGADO' : 'ENTREGADO_PAGADO',
      tipoPago: 'EFECTIVO' as const,
      montoEfectivo: Number(
        (item.pedido?.detalles ?? []).reduce(
          (acc: number, det: any) => acc + Number(det?.subtotal ?? 0),
          0,
        ),
      ),
      montoTransferencia: 0,
    }))
  }

  async function submitLiquidacion(
    api: AxiosInstance,
    rutaId: number,
    notify: { success: (msg: string) => void; error: (msg: string) => void },
  ): Promise<boolean> {
    const pedidoExcedido = liqForm.pedidos.find((p) => {
      if (p.estadoEntrega !== 'ENTREGADO_PAGADO') return false
      return montoPagadoPedido(p) > toNumberOrZero(p.montoPedido)
    })
    if (pedidoExcedido) {
      notify.error(`El pago del pedido ${pedidoExcedido.numero} no puede superar su total`)
      return false
    }
    const pedidoSaldoMinimo = liqForm.pedidos.find((p) => {
      if (p.estadoEntrega !== 'ENTREGADO_PAGADO') return false
      const saldo = carteraPedido(p)
      return saldo > 0 && saldo < SALDO_MINIMO_CARTERA
    })
    if (pedidoSaldoMinimo) {
      notify.error(
        `El pedido ${pedidoSaldoMinimo.numero} queda con un saldo muy bajo (${formatCurrency(carteraPedido(pedidoSaldoMinimo))}). Ajusta el pago o pasalo a credito.`,
      )
      return false
    }

    const efectivoRecibido = toNumberOrZero(totalEfectivoCalculado.value)
    const transferenciaRecibida = toNumberOrZero(totalTransferenciaCalculado.value)
    const totalRecibido = toNumberOrZero(totalRecibidoCalculado.value)
    const totalCartera = toNumberOrZero(totalCarteraCalculado.value)
    const totalEntregado = toNumberOrZero(totalEntregadoCalculado.value)
    const diferencia = Number((totalEntregado - totalRecibido - totalCartera).toFixed(2))

    const partesObs = [
      efectivoRecibido > 0 ? `Efectivo: ${efectivoRecibido}` : '',
      transferenciaRecibida > 0 ? `Transferencia: ${transferenciaRecibida}` : '',
      totalCartera > 0 ? `Cartera: ${totalCartera}` : '',
      toNumberOrZero(liqForm.gastosRuta) > 0 ? `Gastos de ruta: ${toNumberOrZero(liqForm.gastosRuta)}` : '',
      liqForm.notas?.trim(),
    ]
      .filter(Boolean)
      .join(' | ')

    await api.post(`/operaciones/rutas/${rutaId}/liquidar`, {
      totalEntregado,
      totalRecaudado: totalRecibido,
      totalCartera,
      diferencia,
      efectivoRecibido,
      transferenciaRecibida,
      observaciones: partesObs || undefined,
      pedidos: liqForm.pedidos.map((p) => ({
        pedidoId: p.pedidoId,
        entregado: pedidoEntregado(p),
        noEntregadoAccion: pedidoEntregado(p) ? undefined : noEntregadoAccion(p),
        aCredito: p.estadoEntrega === 'ENTREGADO_CREDITO',
        tipoPago: p.estadoEntrega === 'ENTREGADO_PAGADO' ? p.tipoPago : undefined,
        montoEfectivo: p.estadoEntrega === 'ENTREGADO_PAGADO' ? toNumberOrZero(p.montoEfectivo) : 0,
        montoTransferencia:
          p.estadoEntrega === 'ENTREGADO_PAGADO' ? toNumberOrZero(p.montoTransferencia) : 0,
      })),
    })
    notify.success('Ruta liquidada')
    return true
  }

  return {
    liqForm,
    montoPagadoPedido,
    carteraPedido,
    estadoPagoPedidoLabel,
    estadoPagoPedidoClass,
    onCambioEstadoEntrega,
    onCambioTipoPago,
    totalPedidosRutaCalculado,
    totalCarteraCalculado,
    totalEfectivoCalculado,
    totalTransferenciaCalculado,
    totalRecibidoCalculado,
    totalEntregadoCalculado,
    totalNoEntregadoCalculado,
    pedidosEntregados,
    pedidosReprogramados,
    pedidosNoEntregadosFinal,
    pedidosCancelados,
    pedidoEntregado,
    productosResumen,
    estadoEntregaLabel,
    resetFromItemsRuta,
    submitLiquidacion,
    toNumberOrZero,
  }
}
