import { todayISOLocal } from '~/utils/formats'

const MENSAJE_RESTRINGIDO =
  "Acceso Restringido: Es necesario iniciar la jornada en 'Gestión de Planta' para operar."

export function useJornadaOperativa() {
  const api = useApi()
  const apiResponse = useApiResponse()
  const notify = useNotification()

  const estadoJornada = ref<any>(null)
  const loadingJornada = ref(false)

  const jornadaAbierta = computed(() => Boolean(estadoJornada.value?.abierto))
  const jornadaSinIniciar = computed(() => !estadoJornada.value?.apertura)

  async function fetchEstadoJornada(fecha = todayISOLocal()) {
    loadingJornada.value = true
    try {
      const res = await api.get('/diario/estado', { params: { fecha } })
      estadoJornada.value = apiResponse.unwrap(res)
    } catch {
      estadoJornada.value = null
    } finally {
      loadingJornada.value = false
    }
    return estadoJornada.value
  }

  function requireJornadaAbierta() {
    if (jornadaAbierta.value) return true
    notify.error(MENSAJE_RESTRINGIDO)
    return false
  }

  return {
    estadoJornada,
    loadingJornada,
    jornadaAbierta,
    jornadaSinIniciar,
    fetchEstadoJornada,
    requireJornadaAbierta,
    mensajeJornadaRestringida: MENSAJE_RESTRINGIDO,
  }
}
