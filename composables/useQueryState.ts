export interface UseQueryStateOptions<T> {
  syncToUrl?: boolean
  debounceMs?: number
}

/**
 * Sincroniza estado con query parameters en la URL
 * Útil para: búsqueda, filtros, página actual, etc.
 */
export function useQueryState<T extends Record<string, any>>(
  initialState: T,
  options: UseQueryStateOptions<T> = {}
) {
  const { syncToUrl = true, debounceMs = 300 } = options
  const route = useRoute()
  const router = useRouter()

  // Cargar estado desde URL si disponible
  let stateFromUrl: Partial<T> = {}
  if (syncToUrl && route.query) {
    stateFromUrl = { ...initialState }
    Object.keys(initialState).forEach((key) => {
      const queryValue = route.query[key]
      if (queryValue !== undefined) {
        try {
          // Intentar parsear como JSON para tipos complejos
          stateFromUrl[key as keyof T] = JSON.parse(String(queryValue))
        } catch {
          // Si falla, usar como string
          stateFromUrl[key as keyof T] = queryValue as any
        }
      }
    })
  }

  const state = reactive<T>({ ...initialState, ...stateFromUrl })

  // Debounced sync a URL
  let syncTimeout: NodeJS.Timeout
  const syncToUrlDebounced = () => {
    if (!syncToUrl) return

    clearTimeout(syncTimeout)
    syncTimeout = setTimeout(() => {
      const newQuery: Record<string, string> = {}
      Object.entries(state).forEach(([key, value]) => {
        if (value !== initialState[key as keyof T]) {
          newQuery[key] = typeof value === 'string' ? value : JSON.stringify(value)
        }
      })

      router.push({
        query: newQuery,
      })
    }, debounceMs)
  }

  // Watch para cambios en state
  watch(
    () => state,
    () => {
      syncToUrlDebounced()
    },
    { deep: true }
  )

  function setState<K extends keyof T>(key: K, value: T[K]): void {
    (state as any)[key] = value
  }

  function reset(): void {
    Object.keys(initialState).forEach((key) => {
      (state as any)[key] = (initialState as any)[key]
    })
    if (syncToUrl) {
      router.push({ query: {} })
    }
  }

  function getQueryString(): string {
    const params = new URLSearchParams()
    Object.entries(state).forEach(([key, value]) => {
      if (value !== initialState[key as keyof T]) {
        params.append(key, typeof value === 'string' ? value : JSON.stringify(value))
      }
    })
    return params.toString()
  }

  onUnmounted(() => {
    clearTimeout(syncTimeout)
  })

  return {
    state: readonly(state),
    setState,
    reset,
    getQueryString,
  }
}

/**
 * Sincroniza Array de filtros con URL
 * Más flexible que useQueryState para múltiples valores del mismo tipo
 */
export function useQueryFilters(filterKey: string = 'filters') {
  const route = useRoute()
  const router = useRouter()

  // Parsear filtros desde URL
  const filtersFromUrl = (() => {
    const query = route.query[filterKey]
    if (!query) return []
    try {
      const items = Array.isArray(query) ? query : [query]
      return items.filter(Boolean) as string[]
    } catch {
      return []
    }
  })()

  const filters = ref<string[]>(filtersFromUrl)

  let syncTimeout: NodeJS.Timeout
  const syncToUrl = () => {
    clearTimeout(syncTimeout)
    syncTimeout = setTimeout(() => {
      if (filters.value.length === 0) {
        router.push({ query: {} })
      } else {
        router.push({
          query: { [filterKey]: filters.value },
        })
      }
    }, 300)
  }

  watch(() => filters.value, syncToUrl, { deep: true })

  function addFilter(value: string): void {
    if (!filters.value.includes(value)) {
      filters.value.push(value)
    }
  }

  function removeFilter(value: string): void {
    const index = filters.value.indexOf(value)
    if (index > -1) {
      filters.value.splice(index, 1)
    }
  }

  function toggleFilter(value: string): void {
    if (filters.value.includes(value)) {
      removeFilter(value)
    } else {
      addFilter(value)
    }
  }

  function clearFilters(): void {
    filters.value = []
  }

  onUnmounted(() => {
    clearTimeout(syncTimeout)
  })

  return {
    filters: readonly(filters),
    addFilter,
    removeFilter,
    toggleFilter,
    clearFilters,
  }
}
