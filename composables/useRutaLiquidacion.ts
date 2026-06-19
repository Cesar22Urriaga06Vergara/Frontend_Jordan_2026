import { reactive, computed, ref, watch } from 'vue'
import { formatCurrency } from '~/utils/formats'
import { filtrarPedidosPorTexto, ordenarPedidosAscendente } from '~/utils/reglas-negocio'
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
    | 'DEVUELTO'
  tipoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'AMBOS'
  montoEfectivo: number
  montoTransferencia: number
  razonNoEntrega: string
  razonReprogramacion: string
  fechaReprogramacion: string
  observaciones: string
}

function toNumberOrZero(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const SALDO_MINIMO_CARTERA = 50

function localISO(date = new Date()): string {
  // Ajustar por UTC-5 para obtener la fecha operacional correcta
  const utc5Time = new Date(date.getTime() - 5 * 60 * 60 * 1000)
  const y = utc5Time.getUTCFullYear()
  const m = String(utc5Time.getUTCMonth() + 1).padStart(2, '0')
  const d = String(utc5Time.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDaysISO(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return localISO(date)
}

export function useRutaLiquidacion() {
  const liqForm = reactive({
    gastosRuta: 0,
    notas: '',
    pedidos: [] as LiqPedidoForm[],
  })
  const busquedaPedidos = ref('')
  const draftKey = ref<string | null>(null)

  const pedidosOrdenados = computed(() => ordenarPedidosAscendente(liqForm.pedidos))

  const pedidosVisibles = computed(() =>
    filtrarPedidosPorTexto(
      pedidosOrdenados.value,
      busquedaPedidos.value,
      (p) => p.numero,
      (p) => p.clienteNombre,
    ),
  )

  function montoPagadoPedido(p: LiqPedidoForm): number {
    if (p.estadoEntrega !== 'ENTREGADO_PAGADO') return 0
    const totalPedido = toNumberOrZero(p.montoPedido)
    const efectivo = toNumberOrZero(p.montoEfectivo)
    const transferencia = toNumberOrZero(p.montoTransferencia)

    if (p.tipoPago === 'EFECTIVO') return Math.min(totalPedido, efectivo)
    if (p.tipoPago === 'TRANSFERENCIA') return Math.min(totalPedido, transferencia)
    return Math.min(totalPedido, efectivo + transferencia)
  }

  function montoPagadoInput(p: LiqPedidoForm): number {
    if (p.estadoEntrega !== 'ENTREGADO_PAGADO') return 0
    const efectivo = toNumberOrZero(p.montoEfectivo)
    const transferencia = toNumberOrZero(p.montoTransferencia)
    return efectivo + transferencia
  }

  function isPagoMixtoInvalido(p: LiqPedidoForm): boolean {
    return (
      p.estadoEntrega === 'ENTREGADO_PAGADO' &&
      p.tipoPago === 'AMBOS' &&
      (toNumberOrZero(p.montoEfectivo) <= 0 || toNumberOrZero(p.montoTransferencia) <= 0)
    )
  }

  function carteraPedido(p: LiqPedidoForm): number {
    const totalPedido = toNumberOrZero(p.montoPedido)
    if (!pedidoEntregado(p)) return 0
    if (p.estadoEntrega === 'ENTREGADO_CREDITO') return totalPedido
    return Math.max(0, totalPedido - montoPagadoPedido(p))
  }

  function estadoPagoPedidoLabel(p: LiqPedidoForm): string {
    const cartera = carteraPedido(p)
    if (p.estadoEntrega === 'ENTREGADO_CREDITO') return 'A credito completo'
    if (cartera <= 0) return 'Pagado completo'
    return `Parcial, pasa ${formatCurrency(cartera)} a cartera`
  }

  function estadoPagoPedidoClass(p: LiqPedidoForm): string {
    if (p.estadoEntrega === 'ENTREGADO_CREDITO') return 'bg-yellow-100 text-yellow-800'
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
      if (p.estadoEntrega === 'REPROGRAMAR' && !p.fechaReprogramacion) {
        p.fechaReprogramacion = localISO()
      }
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
    if (p.estadoEntrega === 'ENTREGADO_PAGADO') {
      return carteraPedido(p) > 0 ? 'Entregado parcialmente cobrado' : 'Entregado y cobrado'
    }
    if (p.estadoEntrega === 'ENTREGADO_CREDITO') return 'Entregado a credito'
    if (p.estadoEntrega === 'REPROGRAMAR') return 'Reprogramar'
    if (p.estadoEntrega === 'CANCELAR') return 'Cancelar'
    if (p.estadoEntrega === 'DEVUELTO') return 'Devuelto'
    return 'No entregado final'
  }

  function noEntregadoAccion(p: LiqPedidoForm) {
    if (p.estadoEntrega === 'REPROGRAMAR') return 'REPROGRAMAR'
    if (p.estadoEntrega === 'CANCELAR') return 'CANCELAR'
    if (p.estadoEntrega === 'DEVUELTO') return 'DEVUELTO'
    return 'NO_ENTREGADO'
  }

  function resetFromItemsRuta(itemsRuta: any[]) {
    liqForm.gastosRuta = 0
    liqForm.notas = ''
    busquedaPedidos.value = ''
    liqForm.pedidos = ordenarPedidosAscendente(
      (itemsRuta ?? []).map((item: any) => ({
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
      razonNoEntrega: '',
      razonReprogramacion: '',
      fechaReprogramacion: localISO(),
      observaciones: '',
    })),
      (item) => item.numero,
    )
  }

  function getDraftKey(rutaId: number) {
    return `ruta-liquidacion-draft-${rutaId}`
  }

  function saveDraft() {
    if (!draftKey.value || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(draftKey.value, JSON.stringify({
        gastosRuta: liqForm.gastosRuta,
        notas: liqForm.notas,
        pedidos: liqForm.pedidos,
      }))
    } catch (error) {
      console.warn('Error saving liquidacion draft:', error)
    }
  }

  function clearDraft() {
    if (!draftKey.value || typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(draftKey.value)
    } catch (error) {
      console.warn('Error clearing liquidacion draft:', error)
    }
  }

  function loadDraft(rutaId: number): boolean {
    if (typeof window === 'undefined') return false
    const key = getDraftKey(rutaId)
    draftKey.value = key

    try {
      const stored = window.localStorage.getItem(key)
      if (!stored) {
        return false
      }

      const parsed = JSON.parse(stored)
      if (!parsed || !Array.isArray(parsed.pedidos)) {
        return false
      }

      liqForm.gastosRuta = Number(parsed.gastosRuta ?? 0)
      liqForm.notas = String(parsed.notas ?? '')
      busquedaPedidos.value = ''
      liqForm.pedidos = ordenarPedidosAscendente(parsed.pedidos)
      return true
    } catch (error) {
      console.warn('Error loading liquidacion draft:', error)
      return false
    }
  }

  function loadFromRuta(itemsRuta: any[], rutaId: number): boolean {
    if (loadDraft(rutaId)) {
      return true
    }
    draftKey.value = getDraftKey(rutaId)
    resetFromItemsRuta(itemsRuta)
    return false
  }

  watch(
    () => ({ gastosRuta: liqForm.gastosRuta, notas: liqForm.notas, pedidos: liqForm.pedidos }),
    saveDraft,
    { deep: true },
  )

  function disposeDraftListener() {
    draftKey.value = null
  }

  async function submitLiquidacion(
    api: AxiosInstance,
    rutaId: number,
    notify: { success: (msg: string) => void; error: (msg: string) => void },
  ): Promise<boolean> {
    const pedidoExcedido = liqForm.pedidos.find((p) => {
      if (p.estadoEntrega !== 'ENTREGADO_PAGADO') return false
      const totalPedido = toNumberOrZero(p.montoPedido)
      const montoInput = montoPagadoInput(p)
      return montoInput > totalPedido
    })
    if (pedidoExcedido) {
      notify.error(`El pago del pedido ${pedidoExcedido.numero} no puede superar su total`)
      return false
    }

    const pedidoPagoMixtoInvalido = liqForm.pedidos.find((p) => isPagoMixtoInvalido(p))
    if (pedidoPagoMixtoInvalido) {
      notify.error(
        `El pedido ${pedidoPagoMixtoInvalido.numero} requiere montos positivos en efectivo y transferencia para pago mixto.`,
      )
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
    const gastosRuta = toNumberOrZero(liqForm.gastosRuta)
    const notaGastoRuta = liqForm.notas?.trim() ?? ''

    if (gastosRuta > 0 && !notaGastoRuta) {
      notify.error('La nota del gasto de ruta es obligatoria cuando registras un gasto.')
      return false
    }

    const pedidoReprogramadoSinFecha = liqForm.pedidos.find(
      (p) => p.estadoEntrega === 'REPROGRAMAR' && !p.fechaReprogramacion,
    )
    if (pedidoReprogramadoSinFecha) {
      notify.error(`Selecciona la fecha de reprogramacion para ${pedidoReprogramadoSinFecha.numero}`)
      return false
    }

    const pedidoReprogramadoSinMotivo = liqForm.pedidos.find(
      (p) =>
        p.estadoEntrega === 'REPROGRAMAR' &&
        !(p.razonReprogramacion || p.razonNoEntrega).trim(),
    )
    if (pedidoReprogramadoSinMotivo) {
      notify.error(`Indica el motivo de reprogramacion para ${pedidoReprogramadoSinMotivo.numero}`)
      return false
    }

    const partesObs = [
      efectivoRecibido > 0 ? `Efectivo: ${efectivoRecibido}` : '',
      transferenciaRecibida > 0 ? `Transferencia: ${transferenciaRecibida}` : '',
      totalCartera > 0 ? `Cartera: ${totalCartera}` : '',
      gastosRuta > 0 ? `Gastos de ruta: ${gastosRuta}` : '',
      gastosRuta > 0 ? `Nota gasto ruta: ${notaGastoRuta}` : notaGastoRuta,
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
      gastosRuta,
      observaciones: partesObs || undefined,
      pedidos: liqForm.pedidos.map((p) => ({
        pedidoId: p.pedidoId,
        entregado: pedidoEntregado(p),
        noEntregadoAccion: pedidoEntregado(p) ? undefined : noEntregadoAccion(p),
        razonNoEntrega: !pedidoEntregado(p) ? p.razonNoEntrega?.trim() || undefined : undefined,
        razonReprogramacion:
          p.estadoEntrega === 'REPROGRAMAR'
            ? (p.razonReprogramacion || p.razonNoEntrega).trim() || undefined
            : undefined,
        fechaReprogramacion:
          p.estadoEntrega === 'REPROGRAMAR' ? p.fechaReprogramacion : undefined,
        observaciones: !pedidoEntregado(p) ? p.observaciones?.trim() || undefined : undefined,
        aCredito: p.estadoEntrega === 'ENTREGADO_CREDITO',
        tipoPago: p.estadoEntrega === 'ENTREGADO_PAGADO' ? p.tipoPago : undefined,
        montoEfectivo: p.estadoEntrega === 'ENTREGADO_PAGADO' ? toNumberOrZero(p.montoEfectivo) : 0,
        montoTransferencia:
          p.estadoEntrega === 'ENTREGADO_PAGADO' ? toNumberOrZero(p.montoTransferencia) : 0,
      })),
    })
    clearDraft()
    notify.success('Ruta liquidada')
    return true
  }

  return {
    liqForm,
    busquedaPedidos,
    pedidosOrdenados,
    pedidosVisibles,
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
    loadFromRuta,
    submitLiquidacion,
    toNumberOrZero,
  }
}
