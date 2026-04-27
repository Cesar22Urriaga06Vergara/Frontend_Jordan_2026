export interface ErrorConfig {
  autoRetry?: boolean
  maxRetries?: number
  retryDelay?: number
}

export function useErrorHandler(config: ErrorConfig = {}) {
  const { autoRetry = true, maxRetries = 3, retryDelay = 1000 } = config
  const notify = useNotification()

  const errors = ref<any[]>([])
  const isError = ref(false)
  const errorMessage = ref('')
  const retryCount = ref(0)

  function clearError() {
    errors.value = []
    isError.value = false
    errorMessage.value = ''
    retryCount.value = 0
  }

  function handleError(
    error: any,
    context: string = 'Operación'
  ): { message: string; canRetry: boolean } {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      `${context} fallida`
    
    errorMessage.value = message
    isError.value = true
    errors.value.push({
      context,
      message,
      timestamp: new Date(),
      error,
    })

    notify.error(message)

    return {
      message,
      canRetry: autoRetry && retryCount.value < maxRetries,
    }
  }

  async function retryOperation<T>(
    operation: () => Promise<T>,
    context: string = 'Operación'
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    clearError()

    for (let i = 0; i <= maxRetries; i++) {
      try {
        retryCount.value = i
        const data = await operation()
        clearError()
        return { success: true, data }
      } catch (error) {
        if (i < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * (i + 1))
          )
        } else {
          const { message } = handleError(error, context)
          return { success: false, error: message }
        }
      }
    }

    return { success: false, error: 'Max retries reached' }
  }

  function logError(context: string, error: any) {
    console.error(`[${context}]`, error)
    if (process.env.NODE_ENV === 'development') {
      console.debug(`Error details:`, {
        context,
        message: error?.message,
        response: error?.response?.data,
        stack: error?.stack,
      })
    }
  }

  return {
    errors,
    isError,
    errorMessage,
    retryCount,
    clearError,
    handleError,
    retryOperation,
    logError,
  }
}
