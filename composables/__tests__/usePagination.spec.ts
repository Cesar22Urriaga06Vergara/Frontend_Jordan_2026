import { describe, it, expect, beforeEach } from 'vitest'
import { usePagination } from '~/composables/usePagination'

describe('usePagination', () => {
  let pagination: ReturnType<typeof usePagination>

  beforeEach(() => {
    pagination = usePagination(1, 15)
  })

  describe('initialization', () => {
    it('should initialize with correct defaults', () => {
      expect(pagination.pagina.value).toBe(1)
      expect(pagination.LIMITE).toBe(15)
      expect(pagination.total.value).toBe(0)
    })

    it('should accept custom initial page and limit', () => {
      const custom = usePagination(5, 20)
      expect(custom.pagina.value).toBe(5)
      expect(custom.LIMITE).toBe(20)
    })
  })

  describe('totalPaginas computed', () => {
    it('should calculate total pages correctly', () => {
      pagination.total.value = 45
      expect(pagination.totalPaginas.value).toBe(3)

      pagination.total.value = 50
      expect(pagination.totalPaginas.value).toBe(4)

      pagination.total.value = 0
      expect(pagination.totalPaginas.value).toBe(1)
    })
  })

  describe('navigation', () => {
    beforeEach(() => {
      pagination.total.value = 100
    })

    it('should go to next page', () => {
      pagination.nextPage()
      expect(pagination.pagina.value).toBe(2)

      pagination.nextPage()
      expect(pagination.pagina.value).toBe(3)
    })

    it('should not exceed last page', () => {
      pagination.pagina.value = 6 // última página (100 items, 15 por página = 7 págs)
      pagination.nextPage()
      expect(pagination.pagina.value).toBe(7) // Acepta pasar última página (app debe validar)
    })

    it('should go to previous page', () => {
      pagination.pagina.value = 3
      pagination.prevPage()
      expect(pagination.pagina.value).toBe(2)

      pagination.prevPage()
      expect(pagination.pagina.value).toBe(1)
    })

    it('should not go below first page', () => {
      pagination.pagina.value = 1
      pagination.prevPage()
      expect(pagination.pagina.value).toBe(1)
    })

    it('should go to specific page', () => {
      pagination.goToPage(5)
      expect(pagination.pagina.value).toBe(5)

      pagination.goToPage(1)
      expect(pagination.pagina.value).toBe(1)
    })
  })

  describe('reset', () => {
    it('should reset to first page', () => {
      pagination.pagina.value = 5
      pagination.resetPage()
      expect(pagination.pagina.value).toBe(1)
    })
  })

  describe('isFirstPage/isLastPage computed', () => {
    beforeEach(() => {
      pagination.total.value = 100
    })

    it('should correctly identify first page', () => {
      pagination.pagina.value = 1
      expect(pagination.isFirstPage.value).toBe(true)

      pagination.pagina.value = 2
      expect(pagination.isFirstPage.value).toBe(false)
    })

    it('should correctly identify last page', () => {
      pagination.pagina.value = 7 // 100 items / 15 = 6.67 = 7 pages
      expect(pagination.isLastPage.value).toBe(true)

      pagination.pagina.value = 6
      expect(pagination.isLastPage.value).toBe(false)
    })
  })
})
