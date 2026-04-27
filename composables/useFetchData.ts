export function useFetchData<T = any>(
  fetchFn: () => Promise<T>,
  options?: {
    immediate?: boolean
    onError?: (error: any) => void
  }
) {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const retryCount = ref(0)

  async function fetch() {
    loading.value = true
    error.value = null

    try {
      data.value = await fetchFn()
      retryCount.value = 0
    } catch (e: any) {
      error.value = e?.message ?? 'Error al cargar datos'
      options?.onError?.(e)
    } finally {
      loading.value = false
    }
  }

  async function refetch() {
    await fetch()
  }

  async function retry() {
    retryCount.value++
    await fetch()
  }

  if (options?.immediate !== false) {
    fetch()
  }

  return {
    data,
    loading,
    error,
    retryCount,
    fetch,
    refetch,
    retry,
  }
}
