<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Inventario y producción</h1>
        <p class="mt-1 text-sm text-gray-500">Stock, alertas, producción, cierre de inventario y tanques del periodo.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button class="btn-secondary inline-flex items-center gap-2" @click="exportExcel">
          <FileSpreadsheet class="h-4 w-4" />
          Excel
        </button>
        <button class="btn-secondary inline-flex items-center gap-2" @click="exportPdf">
          <FileText class="h-4 w-4" />
          PDF
        </button>
        <button class="btn-secondary inline-flex items-center gap-2" @click="fetchAll">
          <RefreshCw class="h-4 w-4" />
          Actualizar
        </button>
      </div>
    </div>

    <section class="card">
      <div class="flex flex-wrap items-end gap-3">
        <label class="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Desde
          <input v-model="filtroDesde" type="date" class="form-input mt-1 w-40" @change="fetchAll" />
        </label>
        <label class="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Hasta
          <input v-model="filtroHasta" type="date" class="form-input mt-1 w-40" @change="fetchAll" />
        </label>
      </div>
    </section>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
      <StatCard label="Productos en stock" :value="String(inventarioActual.length)" :icon="Boxes" color="blue" :loading="loading" />
      <StatCard label="Alertas de stock" :value="String(stockBajo.length)" :icon="AlertTriangle" color="orange" :loading="loading" />
      <StatCard label="Produccion usable" :value="String(totalProducido)" :icon="Factory" color="green" :loading="loading" />
      <StatCard label="Litros en tanques" :value="String(totalLitrosTanques)" :icon="Droplets" color="purple" :loading="loading" />
    </div>

    <section v-if="stockBajo.length" class="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div class="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 class="font-semibold text-amber-900">Stock casi agotado</h2>
          <p class="text-sm text-amber-700">Productos en o por debajo del mínimo configurado.</p>
        </div>
        <span class="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">{{ stockBajo.length }} alertas</span>
      </div>
      <ReportTable :headers="['Producto', 'Stock', 'Mínimo', 'Faltante']" :rows="stockBajoRows" />
    </section>

    <section class="card">
      <h2 class="mb-4 font-semibold text-gray-700">Resumen por fecha</h2>
      <ReportTable
        :headers="['Fecha', 'Estado', 'Inicial', 'Producción', 'Esperado', 'Real', 'Diferencia', 'Litros tanques']"
        :rows="resumenRows"
      />
    </section>

    <section class="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <div class="card">
        <h2 class="mb-4 font-semibold text-gray-700">Producción registrada</h2>
        <ReportTable :headers="produccionHeaders" :rows="produccionRows" />
      </div>
      <div class="card">
        <h2 class="mb-4 font-semibold text-gray-700">Stock actual</h2>
        <ReportTable :headers="['Producto', 'Stock actual', 'Stock mínimo', 'Estado']" :rows="inventarioActualRows" />
      </div>
    </section>

    <section class="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <div class="card">
        <h2 class="mb-4 font-semibold text-gray-700">Inventario de cierre</h2>
        <ReportTable
          :headers="['Fecha', 'Producto', 'Inicial', 'Producido', 'Salidas', 'Devoluciones', 'Esperado', 'Real', 'Dif.']"
          :rows="cierreInventarioRows"
        />
      </div>
      <div class="card">
        <h2 class="mb-4 font-semibold text-gray-700">Tanques al cierre</h2>
        <ReportTable :headers="['Fecha', 'Tanque', 'Litros']" :rows="tanquesRows" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { AlertTriangle, Boxes, Droplets, Factory, FileSpreadsheet, FileText, RefreshCw } from 'lucide-vue-next'
import { todayISO } from '~/utils/formats'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const apiResponse = useApiResponse()
const notify = useNotification()

const filtroDesde = ref(todayISO())
const filtroHasta = ref(todayISO())
const loading = ref(true)
const estadosDiarios = ref<any[]>([])
const inventarioActual = ref<any[]>([])
const stockBajo = ref<any[]>([])
const produccionHeaders = ['Fecha', 'Producto', 'Usable', 'Filtradas', 'Reempacadas', 'Merma', 'Observaciones']

