import { ref, computed } from 'vue'
import { useApi } from '~/composables/useApi'
import { useApiResponse } from '~/composables/useApiResponse'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { useNotification } from '~/composables/useNotification'

export interface ReempaqueItem {
  productoId?: number
  cantidadFiltrada?: number
  cantidadReempacada: number
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

export function useReempaque() {
  const api = useApi()
  const apiResponse = useApiResponse()
  const errorHandler = useErrorHandler()
  const notification = useNotification()

  const reempaqueItems = ref<ReempaqueItem[]>([])
  const filtradasPendientes = ref<FiltradasPendientes | null>(null)
  const savingReempaque = ref(false)
  const loadingPendientes = ref(false)

  const reempaqueItemsValidos = computed(() =>
    reempaqueItems.value.filter(
      (item) =>
        item.productoId &&
        item.cantidadReempacada >= 0,
    ),
  )

  const reempaqueMermaPendiente = computed(() => {
    // La merma se calcula en backend: cantidadFiltrada - cantidadReempacada
    // Este computed solo es informativo
    return 0
  })

  async function registrarReempaque(fecha?: string) {
    if (!reempaqueItemsValidos.value.length) {
      notification.warning('Agrega al menos un reempaque')
      return
    }

    savingReempaque.value = true

    try {
      const response = await api.post(
        '/diario/produccion/reempaque',
        {
          items: reempaqueItemsValidos.value.map((item) => ({
            productoId: item.productoId,
            cantidadReempacada: Number(item.cantidadReempacada ?? 0),
            observaciones: item.observaciones || undefined,
          })),
        },
        { params: fecha ? { fecha } : undefined },
      )

      notification.success('Reempaque registrado correctamente')
      reempaqueItems.value = []
      return response.data
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Error al registrar reempaque'
      notification.error(message)
      throw error
    } finally {
      savingReempaque.value = false
    }
  }

  async function cargarFiltradasPendientes(fecha?: string) {
    loadingPendientes.value = true

    try {
      const response = await api.get('/diario/filtradas-pendientes', {
        params: fecha ? { fecha } : undefined,
      })

      const data = apiResponse.unwrap(response)
      filtradasPendientes.value = data
      return data
    } catch (error) {
      console.error('Error cargando filtradas pendientes:', error)
      filtradasPendientes.value = null
    } finally {
      loadingPendientes.value = false
    }
  }

  function agregarReempaque(productoId?: number) {
    reempaqueItems.value.push({
      productoId,
      cantidadFiltrada: 1,
      cantidadReempacada: 0,
      observaciones: '',
    })
  }

  function agregarReempaqueDesdeFiltradasPendientes(item: any) {
    reempaqueItems.value.push({
      productoId: item.productoId,
      cantidadFiltrada: item.cantidadFiltrada,
      cantidadReempacada: 0,
      observaciones: item.observaciones || '',
    })
  }

  function limpiarReempaque() {
    reempaqueItems.value = []
  }

  return {
    reempaqueItems,
    filtradasPendientes,
    savingReempaque,
    loadingPendientes,
    reempaqueItemsValidos,
    reempaqueMermaPendiente,
    registrarReempaque,
    cargarFiltradasPendientes,
    agregarReempaque,
    agregarReempaqueDesdeFiltradasPendientes,
    limpiarReempaque,
  }
}
