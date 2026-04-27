import { apiList } from './useApiResponse'

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

  async function fetchItems() {
    loading.value = true
    try {
      const res = await api.get(endpoint)
      items.value = apiList<T>(res)
    } catch (e: any) {
      notify.error(`Error al cargar datos: ${e?.message}`)
      onError?.(e)
    } finally {
      loading.value = false
    }
  }

  async function createItem(data: Omit<T, 'id'>) {
    saving.value = true
    try {
      const res = await api.post(endpoint, data)
      notify.success('Elemento creado correctamente')
      onSuccess?.('Elemento creado', res?.data)
      await fetchItems()
      return res?.data
    } catch (e: any) {
      notify.error(`Error: ${e?.response?.data?.message ?? e?.message}`)
      onError?.(e)
    } finally {
      saving.value = false
    }
  }

  async function updateItem(id: number, data: Partial<T>) {
    saving.value = true
    try {
      const res = await api.put(`${endpoint}/${id}`, data)
      notify.success('Elemento actualizado correctamente')
      onSuccess?.('Elemento actualizado', res?.data)
      await fetchItems()
      return res?.data
    } catch (e: any) {
      notify.error(`Error: ${e?.response?.data?.message ?? e?.message}`)
      onError?.(e)
    } finally {
      saving.value = false
    }
  }

  async function deleteItem(id: number) {
    saving.value = true
    try {
      await api.delete(`${endpoint}/${id}`)
      notify.success('Elemento eliminado correctamente')
      onSuccess?.('Elemento eliminado')
      await fetchItems()
    } catch (e: any) {
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
  }
}
