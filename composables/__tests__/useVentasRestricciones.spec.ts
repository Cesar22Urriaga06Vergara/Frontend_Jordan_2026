import { describe, expect, it } from 'vitest'
import { useVentasRestricciones } from '~/composables/useVentasRestricciones'

describe('useVentasRestricciones', () => {
  it('bloquea edicion en ventas consolidadas', () => {
    const { cargarVenta, estaBloqueada, puedeEditar, accionesDisponibles } =
      useVentasRestricciones()

    cargarVenta({
      id: 1,
      numero: 'VEN-001',
      estado: 'LIQUIDADA',
      totalVenta: 1000,
    })

    expect(estaBloqueada.value).toBe(true)
    expect(puedeEditar.value).toBe(false)
    expect(accionesDisponibles.value).toMatchObject({
      editar: false,
      generarNotaCredito: true,
    })
  })

  it('permite editar ventas pendientes', () => {
    const { cargarVenta, puedeEditar, puedeEliminar } = useVentasRestricciones()

    cargarVenta({
      id: 2,
      numero: 'VEN-002',
      estado: 'PENDIENTE',
      totalVenta: 500,
    })

    expect(puedeEditar.value).toBe(true)
    expect(puedeEliminar.value).toBe(true)
  })
})
