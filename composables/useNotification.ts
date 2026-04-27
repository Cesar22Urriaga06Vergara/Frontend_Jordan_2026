interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
}

export const useNotification = () => {
  const notifications = useState<Notification[]>('notifications', () => [])

  const show = (
    type: Notification['type'],
    message: string,
    duration = 3500,
  ) => {
    const duplicated = notifications.value.find(
      (n) => n.type === type && n.message === message,
    )
    if (duplicated) {
      return
    }

    const id = Math.random().toString(36).slice(2)
    notifications.value.push({ id, type, message })
    setTimeout(() => {
      notifications.value = notifications.value.filter((n) => n.id !== id)
    }, duration)
  }

  return {
    notifications,
    success: (msg: string) => show('success', msg),
    error: (msg: string) => show('error', msg),
    warning: (msg: string) => show('warning', msg),
    info: (msg: string) => show('info', msg),
  }
}
