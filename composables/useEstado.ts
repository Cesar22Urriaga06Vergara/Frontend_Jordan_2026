export interface EstadoTransicion {
  estado: string
  estadosPermitidos: string[]
}

export interface UseEstadoOptions {
  endpoint: string
  api: ReturnType<typeof useApi>
  notify: ReturnType<typeof useNotification>
  transiciones: Record<string, string[]>
  onSuccess?: (nuevoEstado: string) => void
}

export function useEstado(options: UseEstadoOptions) {
  const { endpoint, api, notify, transiciones, onSuccess } = options
  
  const estadoActual = ref<string>('')
  const changingState = ref(false)
  const estadosDisponibles = computed(() => {
    return transiciones[estadoActual.value] ?? []
  })

  function setEstado(nuevoEstado: string) {
    estadoActual.value = nuevoEstado
  }

  function puedeTransicionarA(nuevoEstado: string): boolean {
    return estadosDisponibles.value.includes(nuevoEstado)
  }

  async function cambiarEstado(nuevoEstado: string, motivo?: string) {
    if (!puedeTransicionarA(nuevoEstado)) {
      notify.error(
        `No se puede cambiar de ${estadoActual.value} a ${nuevoEstado}`
      )
      return false
    }

    changingState.value = true
    try {
      const payload: any = { estado: nuevoEstado }
      if (motivo) {
        payload.motivo = motivo
      }

      await api.put(`${endpoint}`, payload)
      notify.success(`Estado cambiado a ${nuevoEstado}`)
      estadoActual.value = nuevoEstado
      onSuccess?.(nuevoEstado)
      return true
    } catch (e: any) {
      notify.error(`Error al cambiar estado: ${e?.response?.data?.message}`)
      return false
    } finally {
      changingState.value = false
    }
  }

  return {
    estadoActual,
    changingState,
    estadosDisponibles,
    setEstado,
    puedeTransicionarA,
    cambiarEstado,
  }
}
