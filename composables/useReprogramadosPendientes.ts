import { computed, ref } from 'vue'
import { todayISOLocal } from '~/utils/formats'

export type ReprogramadoPendiente = {
  id: number
  numero: string
  clienteNombre: string | null
  fechaReprogramacion: string | null
  razonReprogramacion: string | null
}

export function useReprogramadosPendientes() {
  const api = useApi()
  const apiResponse = useApiResponse()

  const loading = ref(false)
  const total = ref(0)
  const paraHoy = ref(0)
  const pedidos = ref<ReprogramadoPendiente[]>([])
  const fechaReferencia = ref(todayISOLocal())

  const tienePendientes = computed(() => total.value > 0)
  const tieneParaHoy = computed(() => paraHoy.value > 0)

  const mensajeAlerta = computed(() => {
    if (!tienePendientes.value) return ''
    if (tieneParaHoy.value) {
      return `Tienes ${total.value} pedido(s) reprogramado(s) pendientes por entregar (${paraHoy.value} para hoy). No generan caja ni cartera hasta entregarse.`
    }
    return `Tienes ${total.value} pedido(s) reprogramado(s) pendientes por entregar. No generan caja ni cartera hasta entregarse.`
  })

  async function cargar(fecha?: string) {
    loading.value = true
    try {
      const res = await api.get('/operaciones/pedidos/reprogramados/pendientes', {
        params: fecha ? { fecha } : undefined,
      })
      const data = apiResponse.unwrap(res) as any
      total.value = Number(data.total ?? 0)
      paraHoy.value = Number(data.paraHoy ?? 0)
      pedidos.value = Array.isArray(data.pedidos) ? data.pedidos : []
      fechaReferencia.value = data.fechaReferencia ?? fecha ?? todayISOLocal()
    } catch {
      total.value = 0
      paraHoy.value = 0
      pedidos.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    total,
    paraHoy,
    pedidos,
    fechaReferencia,
    tienePendientes,
    tieneParaHoy,
    mensajeAlerta,
    cargar,
  }
}
