export type DialogStep = 'confirm' | 'loading' | 'success' | 'error'

export interface UseDialogOptions {
  title?: string
  confirmText?: string
  successMessage?: string
  errorMessage?: string
}

export function useDialog(options: UseDialogOptions = {}) {
  const {
    title = 'Confirmar acción',
    confirmText = '¿Estás seguro?',
    successMessage = 'Operación completada',
    errorMessage = 'Error en la operación',
  } = options

  const isOpen = ref(false)
  const step = ref<DialogStep>('confirm')
  const error = ref('')

  interface DialogData {
    title: string
    confirmText: string
    successMessage: string
    errorMessage: string
  }

  const dialogData = ref<DialogData>({
    title,
    confirmText,
    successMessage,
    errorMessage,
  })

  function open(customData?: Partial<DialogData>) {
    if (customData) {
      dialogData.value = { ...dialogData.value, ...customData }
    }
    isOpen.value = true
    step.value = 'confirm'
    error.value = ''
  }

  function close() {
    isOpen.value = false
    step.value = 'confirm'
    error.value = ''
  }

  function setLoading() {
    step.value = 'loading'
    error.value = ''
  }

  function setSuccess() {
    step.value = 'success'
    error.value = ''
  }

  function setError(message: string) {
    step.value = 'error'
    error.value = message
  }

  async function executeAndClose<T>(
    operation: () => Promise<T>,
    onSuccess?: (data: T) => void
  ): Promise<T | null> {
    setLoading()
    try {
      const result = await operation()
      setSuccess()
      setTimeout(() => close(), 1500)
      onSuccess?.(result)
      return result
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || errorMessage
      setError(message)
      return null
    }
  }

  const isLoading = computed(() => step.value === 'loading')
  const isConfirming = computed(() => step.value === 'confirm')
  const isSuccess = computed(() => step.value === 'success')
  const isError = computed(() => step.value === 'error')

  return {
    isOpen,
    step,
    error,
    dialogData,
    isLoading,
    isConfirming,
    isSuccess,
    isError,
    open,
    close,
    setLoading,
    setSuccess,
    setError,
    executeAndClose,
  }
}
