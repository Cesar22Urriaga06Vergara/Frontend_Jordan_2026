import { describe, expect, it } from 'vitest'
import { useProcesoPacas } from '~/composables/useProcesoPacas'

describe('useProcesoPacas', () => {
  it('calcula balance esperado y detecta discrepancia', () => {
    const { actualizarProceso, balanceEsperado, tieneDiscrepancia, validarBalance } =
      useProcesoPacas()

    actualizarProceso({
      pacasIniciales: 100,
      pacasDescartadas: 5,
      pacasReempacadas: 10,
      pacasFinales: 80,
    })

    expect(balanceEsperado.value).toBe(85)
    expect(tieneDiscrepancia.value).toBe(true)
    expect(validarBalance().valido).toBe(false)
  })

  it('exige notas cuando hay discrepancia en ajuste', () => {
    const { agregarAjuste } = useProcesoPacas()

    const resultado = agregarAjuste({
      pacasAntes: 10,
      pacasAhora: 8,
      razon: 'MERMAS',
      notasAjuste: '',
    })

    expect(resultado.exitoso).toBe(false)
  })

  it('registra ajuste valido', () => {
    const { agregarAjuste, ajustes } = useProcesoPacas()

    const resultado = agregarAjuste({
      pacasAntes: 10,
      pacasAhora: 10,
      razon: 'ERROR_CONTEO',
      notasAjuste: 'Correccion de conteo',
    })

    expect(resultado.exitoso).toBe(true)
    expect(ajustes.value).toHaveLength(1)
  })
})
