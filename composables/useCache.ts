export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export interface CacheOptions {
  ttl?: number      // Time-to-live en ms (default: 5min)
  strategy?: 'stale-while-revalidate' | 'cache-first' | 'network-first'
}

export function useCache(options: CacheOptions = {}) {
  const {
    ttl = 5 * 60 * 1000,
    strategy = 'stale-while-revalidate'
  } = options

  const cache = new Map<string, CacheEntry<any>>()

  function getKey(url: string, params?: Record<string, any>): string {
    if (!params) return url
    const queryString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join('&')
    return `${url}?${queryString}`
  }

  function isStale(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  function get<T>(key: string): T | null {
    const entry = cache.get(key)
    if (!entry) return null
    if (isStale(entry)) {
      cache.delete(key)
      return null
    }
    return entry.data as T
  }

  function set<T>(key: string, data: T, customTtl?: number): void {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: customTtl ?? ttl,
    })
  }

  function has(key: string): boolean {
    const entry = cache.get(key)
    if (!entry) return false
    if (isStale(entry)) {
      cache.delete(key)
      return false
    }
    return true
  }

  function clear(): void {
    cache.clear()
  }

  function remove(key: string): void {
    cache.delete(key)
  }

  function getStats(): { size: number; entries: string[] } {
    return {
      size: cache.size,
      entries: Array.from(cache.keys()),
    }
  }

  return {
    get,
    set,
    has,
    clear,
    remove,
    getStats,
    getKey,
    isStale,
  }
}

/**
 * Versión mejorada de useFetchData con caching
 */
export interface UseFetchDataWithCacheOptions<T> {
  immediate?: boolean
  onError?: (error: any) => void
  cache?: CacheOptions
  skipCache?: boolean
}

export function useFetchDataWithCache<T>(
  fetchFn: () => Promise<T>,
  key: string,
  options: UseFetchDataWithCacheOptions<T> = {}
) {
  const { immediate = false, onError, cache: cacheOpts, skipCache = false } = options
  
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<any>(null)
  const retryCount = ref(0)
  const isCached = ref(false)
  const cacheInstance = useCache(cacheOpts)

  async function fetch(): Promise<T | null> {
    // Estrategia: stale-while-revalidate (usa cache si existe, pero refrescando en background)
    if (!skipCache && cacheInstance.has(key)) {
      data.value = cacheInstance.get<T>(key)
      isCached.value = true
      
      // Revalidar en background
      if (cacheInstance.isStale(cacheInstance.get<any>(key))) {
        loading.value = true
        try {
          const fresh = await fetchFn()
          cacheInstance.set(key, fresh)
          data.value = fresh
          error.value = null
        } catch (e) {
          // No lanzar error, mantener cache stale
          console.warn('Error refetching:', e)
        } finally {
          loading.value = false
        }
      }
      
      return data.value
    }

    // Cache miss o skipCache = true
    loading.value = true
    error.value = null
    isCached.value = false

    try {
      const result = await fetchFn()
      data.value = result
      if (!skipCache) {
        cacheInstance.set(key, result)
      }
      error.value = null
      return result
    } catch (e) {
      error.value = e
      onError?.(e)
      return null
    } finally {
      loading.value = false
    }
  }

  function refetch(): Promise<T | null> {
    cacheInstance.remove(key)
    return fetch()
  }

  function retry(): Promise<T | null> {
    retryCount.value++
    return fetch()
  }

  function clearCache(): void {
    cacheInstance.remove(key)
    data.value = null
    isCached.value = false
  }

  if (immediate) {
    fetch()
  }

  return {
    data,
    loading,
    error,
    retryCount,
    isCached,
    fetch,
    refetch,
    retry,
    clearCache,
    cacheStats: () => cacheInstance.getStats(),
  }
}
