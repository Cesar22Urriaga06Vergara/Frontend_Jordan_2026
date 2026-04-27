export interface UseLazyLoadOptions {
  pageSize?: number
  threshold?: number  // Elementos desde fin para triggerear siguiente página
}

export function useLazyLoad<T>(
  items: Ref<T[]>,
  fetchMoreFn: (page: number, pageSize: number) => Promise<T[]>,
  options: UseLazyLoadOptions = {}
) {
  const { pageSize = 15, threshold = 5 } = options

  const currentPage = ref(1)
  const allItems = ref<T[]>([...items.value])
  const loadingMore = ref(false)
  const hasMore = ref(true)
  const totalLoaded = ref(items.value.length)

  // Detectar si estamos cerca del fin
  const visibleItems = computed(() => {
    return allItems.value.slice(0, totalLoaded.value)
  })

  const shouldLoadMore = computed(() => {
    return hasMore.value && !loadingMore.value && totalLoaded.value > 0
  })

  async function loadMore(): Promise<void> {
    if (loadingMore.value || !hasMore.value) return

    loadingMore.value = true
    try {
      currentPage.value++
      const newItems = await fetchMoreFn(currentPage.value, pageSize)

      if (newItems.length < pageSize) {
        hasMore.value = false
      }

      allItems.value.push(...(newItems as any))
      totalLoaded.value += newItems.length
    } catch (error) {
      console.error('Error loading more items:', error)
      currentPage.value--
    } finally {
      loadingMore.value = false
    }
  }

  // Auto-load cuando cerca del fin
  const containerRef = ref<HTMLElement | null>(null)

  const intersectionObserver = computed(() => {
    if (typeof window === 'undefined' || !containerRef.value) {
      return null
    }

    return new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && shouldLoadMore.value) {
            loadMore()
          }
        })
      },
      { rootMargin: `${threshold * 50}px` }
    )
  })

  onMounted(() => {
    if (intersectionObserver.value && containerRef.value) {
      intersectionObserver.value.observe(containerRef.value)
    }
  })

  onUnmounted(() => {
    if (intersectionObserver.value) {
      intersectionObserver.value.disconnect()
    }
  })

  function reset(): void {
    currentPage.value = 1
    allItems.value = [...items.value]
    totalLoaded.value = items.value.length
    hasMore.value = true
  }

  return {
    visibleItems,
    loadingMore,
    hasMore,
    totalLoaded,
    containerRef,
    loadMore,
    reset,
  }
}

/**
 * Virtual Scroll para tablas muy grandes
 * Renderiza solo items visibles en viewport
 */
export interface UseVirtualScrollOptions {
  itemHeight: number
  bufferSize?: number  // Items extra a renderizar off-screen
}

export function useVirtualScroll<T>(
  items: Ref<T[]>,
  options: UseVirtualScrollOptions
) {
  const { itemHeight, bufferSize = 5 } = options

  const scrollContainer = ref<HTMLElement | null>(null)
  const scrollTop = ref(0)
  const containerHeight = ref(0)

  const visibleRange = computed(() => {
    const start = Math.max(0, Math.floor(scrollTop.value / itemHeight) - bufferSize)
    const visibleCount = Math.ceil(containerHeight.value / itemHeight) + bufferSize * 2
    const end = Math.min(items.value.length, start + visibleCount)

    return { start, end, offset: start * itemHeight }
  })

  const visibleItems = computed(() => {
    const { start, end } = visibleRange.value
    return items.value.slice(start, end)
  })

  const totalHeight = computed(() => items.value.length * itemHeight)

  const handleScroll = () => {
    if (scrollContainer.value) {
      scrollTop.value = scrollContainer.value.scrollTop
      containerHeight.value = scrollContainer.value.clientHeight
    }
  }

  onMounted(() => {
    if (scrollContainer.value) {
      containerHeight.value = scrollContainer.value.clientHeight
      scrollContainer.value.addEventListener('scroll', handleScroll)
    }
  })

  onUnmounted(() => {
    if (scrollContainer.value) {
      scrollContainer.value.removeEventListener('scroll', handleScroll)
    }
  })

  return {
    scrollContainer,
    visibleItems,
    visibleRange,
    totalHeight,
  }
}
