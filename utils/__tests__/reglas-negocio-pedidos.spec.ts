import { describe, expect, it } from 'vitest'
import { filtrarPedidosPorTexto, ordenarPedidosAscendente } from '~/utils/reglas-negocio'

describe('ordenarPedidosAscendente', () => {
  it('ordena numericamente ascendente', () => {
    const pedidos = [{ numero: 'PED-010' }, { numero: 'PED-002' }, { numero: 'PED-003' }]
    const ordenados = ordenarPedidosAscendente(pedidos)

    expect(ordenados.map((p) => p.numero)).toEqual(['PED-002', 'PED-003', 'PED-010'])
  })

  it('acepta getter personalizado', () => {
    const items = [{ pedido: { numero: '003' } }, { pedido: { numero: '001' } }]
    const ordenados = ordenarPedidosAscendente(items, (item) => item.pedido.numero)

    expect(ordenados.map((i) => i.pedido.numero)).toEqual(['001', '003'])
  })
})

describe('filtrarPedidosPorTexto', () => {
  const pedidos = [
    { numero: 'PED-001', clienteNombre: 'Tienda El Juampa' },
    { numero: 'PED-002', clienteNombre: 'Bodega Central' },
  ]

  it('filtra por numero de pedido', () => {
    const resultado = filtrarPedidosPorTexto(pedidos, '002')
    expect(resultado).toHaveLength(1)
    expect(resultado[0].numero).toBe('PED-002')
  })

  it('filtra por nombre de cliente sin acentos', () => {
    const resultado = filtrarPedidosPorTexto(pedidos, 'juanpa')
    expect(resultado).toHaveLength(1)
    expect(resultado[0].clienteNombre).toBe('Tienda El Juampa')
  })

  it('devuelve todos cuando la busqueda esta vacia', () => {
    expect(filtrarPedidosPorTexto(pedidos, '')).toHaveLength(2)
    expect(filtrarPedidosPorTexto(pedidos, '   ')).toHaveLength(2)
  })
})
