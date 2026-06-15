import { describe, expect, it } from 'vitest'
import { useExcepcionesEntrega } from '~/composables/useExcepcionesEntrega'

describe('useExcepcionesEntrega', () => {
  it('obliga razon al marcar no entregado', () => {
    const { marcarNoEntregado } = useExcepcionesEntrega()

    const resultado = marcarNoEntregado(1, '')

    expect(resultado.exitoso).toBe(false)
  })

  it('marca no entregado con razon valida', () => {
    const { cargarItems, marcarNoEntregado, itemsRuta } = useExcepcionesEntrega()

    cargarItems([
      { id: 1, pedidoId: 10, numero: 'PED-001', cliente: 'Cliente', estado: 'PENDIENTE' },
    ])

    const resultado = marcarNoEntregado(1, 'CLIENTE_NO_DISPONIBLE')

    expect(resultado.exitoso).toBe(true)
    expect(itemsRuta.value[0].fueEntregado).toBe(false)
    expect(itemsRuta.value[0].razonFallo).toBe('CLIENTE_NO_DISPONIBLE')
  })

  it('valida entrega sin razon cuando fue entregado', () => {
    const { validarEstadoEntrega } = useExcepcionesEntrega()

    const resultado = validarEstadoEntrega(1, true)

    expect(resultado.valido).toBe(true)
  })
})
