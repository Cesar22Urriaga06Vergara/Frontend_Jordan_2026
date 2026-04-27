export function usePagination(initialPage = 1, initialLimit = 15) {
  const pagina = ref(initialPage)
  const total = ref(0)
  const LIMITE = initialLimit

  const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / LIMITE)))
  
  const isFirstPage = computed(() => pagina.value === 1)
  const isLastPage = computed(() => pagina.value >= totalPaginas.value)

  function resetPage() {
    pagina.value = 1
  }

  function nextPage() {
    if (!isLastPage.value) pagina.value++
  }

  function prevPage() {
    if (!isFirstPage.value) pagina.value--
  }

  function goToPage(page: number) {
    const p = Math.max(1, Math.min(page, totalPaginas.value))
    pagina.value = p
  }

  return {
    pagina,
    total,
    LIMITE,
    totalPaginas,
    isFirstPage,
    isLastPage,
    resetPage,
    nextPage,
    prevPage,
    goToPage,
  }
}
