import { describe, expect, it } from 'vitest'
import { useRutaLiquidacion } from '~/composables/useRutaLiquidacion'

describe('useRutaLiquidacion', () => {
  it('ordena pedidos al cargar la ruta', () => {
    const { resetFromItemsRuta, liqForm } = useRutaLiquidacion()

    resetFromItemsRuta([
      {
        pedidoId: 3,
        pedido: {
          numero: 'PED-010',
          cliente: { nombre: 'Cliente C' },
          detalles: [{ subtotal: 100, producto: { nombre: 'Agua' }, cantidad: 1, precioUnitario: 100 }],
        },
      },
      {
        pedidoId: 1,
        pedido: {
          numero: 'PED-002',
          cliente: { nombre: 'Cliente A' },
          detalles: [{ subtotal: 50, producto: { nombre: 'Agua' }, cantidad: 1, precioUnitario: 50 }],
        },
      },
    ])

    expect(liqForm.pedidos.map((p) => p.numero)).toEqual(['PED-002', 'PED-010'])
  })

  it('filtra pedidos visibles por cliente', () => {
    const { resetFromItemsRuta, busquedaPedidos, pedidosVisibles } = useRutaLiquidacion()

    resetFromItemsRuta([
      {
        pedidoId: 1,
        pedido: {
          numero: 'PED-001',
          cliente: { nombre: 'Tienda El Juampa' },
          detalles: [{ subtotal: 10, producto: { nombre: 'Agua' }, cantidad: 1, precioUnitario: 10 }],
        },
      },
      {
        pedidoId: 2,
        pedido: {
          numero: 'PED-002',
          cliente: { nombre: 'Otro Cliente' },
          detalles: [{ subtotal: 20, producto: { nombre: 'Agua' }, cantidad: 1, precioUnitario: 20 }],
        },
      },
    ])

    busquedaPedidos.value = 'juanpa'
    expect(pedidosVisibles.value).toHaveLength(1)
    expect(pedidosVisibles.value[0].clienteNombre).toBe('Tienda El Juampa')
  })

  it('calcula pagos mixtos y muestra estado parcial en pedidos entregados', () => {
    const ctx = useRutaLiquidacion()
    const { resetFromItemsRuta, montoPagadoPedido, carteraPedido, estadoPagoPedidoLabel, estadoEntregaLabel } = ctx

    resetFromItemsRuta([
      {
        pedidoId: 1,
        pedido: {
          numero: 'PED-003',
          cliente: { nombre: 'Cliente M' },
          detalles: [{ subtotal: 100, producto: { nombre: 'Agua' }, cantidad: 1, precioUnitario: 100 }],
        },
      },
    ])

    const formPedido = ctx.liqForm.pedidos[0]
    formPedido.estadoEntrega = 'ENTREGADO_PAGADO'
    formPedido.tipoPago = 'AMBOS'
    formPedido.montoEfectivo = 40
    formPedido.montoTransferencia = 50

    expect(montoPagadoPedido(formPedido)).toBe(90)
    expect(carteraPedido(formPedido)).toBe(10)
    expect(estadoPagoPedidoLabel(formPedido)).toContain('Parcial')
    expect(estadoEntregaLabel(formPedido)).toBe('Entregado parcialmente cobrado')
  })

  it('ignora borradores antiguos de liquidación cuando los pedidos de ruta cambian', () => {
    const rutaId = 123
    const draftKey = `ruta-liquidacion-draft-${rutaId}`
    const staleDraft = {
      gastosRuta: 0,
      notas: '',
      pedidos: [
        {
          pedidoId: 1,
          numero: 'PED-001',
          clienteNombre: 'Cliente A',
          montoPedido: 100,
          detalles: [],
          estadoEntrega: 'ENTREGADO_PAGADO',
          tipoPago: 'EFECTIVO',
          montoEfectivo: 100,
          montoTransferencia: 0,
          razonNoEntrega: '',
          razonReprogramacion: '',
          fechaReprogramacion: '2026-06-20',
          observaciones: '',
        },
        {
          pedidoId: 2,
          numero: 'PED-002',
          clienteNombre: 'Cliente B',
          montoPedido: 50,
          detalles: [],
          estadoEntrega: 'ENTREGADO_PAGADO',
          tipoPago: 'EFECTIVO',
          montoEfectivo: 50,
          montoTransferencia: 0,
          razonNoEntrega: '',
          razonReprogramacion: '',
          fechaReprogramacion: '2026-06-20',
          observaciones: '',
        },
      ],
    }

    window.localStorage.setItem(draftKey, JSON.stringify(staleDraft))

    const ctx = useRutaLiquidacion()
    const loaded = ctx.loadFromRuta(
      [
        {
          pedidoId: 1,
          pedido: {
            numero: 'PED-001',
            cliente: { nombre: 'Cliente A' },
            detalles: [{ subtotal: 100, producto: { nombre: 'Agua' }, cantidad: 1, precioUnitario: 100 }],
          },
        },
      ],
      rutaId,
    )

    expect(loaded).toBe(false)
    expect(ctx.liqForm.pedidos).toHaveLength(1)
    expect(ctx.liqForm.pedidos[0].pedidoId).toBe(1)
    expect(window.localStorage.getItem(draftKey)).toBeNull()
  })
})
