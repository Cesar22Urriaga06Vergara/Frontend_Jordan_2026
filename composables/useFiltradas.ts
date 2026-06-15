import { ref, computed } from 'vue'
import { useApi } from '~/composables/useApi'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { useNotification } from '~/composables/useNotification'
import { useDialog } from '~/composables/useDialog'

export interface FiltradaItem {
  productoId?: number
  cantidadFiltrada: number
  observaciones?: string
}

export interface FiltradasPendientes {
  fecha: string
  fechaOrigen?: string
  items: Array<{
    productoId: number
    cantidadFiltrada: number
    producto?: {
      id: number
      codigo: string
      nombre: string
    }
    observaciones?: string
  }>
}

export function useFiltradas() {
  const api = useApi()
  const errorHandler = useErrorHandler()
  const notification = useNotification()

  const filtradaItems = ref<FiltradaItem[]>([])
  const filtradasPendientes = ref<FiltradasPendientes | null>(null)
  const savingFiltrada = ref(false)
  const loadingPendientes = ref(false)

  const filtradaItemsValidos = computed(() =>
    filtradaItems.value.filter(
      (item) => item.productoId && item.cantidadFiltrada > 0,
    ),
  )

  async function registrarFiltrada(fecha?: string) {
    if (!filtradaItemsValidos.value.length) {
      notification.warning('Agrega al menos una paca filtrada')
      return
    }
    // Normalizar y validar payload cliente-side
    const itemsPayload = filtradaItemsValidos.value
      .map((item) => ({
        productoId: Number(item.productoId),
        cantidadFiltrada: Math.trunc(Number(item.cantidadFiltrada ?? 0)),
        cantidadReempacada: 0,
        observaciones: item.observaciones,
      }))
      .filter((it) => Number.isFinite(it.productoId) && it.productoId > 0 && it.cantidadFiltrada > 0)

    if (!itemsPayload.length) {
      notification.warning('No hay items válidos para enviar')
      return
    }

    // Resumen para confirmación
    const totalPacas = itemsPayload.reduce((s, it) => s + it.cantidadFiltrada, 0)
    const dialog = useDialog({ title: 'Confirmar pacas filtradas', confirmText: `Registrar ${totalPacas} pacas filtradas` })

    // Operación a ejecutar si confirman
    const operation = async () => {
      savingFiltrada.value = true
      try {
        // Para evitar confusión usamos el endpoint dedicado de filtradas
        const payload: any = { items: itemsPayload.map(it => ({ productoId: it.productoId, cantidadFiltrada: it.cantidadFiltrada, observaciones: it.observaciones })) }
        // eslint-disable-next-line no-console
        console.debug('POST /diario/produccion/filtrada payload:', JSON.stringify(payload), 'fecha(query):', fecha)
        const response = await api.post('/diario/produccion/filtrada', payload, {
          params: fecha ? { fecha } : undefined,
        })
        // eslint-disable-next-line no-console
        console.debug('Response /diario/produccion/filtrada:', JSON.stringify(response.data))
        notification.success('Filtradas registradas correctamente')
        filtradaItems.value = []
        return response.data
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.error('Error POST /diario/produccion/filtrada:', {
          status: error?.response?.status,
          message: error?.response?.data?.message,
          data: error?.response?.data,
        })
        throw error
      } finally {
        savingFiltrada.value = false
      }
    }

    // Ejecutar con el diálogo (muestra confirmación, estado loading y success/error)
    const result = await dialog.executeAndClose(operation)
    if (!result) {
      // Si hubo error, mostrar mensaje ya gestionado por useDialog
      return null
    }
    return result
  }

  async function cargarFilttradasPendientes(fecha?: string) {
    loadingPendientes.value = true

    try {
      const response = await api.get('/diario/filtradas-pendientes', {
        params: fecha ? { fecha } : undefined,
      })

      filtradasPendientes.value = response.data
      return response.data
    } catch (error) {
      console.error('Error cargando filtradas pendientes:', error)
      filtradasPendientes.value = null
    } finally {
      loadingPendientes.value = false
    }
  }

  function agregarFiltrada() {
    filtradaItems.value.push({
      cantidadFiltrada: 1,
    })
  }

  function limpiarFiltradas() {
    filtradaItems.value = []
  }

  return {
    filtradaItems,
    filtradasPendientes,
    savingFiltrada,
    loadingPendientes,
    filtradaItemsValidos,
    registrarFiltrada,
    cargarFilttradasPendientes,
    agregarFiltrada,
    limpiarFiltradas,
  }
}
