<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <h1 class="text-2xl font-bold text-gray-800">Reportes</h1>
      <div class="flex gap-2">
        <input v-model="filtroDesde" type="date" class="form-input w-40" @change="fetchAll" />
        <input v-model="filtroHasta" type="date" class="form-input w-40" @change="fetchAll" />
        <button class="btn-secondary" @click="exportExcel">Descargar Excel</button>
        <button class="btn-secondary" @click="exportPdf">Descargar PDF</button>
        <button class="btn-secondary" @click="fetchAll">Actualizar</button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Ventas (período)" :value="formatCurrency(kpi.totalVentas)" icon="💰" color="green" :loading="loading" />
      <StatCard label="Cobrado (período)" :value="formatCurrency(kpi.totalCobrado)" icon="✅" color="blue" :loading="loading" />
      <StatCard label="Cartera pendiente" :value="formatCurrency(kpi.carteraPendiente)" icon="📊" color="orange" :loading="loading" />
      <StatCard label="Pedidos entregados" :value="String(kpi.pedidosEntregados)" icon="📦" color="purple" :loading="loading" />
    </div>

    <!-- Ventas por estado -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="card">
        <h2 class="font-semibold text-gray-700 mb-4">Ventas por estado</h2>
        <div v-if="loading" class="text-gray-400 text-sm text-center py-4">Cargando…</div>
        <div v-else class="space-y-2">
          <div
            v-for="item in ventasPorEstado"
            :key="item.estado"
            class="flex items-center gap-3"
          >
            <EstadoBadge :estado="item.estado" />
            <div class="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                class="h-2 rounded-full bg-blue-500 transition-all"
                :style="{ width: `${item.pct}%` }"
              />
            </div>
            <span class="text-sm text-gray-600 w-16 text-right">{{ item.count }}</span>
            <span class="text-sm font-medium text-gray-800 w-28 text-right">{{ formatCurrency(item.total) }}</span>
          </div>
          <div v-if="!ventasPorEstado.length" class="text-gray-400 text-sm text-center py-2">Sin datos</div>
        </div>
      </div>

      <div class="card">
        <h2 class="font-semibold text-gray-700 mb-4">Pedidos por estado</h2>
        <div v-if="loading" class="text-gray-400 text-sm text-center py-4">Cargando…</div>
        <div v-else class="space-y-2">
          <div
            v-for="item in pedidosPorEstado"
            :key="item.estado"
            class="flex items-center gap-3"
          >
            <EstadoBadge :estado="item.estado" />
            <div class="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                class="h-2 rounded-full bg-purple-500 transition-all"
                :style="{ width: `${item.pct}%` }"
              />
            </div>
            <span class="text-sm text-gray-600 w-16 text-right">{{ item.count }}</span>
          </div>
          <div v-if="!pedidosPorEstado.length" class="text-gray-400 text-sm text-center py-2">Sin datos</div>
        </div>
      </div>
    </div>

    <!-- Top clientes cartera -->
    <div class="card">
      <h2 class="font-semibold text-gray-700 mb-4">Clientes con mayor deuda</h2>
      <div v-if="loading" class="text-gray-400 text-sm text-center py-4">Cargando…</div>
      <div v-else>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 border-b text-xs uppercase">
              <th class="pb-2 font-medium">#</th>
              <th class="pb-2 font-medium">Cliente</th>
              <th class="pb-2 font-medium text-right">Saldo pendiente</th>
              <th class="pb-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(c, i) in topCartera"
              :key="c.id"
              class="border-b border-gray-50"
            >
              <td class="py-2 text-gray-400 text-xs">{{ i + 1 }}</td>
              <td class="py-2 font-medium text-gray-800">{{ c.cliente?.nombre ?? '—' }}</td>
              <td class="py-2 text-right font-semibold text-orange-600">{{ formatCurrency(c.saldoPendiente) }}</td>
              <td class="py-2"><EstadoBadge :estado="c.estado ?? 'ACTIVO'" /></td>
            </tr>
            <tr v-if="!topCartera.length">
              <td colspan="4" class="py-4 text-center text-gray-400">Sin deudas pendientes</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Rutas resumen -->
    <div class="card">
      <h2 class="font-semibold text-gray-700 mb-4">Rutas recientes</h2>
      <div v-if="loading" class="text-gray-400 text-sm text-center py-4">Cargando…</div>
      <div v-else>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 border-b text-xs uppercase">
              <th class="pb-2 font-medium">Número</th>
              <th class="pb-2 font-medium">Fecha</th>
              <th class="pb-2 font-medium">Trabajador</th>
              <th class="pb-2 font-medium text-center">Pedidos</th>
              <th class="pb-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in rutasRecientes"
              :key="r.id"
              class="border-b border-gray-50"
            >
              <td class="py-2 font-medium">{{ r.numero }}</td>
              <td class="py-2 text-gray-500">{{ formatDate(r.fecha) }}</td>
              <td class="py-2 text-gray-500">{{ r.domiciliario?.nombre ?? '—' }}</td>
              <td class="py-2 text-center text-gray-600">{{ r.itemsRuta?.length ?? '—' }}</td>
              <td class="py-2"><EstadoBadge :estado="r.estado" /></td>
            </tr>
            <tr v-if="!rutasRecientes.length">
              <td colspan="5" class="py-4 text-center text-gray-400">Sin rutas</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency, formatDate, todayISO } from '~/utils/formats'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const notify = useNotification()
