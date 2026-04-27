export interface SearchFilter<T> {
  field: keyof T
  value: any
  operator?: 'equals' | 'contains' | 'startsWith' | 'gt' | 'lt'
}

export function useSearch<T extends object>(items: Ref<T[]>) {
  const searchQuery = ref('')
  const searchFields = ref<(keyof T)[]>([])
  const filters = ref<SearchFilter<T>[]>([])

  const filteredItems = computed(() => {
    let result = [...items.value]

    // Aplicar búsqueda
    if (searchQuery.value && searchFields.value.length > 0) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter((item) =>
        searchFields.value.some((field) => {
          const value = String((item as any)[field] ?? '').toLowerCase()
          return value.includes(query)
        })
      )
    }

    // Aplicar filtros
    if (filters.value.length > 0) {
      result = result.filter((item) =>
        filters.value.every((filter) => {
          const itemValue = (item as any)[filter.field]
          const operator = filter.operator ?? 'equals'

          switch (operator) {
            case 'equals':
              return itemValue === filter.value
            case 'contains':
              return String(itemValue).includes(String(filter.value))
            case 'startsWith':
              return String(itemValue).startsWith(String(filter.value))
            case 'gt':
              return itemValue > filter.value
            case 'lt':
              return itemValue < filter.value
            default:
              return true
          }
        })
      )
    }

    return result
  })

  const resultCount = computed(() => filteredItems.value.length)
  const hasActiveSearch = computed(
    () => searchQuery.value.length > 0 || filters.value.length > 0
  )

  function setSearchFields(...fields: (keyof T)[]) {
    searchFields.value = fields
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query
  }

  function addFilter(
    field: keyof T,
    value: any,
    operator: SearchFilter<T>['operator'] = 'equals'
  ) {
    filters.value.push({ field: field as any, value, operator })
  }

  function removeFilter(index: number) {
    filters.value.splice(index, 1)
  }

  function clearSearch() {
    searchQuery.value = ''
    filters.value = []
  }

  function getRemovedCount(): number {
    return items.value.length - filteredItems.value.length
  }

  return {
    searchQuery,
    filters,
    filteredItems,
    resultCount,
    hasActiveSearch,
    setSearchFields,
    setSearchQuery,
    addFilter,
    removeFilter,
    clearSearch,
    getRemovedCount,
  }
}