function localISO(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function dateFromISO(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function displayDateISO(value: string) {
  if (!value) return '-'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function fechasDelPeriodo() {
  const fechas: string[] = []
  const cursor = dateFromISO(filtroDesde.value)
  const end = dateFromISO(filtroHasta.value)
  while (cursor <= end) {
    fechas.push(localISO(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return fechas
}

function total(items: any[], field: string) {
  return items.reduce((sum, item) => sum + Number(item?.[field] ?? 0), 0)
}

const resumenRows = computed(() =>
  estadosDiarios.value.map((estado: any) => {
    const inicial = estado.apertura?.inventariosInicial ?? []
    const produccion = estado.apertura?.producciondiaria ?? []
    const cierre = estado.cierre?.cierreInventario ?? []
    const tanques = estado.cierre?.cierreTanquesAgua ?? []
    return [
      displayDateISO(estado.fecha),
      estado.estado ?? '-',
      total(inicial, 'cantidadInicial'),
      total(produccion, 'cantidad'),
      total(cierre, 'cantidadEsperada'),
      total(cierre, 'cantidadContada'),
      total(cierre, 'diferencia'),
      total(tanques, 'litrosContados'),
    ]
  }),
)

const produccionRows = computed(() =>
  estadosDiarios.value.flatMap((estado: any) =>
    (estado.apertura?.producciondiaria ?? []).map((item: any) => [
      displayDateISO(estado.fecha),
      item.producto?.nombre ?? `Producto ${item.productoId ?? ''}`,
      Number(item.cantidad ?? 0),
      Number(item.cantidadFiltrada ?? 0),
      Number(item.cantidadReempacada ?? 0),
      Number(item.cantidadMerma ?? 0),
      item.observaciones ?? '-',
    ]),
  ),
)

const inventarioActualRows = computed(() =>
  inventarioActual.value.map((item: any) => [
    item.producto?.nombre ?? `Producto ${item.productoId ?? ''}`,
    Number(item.stockActual ?? 0),
    Number(item.stockMinimo ?? 0),
    Number(item.stockActual ?? 0) <= Number(item.stockMinimo ?? 0) ? 'Bajo' : 'OK',
  ]),
)

const stockBajoRows = computed(() =>
  stockBajo.value.map((item: any) => [
    item.producto?.nombre ?? `Producto ${item.productoId ?? ''}`,
    Number(item.stockActual ?? 0),
    Number(item.stockMinimo ?? 0),
    Math.max(0, Number(item.stockMinimo ?? 0) - Number(item.stockActual ?? 0)),
  ]),
)

const cierreInventarioRows = computed(() =>
  estadosDiarios.value.flatMap((estado: any) =>
    (estado.cierre?.cierreInventario ?? []).map((item: any) => [
      displayDateISO(estado.fecha),
      item.producto?.nombre ?? `Producto ${item.productoId ?? ''}`,
      Number(item.cantidadInicial ?? 0),
      Number(item.cantidadProducida ?? 0),
      Number(item.cantidadSalida ?? 0),
      Number(item.cantidadDevoluciones ?? 0),
      Number(item.cantidadEsperada ?? 0),
      Number(item.cantidadContada ?? 0),
      Number(item.diferencia ?? 0),
    ]),
  ),
)

const tanquesRows = computed(() =>
  estadosDiarios.value.flatMap((estado: any) =>
    (estado.cierre?.cierreTanquesAgua ?? []).map((item: any) => [
      displayDateISO(estado.fecha),
      item.tanqueAgua?.nombre ?? `Tanque ${item.tanqueAguaId ?? ''}`,
      Number(item.litrosContados ?? 0),
    ]),
  ),
)

const totalProducido = computed(() =>
  produccionRows.value.reduce((sum, row) => sum + Number(row[2] ?? 0), 0),
)

const totalLitrosTanques = computed(() =>
  tanquesRows.value.reduce((sum, row) => sum + Number(row[2] ?? 0), 0),
)

async function fetchAll() {
  if (dateFromISO(filtroDesde.value) > dateFromISO(filtroHasta.value)) {
    notify.warning('La fecha inicial no puede ser mayor que la final')
    return
  }

  loading.value = true
  try {
    const fechas = fechasDelPeriodo()
    const [inventarioRes, stockBajoRes, ...estadoResponses] = await Promise.allSettled([
      api.get('/inventarios', { params: { limit: 500 } }),
      api.get('/inventarios/stock-bajo'),
      ...fechas.map(fecha => api.get('/diario/estado', { params: { fecha } })),
    ])

    inventarioActual.value = inventarioRes.status === 'fulfilled' ? apiResponse.list(inventarioRes.value) : []
    stockBajo.value = stockBajoRes.status === 'fulfilled' ? apiResponse.list(stockBajoRes.value) : []
    estadosDiarios.value = estadoResponses.map((response, index) => {
      if (response.status !== 'fulfilled') return { fecha: fechas[index], estado: 'sin_datos' }
      const data = apiResponse.unwrap(response.value) as any
      return { ...data, fecha: data?.fecha ?? fechas[index] }
    })
  } catch {
    notify.error('No se pudo cargar el reporte')
  } finally {
    loading.value = false
  }
}

function sheetFromRows(XLSX: any, headers: string[], rows: any[][]) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  ws['!cols'] = headers.map(header => ({ wch: Math.max(14, header.length + 4) }))
  return ws
}

async function exportExcel() {
  try {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, sheetFromRows(XLSX, ['Fecha', 'Estado', 'Inicial', 'Producción', 'Esperado', 'Real', 'Diferencia', 'Litros tanques'], resumenRows.value), 'Resumen')
    XLSX.utils.book_append_sheet(wb, sheetFromRows(XLSX, ['Producto', 'Stock actual', 'Stock mínimo', 'Estado'], inventarioActualRows.value), 'StockActual')
    XLSX.utils.book_append_sheet(wb, sheetFromRows(XLSX, ['Producto', 'Stock', 'Mínimo', 'Faltante'], stockBajoRows.value), 'StockBajo')
    XLSX.utils.book_append_sheet(wb, sheetFromRows(XLSX, produccionHeaders, produccionRows.value), 'Produccion')
    XLSX.utils.book_append_sheet(wb, sheetFromRows(XLSX, ['Fecha', 'Producto', 'Inicial', 'Producido', 'Salidas', 'Devoluciones', 'Esperado', 'Real', 'Dif.'], cierreInventarioRows.value), 'CierreInventario')
    XLSX.utils.book_append_sheet(wb, sheetFromRows(XLSX, ['Fecha', 'Tanque', 'Litros'], tanquesRows.value), 'Tanques')
    XLSX.writeFile(wb, `reporte_inventario_produccion_${filtroDesde.value}_${filtroHasta.value}.xlsx`)
    notify.success('Excel descargado')
  } catch {
    notify.error('No se pudo generar el Excel')
  }
}

async function exportPdf() {
  try {
    const [jsPDFModule, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ])
    const doc = new jsPDFModule.jsPDF({ orientation: 'landscape', unit: 'mm' })
    const autoTable = (autoTableModule as any).default ?? (autoTableModule as any).autoTable
    if (!autoTable) throw new Error('autoTable no disponible')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('JORDAN - Inventario y producción', 14, 14)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Periodo: ${displayDateISO(filtroDesde.value)} a ${displayDateISO(filtroHasta.value)}`, 14, 21)

    autoTable(doc, {
      startY: 28,
      head: [['Fecha', 'Estado', 'Inicial', 'Producción', 'Esperado', 'Real', 'Diferencia', 'Litros tanques']],
      body: resumenRows.value,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [23, 59, 87] },
    })

    autoTable(doc, {
      startY: ((doc as any).lastAutoTable?.finalY ?? 28) + 8,
      head: [['Producto', 'Stock actual', 'Stock mínimo', 'Estado']],
      body: inventarioActualRows.value,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    })

    autoTable(doc, {
      startY: ((doc as any).lastAutoTable?.finalY ?? 28) + 8,
      head: [produccionHeaders],
      body: produccionRows.value,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 163, 74] },
    })

    autoTable(doc, {
      startY: ((doc as any).lastAutoTable?.finalY ?? 28) + 8,
      head: [['Fecha', 'Producto', 'Inicial', 'Producido', 'Salidas', 'Devoluciones', 'Esperado', 'Real', 'Dif.']],
      body: cierreInventarioRows.value,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [234, 88, 12] },
    })

    autoTable(doc, {
      startY: ((doc as any).lastAutoTable?.finalY ?? 28) + 8,
      head: [['Fecha', 'Tanque', 'Litros']],
      body: tanquesRows.value,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [124, 58, 237] },
    })

    doc.save(`reporte_inventario_produccion_${filtroDesde.value}_${filtroHasta.value}.pdf`)
    notify.success('PDF descargado')
  } catch {
    notify.error('No se pudo generar el PDF')
  }
}

onMounted(fetchAll)
</script>