const apiResponse = useApiResponse()

function localISO(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Last 30 days default (local time)
const d30ago = new Date()
d30ago.setDate(d30ago.getDate() - 30)
const filtroDesde = ref(localISO(d30ago))
const filtroHasta = ref(todayISO())

const loading = ref(true)

const kpi = reactive({
  totalVentas: 0, totalCobrado: 0, carteraPendiente: 0, pedidosEntregados: 0,
})

const ventasPorEstado = ref<{ estado: string; count: number; total: number; pct: number }[]>([])
const pedidosPorEstado = ref<{ estado: string; count: number; pct: number }[]>([])
const topCartera = ref<any[]>([])
const rutasRecientes = ref<any[]>([])
const ventasRaw = ref<any[]>([])
const pedidosRaw = ref<any[]>([])
const carteraRaw = ref<any[]>([])
const rutasRaw = ref<any[]>([])

function nombreArchivo(base: string) {
  return `${base}_${filtroDesde.value}_${filtroHasta.value}`
}

async function exportExcel() {
  try {
    const XLSX = await import('xlsx')

    const resumenPorCliente = Object.values(
      pedidosRaw.value.reduce((acc: Record<string, any>, p: any) => {
        const clienteId = p.clienteId ?? 0
        const key = String(clienteId)
        const totalPedido = (p.detalles ?? []).reduce(
          (s: number, d: any) => s + Number(d.subtotal ?? 0),
          0,
        )
        if (!acc[key]) {
          acc[key] = {
            cliente: p.cliente?.nombre ?? `Cliente ${clienteId}`,
            pedidos: 0,
            entregados: 0,
            pendientes: 0,
            totalPedidos: 0,
          }
        }
        acc[key].pedidos += 1
        acc[key].entregados += p.estado === 'ENTREGADO' ? 1 : 0
        acc[key].pendientes += p.estado === 'PENDIENTE' ? 1 : 0
        acc[key].totalPedidos += totalPedido
        return acc
      }, {}),
    )

    const pedidosDetallados = pedidosRaw.value.flatMap((p: any) => {
      const detalles = p.detalles ?? []
      if (!detalles.length) {
        return [{
          fecha: formatDate(p.fecha),
          pedido: p.numero,
          cliente: p.cliente?.nombre ?? '—',
          estado: p.estado,
          producto: '—',
          cantidad: 0,
          precioUnitario: 0,
          subtotal: 0,
          totalPedido: 0,
          observaciones: p.observaciones ?? '',
        }]
      }
      const totalPedido = detalles.reduce((s: number, d: any) => s + Number(d.subtotal ?? 0), 0)
      return detalles.map((d: any) => ({
        fecha: formatDate(p.fecha),
        pedido: p.numero,
        cliente: p.cliente?.nombre ?? '—',
        estado: p.estado,
        producto: d.producto?.nombre ?? d.productoId,
        cantidad: Number(d.cantidad ?? 0),
        precioUnitario: Number(d.precioUnitario ?? 0),
        subtotal: Number(d.subtotal ?? 0),
        totalPedido,
        observaciones: p.observaciones ?? '',
      }))
    })

    const resumen = [
      { indicador: 'Ventas (periodo)', valor: kpi.totalVentas },
      { indicador: 'Cobrado (periodo)', valor: kpi.totalCobrado },
      { indicador: 'Cartera pendiente', valor: kpi.carteraPendiente },
      { indicador: 'Pedidos entregados', valor: kpi.pedidosEntregados },
    ]

    const wsResumen = XLSX.utils.json_to_sheet(resumen)
    wsResumen['!cols'] = [{ wch: 30 }, { wch: 20 }]

    const wsClientes = XLSX.utils.json_to_sheet(
      resumenPorCliente
        .sort((a: any, b: any) => Number(b.totalPedidos) - Number(a.totalPedidos))
        .map((c: any) => ({
          cliente: c.cliente,
          pedidos: c.pedidos,
          entregados: c.entregados,
          pendientes: c.pendientes,
          totalPedidos: Number(c.totalPedidos ?? 0),
        })),
    )
    wsClientes['!cols'] = [{ wch: 30 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 18 }]

    const wsPedidosDetalle = XLSX.utils.json_to_sheet(pedidosDetallados)
    wsPedidosDetalle['!cols'] = [
      { wch: 12 },
      { wch: 18 },
      { wch: 26 },
      { wch: 14 },
      { wch: 24 },
      { wch: 10 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 30 },
    ]

    const wsVentasEstado = XLSX.utils.json_to_sheet(
      ventasPorEstado.value.map(v => ({ estado: v.estado, cantidad: v.count, total: v.total })),
    )
    wsVentasEstado['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 18 }]

    const wsPedidosEstado = XLSX.utils.json_to_sheet(
      pedidosPorEstado.value.map(p => ({ estado: p.estado, cantidad: p.count })),
    )
    wsPedidosEstado['!cols'] = [{ wch: 20 }, { wch: 12 }]

    const wsCartera = XLSX.utils.json_to_sheet(
      carteraRaw.value.map(c => ({
        cliente: c.cliente?.nombre ?? '—',
        saldoPendiente: Number(c.saldoPendiente ?? 0),
        venta: c.venta?.numero ?? '—',
        fechaVenta: c.venta?.fecha ? formatDate(c.venta.fecha) : '—',
        estadoVenta: c.venta?.estado ?? '—',
      })),
    )
    wsCartera['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 14 }]

    const wsRutas = XLSX.utils.json_to_sheet(
      rutasRaw.value.map((r: any) => ({
        numero: r.numero,
        fecha: formatDate(r.fecha),
        estado: r.estado,
        trabajador: r.domiciliario?.nombre ?? '—',
        pedidos: r.itemsRuta?.length ?? 0,
      })),
    )
    wsRutas['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 24 }, { wch: 10 }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')
    XLSX.utils.book_append_sheet(wb, wsClientes, 'Clientes')
    XLSX.utils.book_append_sheet(wb, wsPedidosDetalle, 'PedidosDetalle')
    XLSX.utils.book_append_sheet(wb, wsVentasEstado, 'VentasEstado')
    XLSX.utils.book_append_sheet(wb, wsPedidosEstado, 'PedidosEstado')
    XLSX.utils.book_append_sheet(wb, wsCartera, 'CarteraDetalle')
    XLSX.utils.book_append_sheet(wb, wsRutas, 'Rutas')
    XLSX.writeFile(wb, `${nombreArchivo('reporte_jordan')}.xlsx`)
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

    const doc = new jsPDFModule.jsPDF({ orientation: 'landscape' })
    const autoTable =
      (autoTableModule as any).default ??
      (autoTableModule as any).autoTable

    if (!autoTable) throw new Error('autoTable no disponible')

    doc.setFontSize(14)
    doc.text('JORDAN - Reporte consolidado', 14, 14)
    doc.setFontSize(10)
    doc.text(`Periodo: ${filtroDesde.value} a ${filtroHasta.value}`, 14, 21)

    autoTable(doc, {
      startY: 28,
      head: [['Indicador', 'Valor']],
      body: [
        ['Ventas (periodo)', formatCurrency(kpi.totalVentas)],
        ['Cobrado (periodo)', formatCurrency(kpi.totalCobrado)],
        ['Cartera pendiente', formatCurrency(kpi.carteraPendiente)],
        ['Pedidos entregados', String(kpi.pedidosEntregados)],
      ],
    })

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [['Estado venta', 'Cantidad', 'Total']],
      body: ventasPorEstado.value.map(v => [v.estado, String(v.count), formatCurrency(v.total)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
    })

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [['Cliente', 'Pedidos', 'Entregados', 'Pendientes', 'Total pedido']],
      body: Object.values(
        pedidosRaw.value.reduce((acc: Record<string, any>, p: any) => {
          const key = String(p.clienteId ?? 0)
          const totalPedido = (p.detalles ?? []).reduce(
            (s: number, d: any) => s + Number(d.subtotal ?? 0),
            0,
          )
          if (!acc[key]) {
            acc[key] = {
              cliente: p.cliente?.nombre ?? `Cliente ${p.clienteId ?? ''}`,
              pedidos: 0,
              entregados: 0,
              pendientes: 0,
              total: 0,
            }
          }
          acc[key].pedidos += 1
          acc[key].entregados += p.estado === 'ENTREGADO' ? 1 : 0
          acc[key].pendientes += p.estado === 'PENDIENTE' ? 1 : 0
          acc[key].total += totalPedido
          return acc
        }, {}),
      )
        .sort((a: any, b: any) => Number(b.total) - Number(a.total))
        .slice(0, 20)
        .map((c: any) => [
          c.cliente,
          String(c.pedidos),
          String(c.entregados),
          String(c.pendientes),
          formatCurrency(c.total),
        ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 163, 74] },
    })

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [['Fecha', 'Pedido', 'Cliente', 'Estado', 'Producto', 'Cant.', 'Subtotal']],
      body: pedidosRaw.value
        .flatMap((p: any) =>
          (p.detalles ?? []).map((d: any) => [
            formatDate(p.fecha),
            p.numero,
            p.cliente?.nombre ?? '—',
            p.estado,
            d.producto?.nombre ?? d.productoId,
            String(Number(d.cantidad ?? 0)),
            formatCurrency(Number(d.subtotal ?? 0)),
          ]),
        )
        .slice(0, 120),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [234, 88, 12] },
    })

    doc.save(`${nombreArchivo('reporte_jordan')}.pdf`)
    notify.success('PDF descargado')
  } catch (error) {
    notify.error('No se pudo generar el PDF')
  }
}

