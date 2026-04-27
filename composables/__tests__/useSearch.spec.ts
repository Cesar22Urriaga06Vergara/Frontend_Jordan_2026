import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useSearch } from '~/composables/useSearch'

interface TestItem {
  id: number
  nombre: string
  email: string
  estado: string
}

describe('useSearch', () => {
  let items: ReturnType<typeof ref<TestItem[]>>
  let search: ReturnType<typeof useSearch<TestItem>>

  beforeEach(() => {
    items = ref<TestItem[]>([
      { id: 1, nombre: 'Juan García', email: 'juan@example.com', estado: 'ACTIVO' },
      { id: 2, nombre: 'María López', email: 'maria@example.com', estado: 'INACTIVO' },
      { id: 3, nombre: 'Pedro Pérez', email: 'pedro@example.com', estado: 'ACTIVO' },
      { id: 4, nombre: 'Ana Martínez', email: 'ana@example.com', estado: 'ACTIVO' },
    ])
    search = useSearch(items as any)
  })

  describe('search functionality', () => {
    it('should search in configured fields', () => {
      search.setSearchFields('nombre', 'email')
      search.setSearchQuery('juan')

      expect(search.filteredItems.value).toHaveLength(1)
      expect(search.filteredItems.value[0].id).toBe(1)
    })

    it('should be case-insensitive', () => {
      search.setSearchFields('nombre')
      search.setSearchQuery('MARIA')

      expect(search.filteredItems.value).toHaveLength(1)
      expect(search.filteredItems.value[0].id).toBe(2)
    })

    it('should search across multiple fields', () => {
      search.setSearchFields('nombre', 'email')
      search.setSearchQuery('pedro')

      expect(search.filteredItems.value).toHaveLength(1)
      expect(search.filteredItems.value[0].nombre).toBe('Pedro Pérez')
    })

    it('should return all items when search is empty', () => {
      search.setSearchQuery('')
      expect(search.filteredItems.value).toHaveLength(4)
    })

    it('should return empty when no matches', () => {
      search.setSearchFields('nombre')
      search.setSearchQuery('nonexistent')
      expect(search.filteredItems.value).toHaveLength(0)
    })
  })

  describe('filter functionality', () => {
    it('should add and apply filters', () => {
      search.addFilter('estado', 'ACTIVO', 'equals')
      expect(search.filteredItems.value).toHaveLength(3)
      expect(search.filteredItems.value.every(i => i.estado === 'ACTIVO')).toBe(true)
    })

    it('should apply multiple filters (AND logic)', () => {
      search.addFilter('estado', 'ACTIVO')
      search.addFilter('nombre', 'juan', 'contains')

      expect(search.filteredItems.value).toHaveLength(1)
      expect(search.filteredItems.value[0].id).toBe(1)
    })

    it('should support contains operator', () => {
      search.addFilter('nombre', 'García', 'contains')
      expect(search.filteredItems.value).toHaveLength(1)
      expect(search.filteredItems.value[0].nombre).toBe('Juan García')
    })

    it('should support startsWith operator', () => {
      search.addFilter('nombre', 'María', 'startsWith')
      expect(search.filteredItems.value).toHaveLength(1)
      expect(search.filteredItems.value[0].id).toBe(2)
    })

    it('should remove specific filter by index', () => {
      search.addFilter('estado', 'ACTIVO')
      search.addFilter('nombre', 'juan', 'contains')
      expect(search.filteredItems.value).toHaveLength(1)

      search.removeFilter(0)
      expect(search.filteredItems.value).toHaveLength(1)

      search.removeFilter(0)
      expect(search.filteredItems.value).toHaveLength(4)
    })
  })

  describe('search and filter combined', () => {
    it('should apply both search and filters', () => {
      search.setSearchFields('nombre', 'email')
      search.setSearchQuery('a') // Encuentra: María, Pedro, Ana

      search.addFilter('estado', 'ACTIVO') // Filtra más

      const result = search.filteredItems.value
      expect(result.length).toBeGreaterThan(0)
      expect(result.every(i => i.estado === 'ACTIVO')).toBe(true)
    })
  })

  describe('computed properties', () => {
    it('should compute result count', () => {
      search.setSearchFields('nombre')
      search.setSearchQuery('p') // Pedro, Pérez, Martínez

      expect(search.resultCount.value).toBeGreaterThan(0)
      expect(search.resultCount.value).toBe(search.filteredItems.value.length)
    })

    it('should detect active search', () => {
      expect(search.hasActiveSearch.value).toBe(false)

      search.setSearchQuery('test')
      expect(search.hasActiveSearch.value).toBe(true)

      search.clearSearch()
      expect(search.hasActiveSearch.value).toBe(false)

      search.addFilter('estado', 'ACTIVO')
      expect(search.hasActiveSearch.value).toBe(true)
    })

    it('should compute removed count', () => {
      const total = search.filteredItems.value.length
      search.setSearchQuery('juan')
      const removed = search.getRemovedCount()

      expect(removed).toBe(total - 1)
    })
  })

  describe('clear functionality', () => {
    it('should clear all search and filters', () => {
      search.setSearchFields('nombre')
      search.setSearchQuery('test')
      search.addFilter('estado', 'ACTIVO')

      expect(search.hasActiveSearch.value).toBe(true)
      expect(search.filteredItems.value.length).toBeLessThan(4)

      search.clearSearch()

      expect(search.hasActiveSearch.value).toBe(false)
      expect(search.filteredItems.value).toHaveLength(4)
    })
  })

  describe('operators', () => {
    it('should support gt (greater than) operator', () => {
      search.addFilter('id', 2, 'gt')
      expect(search.filteredItems.value.map(i => i.id)).toEqual([3, 4])
    })

    it('should support lt (less than) operator', () => {
      search.addFilter('id', 3, 'lt')
      expect(search.filteredItems.value.map(i => i.id)).toEqual([1, 2])
    })

    it('should support equals operator (default)', () => {
      search.addFilter('id', 1, 'equals')
      expect(search.filteredItems.value).toHaveLength(1)
      expect(search.filteredItems.value[0].id).toBe(1)
    })
  })
})
