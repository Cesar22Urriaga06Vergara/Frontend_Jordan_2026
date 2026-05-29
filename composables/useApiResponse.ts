const DEFAULT_ERROR_MESSAGE = 'Ocurrió un error inesperado'

export const apiUnwrap = <T = any>(response: any): T => {
  if (response?.data && Object.prototype.hasOwnProperty.call(response.data, 'data')) {
    return response.data.data as T
  }
  return (response?.data ?? response) as T
}

export const apiList = <T = any>(response: any): T[] => {
  const payload = apiUnwrap(response) as any
  if (Array.isArray(payload)) return payload as T[]
  if (Array.isArray(payload?.items)) return payload.items as T[]
  if (Array.isArray(payload?.data)) return payload.data as T[]
  return []
}

export const apiPage = (response: any) => {
  const payload = apiUnwrap(response) as any
  return {
    total: Number(payload?.total ?? 0),
    page: Number(payload?.page ?? 1),
    limit: Number(payload?.limit ?? 10),
    totalPages: Number(payload?.totalPages ?? payload?.pages ?? 1),
  }
}

export const apiMessage = (response: any): string =>
  String(response?.data?.message ?? response?.message ?? 'Operación exitosa')

export const apiErrorMessage = (error: any): string => {
  const code = String(error?.code ?? '')
  if (code === 'ECONNABORTED') {
    return 'Tiempo de espera agotado al comunicarse con el servidor'
  }

  const body = error?.response?.data
  const message = body?.message
  const errors = body?.errors

  if (Array.isArray(errors) && errors.length > 0) {
    return errors.join(' | ')
  }

  if (Array.isArray(message) && message.length > 0) {
    return message.join(' | ')
  }

  if (typeof message === 'string' && message.trim()) {
    return message
  }

  const status = Number(error?.response?.status ?? 0)
  if (status === 0) return 'No se pudo conectar con el servidor'
  if (status === 401) return 'No autorizado'
  if (status === 403) return 'Acceso denegado'
  if (status === 400) return 'Solicitud inválida'
  if (status >= 500) return 'Error interno del servidor'

  return DEFAULT_ERROR_MESSAGE
}

export function useApiResponse() {
  return {
    unwrap: apiUnwrap,
    list: apiList,
    page: apiPage,
    message: apiMessage,
    errorMessage: apiErrorMessage,
  }
}
