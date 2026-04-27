export interface ExportOptions {
  filename?: string
  format?: 'csv' | 'json'
  includeHeaders?: boolean
}

export function useExport() {
  const notify = useNotification()
  const exporting = ref(false)

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  async function exportToCSV<T extends object>(
    data: T[],
    options: ExportOptions = {}
  ) {
    const { filename = 'export', includeHeaders = true } = options

    if (data.length === 0) {
      notify.warning('No hay datos para exportar')
      return
    }

    exporting.value = true
    try {
      const headers = Object.keys(data[0])
      let csv = ''

      if (includeHeaders) {
        csv += headers.join(',') + '\n'
      }

      csv += data
        .map((row) =>
          headers
            .map((header) => {
              const value = (row as Record<string, any>)[header]
              // Escapar comillas y saltos de línea
              if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
                return `"${value.replace(/"/g, '""')}"`
              }
              return value ?? ''
            })
            .join(',')
        )
        .join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      downloadBlob(blob, `${filename}.csv`)
      notify.success('Datos exportados correctamente')
    } catch (error: any) {
      notify.error(`Error al exportar: ${error?.message}`)
    } finally {
      exporting.value = false
    }
  }

  async function exportToJSON<T extends object>(
    data: T[],
    options: ExportOptions = {}
  ) {
    const { filename = 'export' } = options

    if (data.length === 0) {
      notify.warning('No hay datos para exportar')
      return
    }

    exporting.value = true
    try {
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], {
        type: 'application/json;charset=utf-8;',
      })
      downloadBlob(blob, `${filename}.json`)
      notify.success('Datos exportados correctamente')
    } catch (error: any) {
      notify.error(`Error al exportar: ${error?.message}`)
    } finally {
      exporting.value = false
    }
  }

  async function exportToExcel<T extends object>(
    data: T[],
    options: ExportOptions = {}
  ) {
    const { filename = 'export' } = options

    if (data.length === 0) {
      notify.warning('No hay datos para exportar')
      return
    }

    exporting.value = true
    try {
      // Para Excel básico, usar CSV es suficiente
      await exportToCSV(data, { ...options, filename })
    } finally {
      exporting.value = false
    }
  }

  return {
    exporting,
    exportToCSV,
    exportToJSON,
    exportToExcel,
  }
}
