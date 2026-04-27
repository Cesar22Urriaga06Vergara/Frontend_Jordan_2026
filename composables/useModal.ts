export function useModal() {
  const isOpen = ref(false)
  const data = ref<any>(null)

  function open(payload?: any) {
    data.value = payload ?? null
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
    data.value = null
  }

  function toggle(payload?: any) {
    if (isOpen.value) {
      close()
    } else {
      open(payload)
    }
  }

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
  }
}