function toArray(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  return []
}

async function fetchAll() {
  loading.value = true
  try {
    const params = {
      fechaDesde: `${filtroDesde.value} 00:00:00`,
      fechaHasta: `${filtroHasta.value} 23:59:59`,
      limit: 500,
    }
    const [vRes, pRes, cRes, rRes] = await Promise.allSettled([
      api.get('/operaciones/ventas', { params }),
      api.get('/operaciones/pedidos', { params: { ...params, limit: 500 } }),
      api.get('/operaciones/ventas/cartera/resumen'),
      api.get('/operaciones/rutas', {
        params: {
          limit: 500,
          fechaDesde: filtroDesde.value,
          fechaHasta: filtroHasta.value,
        },
      }),
    ])

    // Ventas
    if (vRes.status === 'fulfilled') {
      const d = apiResponse.unwrap(vRes.value) as any
      const ventas = toArray(d)
      ventasRaw.value = ventas
      kpi.totalVentas = ventas.reduce((s, v) => s + Number(v.totalVenta ?? 0), 0)
      kpi.totalCobrado = ventas.reduce((s, v) => s + Number(v.totalPagado ?? 0), 0)
      // por estado
      const map: Record<string, { count: number; total: number }> = {}
      for (const v of ventas) {
        const k = v.estado ?? 'DESCONOCIDO'
        if (!map[k]) map[k] = { count: 0, total: 0 }
        map[k].count++
        map[k].total += Number(v.totalVenta ?? 0)
      }
      const maxCount = Math.max(...Object.values(map).map(x => x.count), 1)
      ventasPorEstado.value = Object.entries(map)
        .map(([estado, x]) => ({ estado, ...x, pct: Math.round((x.count / maxCount) * 100) }))
        .sort((a, b) => b.count - a.count)
    }

    // Pedidos
    if (pRes.status === 'fulfilled') {
      const d = apiResponse.unwrap(pRes.value) as any
      const pedidos = toArray(d)
      pedidosRaw.value = pedidos
      kpi.pedidosEntregados = pedidos.filter(p => p.estado === 'ENTREGADO').length
      const mapP: Record<string, number> = {}
      for (const p of pedidos) { mapP[p.estado ?? ''] = (mapP[p.estado ?? ''] ?? 0) + 1 }
      const maxP = Math.max(...Object.values(mapP), 1)
      pedidosPorEstado.value = Object.entries(mapP)
        .map(([estado, count]) => ({ estado, count, pct: Math.round((count / maxP) * 100) }))
        .sort((a, b) => b.count - a.count)
    }

    // Cartera
    if (cRes.status === 'fulfilled') {
      const d = apiResponse.unwrap(cRes.value) as any
      const carteras = toArray(d)
      carteraRaw.value = carteras
      kpi.carteraPendiente = carteras.reduce((s, c) => s + Number(c.saldoPendiente ?? 0), 0)
      topCartera.value = [...carteras]
        .sort((a, b) => b.saldoPendiente - a.saldoPendiente)
        .slice(0, 10)
    }

    // Rutas
    if (rRes.status === 'fulfilled') {
      const d = apiResponse.unwrap(rRes.value) as any
      rutasRaw.value = toArray(d)
      rutasRecientes.value = rutasRaw.value
    }
  } catch {
    notify.error('Error al cargar reportes')
  } finally {
    loading.value = false
  }
}

onMounted(fetchAll)
</script>
