export interface UseLocalStateOptions<T> {
  key: string
  initialValue: T
  serialize?: (value: T) => string
  deserialize?: (value: string) => T
}

export function useLocalState<T>(options: UseLocalStateOptions<T>) {
  const {
    key,
    initialValue,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
  } = options

  // Cargar valor inicial
  let storedValue: T = initialValue
  try {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(key) : null
    if (stored) {
      storedValue = deserialize(stored)
    }
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error)
  }

  const state = ref(storedValue)

  // Sincronizar con localStorage
  const save = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, serialize(state.value))
      }
    } catch (error) {
      console.warn(`Error writing to localStorage key "${key}":`, error)
    }
  }

  const clear = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key)
      }
      state.value = initialValue
    } catch (error) {
      console.warn(`Error clearing localStorage key "${key}":`, error)
    }
  }

  const reset = () => {
    state.value = initialValue
    save()
  }

  // Auto-guardar en cambios
  const watchers: ReturnType<typeof watch>[] = []
  
  watchEffect(
    () => {
      save()
    },
    { flush: 'post' }
  )

  // Sincronizar entre pestañas
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === key && e.newValue) {
      try {
        state.value = deserialize(e.newValue)
      } catch (error) {
        console.warn(`Error syncing localStorage key "${key}":`, error)
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageChange)
  }

  // Limpiar listeners
  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageChange)
    }
  })

  return {
    state,
    save,
    clear,
    reset,
  }
}
