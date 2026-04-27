export function useTableFilters<T extends Record<string, any>>(initialFilters: T) {
  const filters = reactive({ ...initialFilters })
  const hasActiveFilters = computed(() => 
    Object.values(filters).some(v => v && v !== '')
  )

  function resetFilters() {
    Object.keys(filters).forEach(key => {
      filters[key] = initialFilters[key]
    })
  }

  function updateFilter(key: string, value: any) {
    filters[key] = value
  }

  function getActiveFiltersCount(): number {
    return Object.values(filters).filter(v => v && v !== '').length
  }

  return {
    filters,
    hasActiveFilters,
    resetFilters,
    updateFilter,
    getActiveFiltersCount,
  }
}
