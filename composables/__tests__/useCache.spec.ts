import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useCache } from '~/composables/useCache'

describe('useCache', () => {
  let cache: ReturnType<typeof useCache>

  beforeEach(() => {
    cache = useCache({ ttl: 1000 }) // 1 segundo TTL
    vi.clearAllTimers()
  })

  describe('basic operations', () => {
    it('should set and get values', () => {
      cache.set('key1', { data: 'test' })
      const result = cache.get('key1')
      expect(result).toEqual({ data: 'test' })
    })

    it('should return null for missing keys', () => {
      const result = cache.get('nonexistent')
      expect(result).toBeNull()
    })

    it('should check if key exists', () => {
      cache.set('exists', 123)
      expect(cache.has('exists')).toBe(true)
      expect(cache.has('nothere')).toBe(false)
    })

    it('should remove specific keys', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      
      cache.remove('key1')
      
      expect(cache.has('key1')).toBe(false)
      expect(cache.has('key2')).toBe(true)
    })

    it('should clear all cache', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')
      
      cache.clear()
      
      expect(cache.has('key1')).toBe(false)
      expect(cache.has('key2')).toBe(false)
      expect(cache.has('key3')).toBe(false)
    })
  })

  describe('TTL and expiration', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should respect custom TTL per entry', () => {
      cache.set('short', 'data', 100) // 100ms
      cache.set('long', 'data', 5000) // 5 segundos
      
      expect(cache.has('short')).toBe(true)
      expect(cache.has('long')).toBe(true)
      
      // Simular paso de 200ms
      vi.advanceTimersByTime(200)
      
      expect(cache.has('short')).toBe(false) // Expirado
      expect(cache.has('long')).toBe(true)  // Aún válido
    })

    it('should return stale check correctly', () => {
      cache.set('test', 'value', 100)
      
      const entry = cache.get('test')
      expect(entry).toBe('value')
      
      vi.advanceTimersByTime(150)
      expect(cache.isStale({
        data: 'value',
        timestamp: Date.now() - 150,
        ttl: 100
      })).toBe(true)
    })
  })

  describe('getKey convenience method', () => {
    it('should generate consistent keys for URLs without params', () => {
      const key1 = cache.getKey('/api/users')
      const key2 = cache.getKey('/api/users')
      expect(key1).toBe(key2)
      expect(key1).toBe('/api/users')
    })

    it('should generate consistent keys for URLs with params', () => {
      const key1 = cache.getKey('/api/users', { page: 1, sort: 'name' })
      const key2 = cache.getKey('/api/users', { sort: 'name', page: 1 })
      
      // Mismo resultado independiente del orden
      expect(key1).toBe(key2)
      expect(key1).toContain('/api/users?')
      expect(key1).toContain('page')
      expect(key1).toContain('sort')
    })

    it('should handle null/undefined params', () => {
      const key1 = cache.getKey('/api/users', undefined)
      const key2 = cache.getKey('/api/users')
      expect(key1).toBe(key2)
    })
  })

  describe('stats', () => {
    it('should report cache statistics', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')
      
      const stats = cache.getStats()
      expect(stats.size).toBe(3)
      expect(stats.entries).toContain('key1')
      expect(stats.entries).toContain('key2')
      expect(stats.entries).toContain('key3')
    })

    it('should update stats after removal', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.remove('key1')
      
      const stats = cache.getStats()
      expect(stats.size).toBe(1)
      expect(stats.entries).not.toContain('key1')
    })
  })

  describe('type safety', () => {
    it('should preserve types when storing and retrieving', () => {
      interface User {
        id: number
        name: string
        email: string
      }

      const user: User = { id: 1, name: 'John', email: 'john@example.com' }
      cache.set('user', user)

      const retrieved = cache.get<User>('user')
      expect(retrieved?.id).toBe(1)
      expect(retrieved?.name).toBe('John')
      expect(retrieved?.email).toBe('john@example.com')
    })
  })
})
