import { apiList } from './useApiResponse'
import { onUnmounted } from 'vue'

export interface CRUDOptions<T> {
  endpoint: string
  api: ReturnType<typeof useApi>
  notify: ReturnType<typeof useNotification>
  onSuccess?: (message: string, data?: T) => void
  onError?: (error: any) => void
}

export function useCRUD<T extends { id?: number }>(options: CRUDOptions<T>) {
  const { endpoint, api, notify, onSuccess, onError } = options
  
  const items = ref<T[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const currentItem = ref<T | null>(null)
  const currentAbort = ref<AbortController | null>(null)

  function cancel() {
    if (currentAbort.value) {
      try {
        currentAbort.value.abort()
      } catch (e) {
        // ignore
      }
      currentAbort.value = null
    }
  }

  onUnmounted(() => {
    cancel()
  })

  async function fetchItems() {
    loading.value = true
    try {
      // cancel previous pending request if any
      cancel()
      const controller = new AbortController()
      currentAbort.value = controller
      const res = await api.get(endpoint, { signal: controller.signal })
      items.value = apiList<T>(res)
    } catch (e: any) {
      if (e?.name === 'CanceledError' || e?.message === 'canceled') {
        // request was cancelled by component unmount or new request
        return
      }
      notify.error(`Error al cargar datos: ${e?.message}`)
      onError?.(e)
    } finally {
      loading.value = false
    }
  }

  async function createItem(data: Omit<T, 'id'>) {
    saving.value = true
    try {
      cancel()
      const controller = new AbortController()
      currentAbort.value = controller
      const res = await api.post(endpoint, data, { signal: controller.signal })
      notify.success('Elemento creado correctamente')
      onSuccess?.('Elemento creado', res?.data)
      await fetchItems()
      return res?.data
    } catch (e: any) {
      if (e?.name === 'CanceledError' || e?.message === 'canceled') {
        return
      }
      notify.error(`Error: ${e?.response?.data?.message ?? e?.message}`)
      onError?.(e)
    } finally {
      saving.value = false
    }
  }

  async function updateItem(id: number, data: Partial<T>) {
    saving.value = true
    try {
      cancel()
      const controller = new AbortController()
      currentAbort.value = controller
      const res = await api.put(`${endpoint}/${id}`, data, { signal: controller.signal })
      notify.success('Elemento actualizado correctamente')
      onSuccess?.('Elemento actualizado', res?.data)
      await fetchItems()
      return res?.data
    } catch (e: any) {
      if (e?.name === 'CanceledError' || e?.message === 'canceled') {
        return
      }
      notify.error(`Error: ${e?.response?.data?.message ?? e?.message}`)
      onError?.(e)
    } finally {
      saving.value = false
    }
  }

  async function deleteItem(id: number) {
    saving.value = true
    try {
      cancel()
      const controller = new AbortController()
      currentAbort.value = controller
      await api.delete(`${endpoint}/${id}`, { signal: controller.signal })
      notify.success('Elemento eliminado correctamente')
      onSuccess?.('Elemento eliminado')
      await fetchItems()
    } catch (e: any) {
      if (e?.name === 'CanceledError' || e?.message === 'canceled') {
        return
      }
      notify.error(`Error: ${e?.response?.data?.message ?? e?.message}`)
      onError?.(e)
    } finally {
      saving.value = false
    }
  }

  function setCurrentItem(item: T | null) {
    currentItem.value = item
  }

  return {
    items,
    loading,
    saving,
    currentItem,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    setCurrentItem,
    cancel,
  }
}
