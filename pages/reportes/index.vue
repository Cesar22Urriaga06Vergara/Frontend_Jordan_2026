<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Reportes</h1>
          <p class="text-sm text-gray-500 mt-1">Periodo activo: {{ periodoLabel() }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button class="btn-secondary" @click="exportExcel">Descargar Excel</button>
          <button class="btn-secondary" @click="exportPdf">Descargar PDF</button>
          <button class="btn-secondary" @click="fetchAll">Actualizar</button>
        </div>
      </div>

      <div class="card bg-slate-50 border border-slate-200">
        <div class="flex flex-wrap items-end gap-3">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="option in reportOptions"
              :key="option.value"
              type="button"
              :class="[
                'px-3 py-2 rounded-lg text-sm font-semibold transition',
                reporteTipo === option.value ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300',
              ]"
              @click="setReportType(option.value)"
            >
              {{ option.label }}
            </button>
          </div>

          <label v-if="reporteTipo !== 'personalizado'" class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Fecha de referencia
            <input v-model="fechaReferencia" type="date" class="form-input w-40 mt-1" @change="applyReportType(reporteTipo)" />
          </label>

          <template v-else>
            <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Desde
              <input v-model="filtroDesde" type="date" class="form-input w-40 mt-1" @change="fetchAll" />
            </label>
            <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Hasta
              <input v-model="filtroHasta" type="date" class="form-input w-40 mt-1" @change="fetchAll" />
            </label>
          </template>

          <p class="text-xs text-slate-500">
            Diario usa solo la fecha elegida. Trimestral, semestral y anual se calculan hacia atrás desde la fecha de referencia.
          </p>
        </div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Ventas (período)" :value="formatCurrency(kpi.totalVentas)" :icon="DollarSign" color="green" :loading="loading" />
      <StatCard label="Cobrado (período)" :value="formatCurrency(kpi.totalCobrado)" :icon="CheckCircle" color="blue" :loading="loading" />
      <StatCard label="Cartera pendiente" :value="formatCurrency(kpi.carteraPendiente)" :icon="BarChart3" color="orange" :loading="loading" />
      <StatCard label="Pedidos entregados" :value="String(kpi.pedidosEntregados)" :icon="Package" color="purple" :loading="loading" />
      <StatCard label="Egresos caja" :value="formatCurrency(kpi.totalEgresos)" :icon="ReceiptText" color="orange" :loading="loading" />
      <StatCard label="Pagos trabajadores" :value="formatCurrency(kpi.totalPagosTrabajadores)" :icon="HandCoins" color="green" :loading="loading" />
      <StatCard label="Anticipos emitidos" :value="formatCurrency(kpi.totalAnticipos)" :icon="WalletCards" color="purple" :loading="loading" />
      <StatCard label="Saldo deudas trabajadores" :value="formatCurrency(kpi.saldoDeudasTrabajadores)" :icon="WalletCards" color="orange" :loading="loading" />
      <StatCard label="Resultado caja" :value="formatCurrency(kpi.resultadoCaja)" :icon="Scale" color="blue" :loading="loading" />
    </div>

    <!-- Pedidos por trabajador -->
    <div class="card">
      <div class="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 class="font-semibold text-gray-700">Pedidos y pacas por trabajador</h2>
          <p class="text-xs text-gray-500">Agrupa los pedidos del periodo por el trabajador asociado al momento de crear el pedido.</p>
        </div>
        <span class="text-sm font-semibold text-blue-700">
          {{ pedidosRaw.length }} pedidos
        </span>
      </div>
      <div v-if="loading" class="text-gray-400 text-sm text-center py-4">Cargando...</div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b text-xs uppercase">
            <th class="pb-2 font-medium">Trabajador</th>
            <th class="pb-2 font-medium text-center">Pedidos</th>
            <th class="pb-2 font-medium text-center">Entregados</th>
            <th class="pb-2 font-medium text-center">Pacas</th>
            <th class="pb-2 font-medium">Productos vendidos</th>
            <th class="pb-2 font-medium text-right">Total pedidos</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in resumenPedidosTrabajadores()" :key="t.trabajador" class="border-b border-gray-50">
            <td class="py-2 font-medium text-gray-800">{{ t.trabajador }}</td>
            <td class="py-2 text-center text-gray-600">{{ t.pedidos }}</td>
            <td class="py-2 text-center text-gray-600">{{ t.entregados }}</td>
            <td class="py-2 text-center font-semibold text-blue-700">{{ t.pacas }}</td>
            <td class="py-2 text-gray-500">{{ t.productosDetalle }}</td>
            <td class="py-2 text-right font-semibold">{{ formatCurrency(t.total) }}</td>
          </tr>
          <tr v-if="!resumenPedidosTrabajadores().length">
            <td colspan="6" class="py-4 text-center text-gray-400">Sin pedidos asociados a trabajadores</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Ventas detalladas por trabajador y precio -->
    <div class="card">
      <div class="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 class="font-semibold text-gray-700">Ventas detalladas por trabajador y precio</h2>
          <p class="text-xs text-gray-500">Desglose de productos vendidos por trabajador, separados por el precio unitario registrado en cada pedido.</p>
        </div>
      </div>
      <div v-if="loading" class="text-gray-400 text-sm text-center py-4">Cargando...</div>
      <div v-else-if="!ventasDetalladasPorTrabajadorPrecio().length" class="text-gray-400 text-sm text-center py-4">
        Sin ventas con detalle de productos en el periodo
      </div>
      <div v-else class="space-y-6">
        <div
          v-for="t in ventasDetalladasPorTrabajadorPrecio()"
          :key="t.trabajador"
          class="border border-gray-100 rounded-lg overflow-hidden"
        >
          <div class="bg-blue-50 px-4 py-2 border-b border-gray-100">
            <h3 class="font-semibold text-gray-800">Trabajador: {{ t.trabajador }}</h3>
          </div>
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-gray-500 border-b text-xs uppercase bg-white">
                <th class="px-4 py-2 font-medium">Producto</th>
                <th class="px-4 py-2 font-medium text-right">Precio unitario</th>
                <th class="px-4 py-2 font-medium text-right">Cantidad</th>
                <th class="px-4 py-2 font-medium text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(linea, idx) in t.lineas"
                :key="`${linea.producto}-${linea.precioUnitario}-${idx}`"
                class="border-b border-gray-50"
              >
                <td class="px-4 py-2 text-gray-800">{{ linea.producto }}</td>
                <td class="px-4 py-2 text-right text-gray-600">{{ formatCurrency(linea.precioUnitario) }}</td>
                <td class="px-4 py-2 text-right text-gray-600">{{ cantidadLabel(linea.cantidad) }}</td>
                <td class="px-4 py-2 text-right font-medium">{{ formatCurrency(linea.subtotal) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="bg-gray-50">
                <td colspan="3" class="px-4 py-2 text-right font-semibold text-gray-700">
                  Total vendido {{ t.trabajador }}:
                </td>
                <td class="px-4 py-2 text-right font-bold text-blue-700">{{ formatCurrency(t.total) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <!-- Caja y egresos -->
    <div class="card">
      <div class="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 class="font-semibold text-gray-700">Caja y egresos del periodo</h2>
          <p class="text-xs text-gray-500">Incluye egresos manuales, pagos a trabajadores, anticipos y prestamos registrados en caja.</p>
        </div>
        <span class="text-sm font-semibold" :class="kpi.resultadoCaja >= 0 ? 'text-green-700' : 'text-orange-600'">
          Neto: {{ formatCurrency(kpi.resultadoCaja) }}
        </span>
      </div>
      <div v-if="loading" class="text-gray-400 text-sm text-center py-4">Cargando...</div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b text-xs uppercase">
            <th class="pb-2 font-medium">Fecha</th>
            <th class="pb-2 font-medium">Tipo</th>
            <th class="pb-2 font-medium">Concepto</th>
            <th class="pb-2 font-medium">Trabajador</th>
            <th class="pb-2 font-medium text-right">Monto</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in egresosRaw.slice(0, 12)" :key="m.id" class="border-b border-gray-50">
            <td class="py-2 text-gray-500">{{ formatReportDate(m.fecha) }}</td>
            <td class="py-2"><EstadoBadge :estado="m.tipo" /></td>
            <td class="py-2 font-medium text-gray-800">
              {{ m.concepto ?? '-' }}
              <span v-if="m.observaciones" class="block text-xs font-normal text-gray-500">{{ m.observaciones }}</span>
            </td>
            <td class="py-2 text-gray-500">{{ m.trabajador?.nombre ?? '-' }}</td>
            <td class="py-2 text-right font-semibold text-orange-600">{{ formatCurrency(m.monto) }}</td>
          </tr>
          <tr v-if="!egresosRaw.length">
            <td colspan="5" class="py-4 text-center text-gray-400">Sin egresos en el periodo</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Trabajadores resumen -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="card">
        <h2 class="font-semibold text-gray-700 mb-4">Labores registradas</h2>
        <div v-if="loading" class="text-gray-400 text-sm text-center py-4">Cargando...</div>
        <table v-else class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 border-b text-xs uppercase">
              <th class="pb-2 font-medium">Trabajador</th>
              <th class="pb-2 font-medium">Labor</th>
              <th class="pb-2 font-medium text-center">Cant.</th>
              <th class="pb-2 font-medium text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in laboresRaw.slice(0, 12)" :key="l.id" class="border-b border-gray-50">
              <td class="py-2 font-medium text-gray-800">{{ l.trabajador?.nombre ?? '-' }}</td>
              <td class="py-2 text-gray-500">{{ l.laborTarifa?.laborTipo?.nombre ?? '-' }}</td>
              <td class="py-2 text-center text-gray-600">{{ l.cantidadRealizado ?? '-' }}</td>
              <td class="py-2 text-right font-semibold">{{ formatCurrency(l.montoAPagar) }}</td>
            </tr>
            <tr v-if="!laboresRaw.length">
              <td colspan="4" class="py-4 text-center text-gray-400">Sin labores registradas</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <h2 class="font-semibold text-gray-700 mb-4">Pagos, anticipos y abonos</h2>
        <div v-if="loading" class="text-gray-400 text-sm text-center py-4">Cargando...</div>
        <div v-else class="space-y-3">
          <div class="grid grid-cols-2 xl:grid-cols-4 gap-2 text-center">
            <div class="rounded-lg bg-green-50 p-3">
              <p class="text-xs text-green-700 font-semibold">Pagado</p>
              <p class="font-bold text-gray-800">{{ formatCurrency(kpi.totalPagosTrabajadores) }}</p>
            </div>
            <div class="rounded-lg bg-purple-50 p-3">
              <p class="text-xs text-purple-700 font-semibold">Anticipado</p>
              <p class="font-bold text-gray-800">{{ formatCurrency(kpi.totalAnticipos) }}</p>
            </div>
            <div class="rounded-lg bg-blue-50 p-3">
              <p class="text-xs text-blue-700 font-semibold">Abonos</p>
              <p class="font-bold text-gray-800">{{ formatCurrency(kpi.totalAbonosDeuda) }}</p>
            </div>
            <div class="rounded-lg bg-orange-50 p-3">
              <p class="text-xs text-orange-700 font-semibold">Saldo deuda</p>
              <p class="font-bold text-gray-800">{{ formatCurrency(kpi.saldoDeudasTrabajadores) }}</p>
            </div>
          </div>
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-gray-500 border-b text-xs uppercase">
                <th class="pb-2 font-medium">Fecha</th>
                <th class="pb-2 font-medium">Trabajador</th>
                <th class="pb-2 font-medium">Movimiento</th>
                <th class="pb-2 font-medium text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in movimientosTrabajadores.slice(0, 10)" :key="m.key" class="border-b border-gray-50">
                <td class="py-2 text-gray-500">{{ formatReportDate(m.fecha) }}</td>
                <td class="py-2 font-medium text-gray-800">{{ m.trabajador }}</td>
                <td class="py-2 text-gray-500">{{ m.tipo }}</td>
                <td class="py-2 text-right font-semibold">{{ formatCurrency(m.monto) }}</td>
              </tr>
              <tr v-if="!movimientosTrabajadores.length">
                <td colspan="4" class="py-4 text-center text-gray-400">Sin movimientos de trabajadores</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 class="font-semibold text-gray-700">Anticipos, prestamos y saldos</h2>
          <p class="text-xs text-gray-500">Muestra el valor original, lo abonado y el saldo real pendiente por trabajador.</p>
        </div>
        <span class="text-sm font-semibold text-orange-600">
          Saldo: {{ formatCurrency(kpi.saldoDeudasTrabajadores) }}
        </span>
      </div>
      <div v-if="loading" class="text-gray-400 text-sm text-center py-4">Cargando...</div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b text-xs uppercase">
            <th class="pb-2 font-medium">Fecha</th>
            <th class="pb-2 font-medium">Trabajador</th>
            <th class="pb-2 font-medium">Numero</th>
            <th class="pb-2 font-medium">Tipo</th>
            <th class="pb-2 font-medium text-right">Monto</th>
            <th class="pb-2 font-medium text-right">Abonado</th>
            <th class="pb-2 font-medium text-right">Saldo</th>
            <th class="pb-2 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in deudasTrabajadoresRows().slice(0, 12)" :key="d[2]" class="border-b border-gray-50">
            <td class="py-2 text-gray-500">{{ d[0] }}</td>
            <td class="py-2 font-medium text-gray-800">{{ d[1] }}</td>
            <td class="py-2 text-gray-500">{{ d[2] }}</td>
            <td class="py-2 text-gray-500">{{ d[3] }}</td>
            <td class="py-2 text-right font-semibold">{{ formatCurrency(d[4]) }}</td>
            <td class="py-2 text-right font-semibold text-blue-700">{{ formatCurrency(d[5]) }}</td>
            <td class="py-2 text-right font-semibold text-orange-600">{{ formatCurrency(d[6]) }}</td>
            <td class="py-2"><EstadoBadge :estado="d[7]" /></td>
          </tr>
          <tr v-if="!deudasTrabajadoresRows().length">
            <td colspan="8" class="py-4 text-center text-gray-400">Sin anticipos o prestamos en el periodo</td>
          </tr>
        </tbody>
      </table>
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
              <td class="py-2 text-gray-500">{{ formatReportDate(r.fecha) }}</td>
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
import { BarChart3, CheckCircle, DollarSign, HandCoins, Package, ReceiptText, Scale, WalletCards } from 'lucide-vue-next'
import { formatCurrency, todayISO } from '~/utils/formats'

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

function dateFromISO(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function addMonths(date: Date, months: number) {
  const value = new Date(date)
  value.setMonth(value.getMonth() + months)
  return value
}

function startOfWeek(date: Date) {
  const value = new Date(date)
  const day = value.getDay() || 7
  value.setDate(value.getDate() - day + 1)
  return value
}

function endOfWeek(date: Date) {
  const value = startOfWeek(date)
  value.setDate(value.getDate() + 6)
  return value
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

type ReportType = 'diario' | 'semanal' | 'mensual' | 'trimestral' | 'semestral' | 'anual' | 'personalizado'

const reportOptions: { label: string; value: ReportType }[] = [
  { label: 'Diario', value: 'diario' },
  { label: 'Semanal', value: 'semanal' },
  { label: 'Mensual', value: 'mensual' },
  { label: 'Trimestral', value: 'trimestral' },
  { label: 'Semestral', value: 'semestral' },
  { label: 'Anual', value: 'anual' },
  { label: 'Personalizado', value: 'personalizado' },
]

const fechaReferencia = ref(todayISO())
const filtroDesde = ref(todayISO())
const filtroHasta = ref(todayISO())
const reporteTipo = ref<ReportType>('diario')

const loading = ref(true)

const kpi = reactive({
  totalVentas: 0, totalCobrado: 0, carteraPendiente: 0, pedidosEntregados: 0,
  totalEgresos: 0, totalPagosTrabajadores: 0, totalAnticipos: 0,
  totalAbonosDeuda: 0, saldoDeudasTrabajadores: 0, resultadoCaja: 0, totalLabores: 0,
})

const ventasPorEstado = ref<{ estado: string; count: number; total: number; pct: number }[]>([])
const pedidosPorEstado = ref<{ estado: string; count: number; pct: number }[]>([])
const topCartera = ref<any[]>([])
const rutasRecientes = ref<any[]>([])
const ventasRaw = ref<any[]>([])
const pedidosRaw = ref<any[]>([])
const carteraRaw = ref<any[]>([])
const rutasRaw = ref<any[]>([])
const egresosRaw = ref<any[]>([])
const laboresRaw = ref<any[]>([])
const pagosTrabajadoresRaw = ref<any[]>([])
const anticiposRaw = ref<any[]>([])
const abonosRaw = ref<any[]>([])
const lastLoadedRange = ref('')
const loadingRange = ref('')
let activeFetch: Promise<void> | null = null
const PAGE_SIZE = 250
const emptyLabel = '-'
const reportColors = {
  navy: '173B57',
  blue: '2563EB',
  green: '16A34A',
  orange: 'EA580C',
  slate: '475569',
  light: 'F8FAFC',
  white: 'FFFFFF',
}

function nombreArchivo(base: string) {
  return `${base}_${filtroDesde.value}_${filtroHasta.value}`
}

function displayDateISO(value: string) {
  if (!value) return emptyLabel
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function periodoLabel() {
  return `${displayDateISO(filtroDesde.value)} a ${displayDateISO(filtroHasta.value)}`
}

function reporteTipoLabel() {
  return reportOptions.find(option => option.value === reporteTipo.value)?.label ?? 'Personalizado'
}

function currentRangeKey() {
  return `${reporteTipo.value}:${filtroDesde.value}:${filtroHasta.value}`
}

function applyReportType(type: ReportType) {
  const reference = dateFromISO(fechaReferencia.value)

  if (type === 'diario') {
    filtroDesde.value = localISO(reference)
    filtroHasta.value = localISO(reference)
  } else if (type === 'semanal') {
    filtroDesde.value = localISO(startOfWeek(reference))
    filtroHasta.value = localISO(endOfWeek(reference))
  } else if (type === 'mensual') {
    filtroDesde.value = localISO(startOfMonth(reference))
    filtroHasta.value = localISO(endOfMonth(reference))
  } else if (type === 'trimestral') {
    filtroDesde.value = localISO(addMonths(reference, -3))
    filtroHasta.value = localISO(reference)
  } else if (type === 'semestral') {
    filtroDesde.value = localISO(addMonths(reference, -6))
    filtroHasta.value = localISO(reference)
  } else if (type === 'anual') {
    filtroDesde.value = localISO(addMonths(reference, -12))
    filtroHasta.value = localISO(reference)
  }

  void fetchAll()
}

function setReportType(type: ReportType) {
  reporteTipo.value = type
  if (type === 'personalizado') {
    void fetchAll()
    return
  }

  applyReportType(type)
}

function fechaKey(value: string | Date) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  }
  return localISO(value instanceof Date ? value : new Date(value))
}

function formatReportDate(value: string | Date | null | undefined) {
  if (!value) return emptyLabel
  return displayDateISO(fechaKey(value))
}

function isDateInActiveRange(value: string | Date) {
  const key = fechaKey(value)
  return key >= filtroDesde.value && key <= filtroHasta.value
}

function totalPedido(pedido: any) {
  return (pedido.detalles ?? []).reduce((s: number, d: any) => s + Number(d.subtotal ?? 0), 0)
}

function facturaPrincipal(pedido: any) {
  return Array.isArray(pedido.ventas) && pedido.ventas.length ? pedido.ventas[0] : undefined
}

function numeroFactura(pedido: any) {
  return facturaPrincipal(pedido)?.numero ?? 'Sin factura'
}

function estadoFactura(pedido: any) {
  return facturaPrincipal(pedido)?.estado ?? 'SIN FACTURA'
}

function saldoFactura(pedido: any) {
  return Number(facturaPrincipal(pedido)?.saldoPendiente ?? 0)
}

function ventasFacturadasPeriodo(ventas = ventasRaw.value) {
  return ventas.filter((venta: any) => venta.fecha && isDateInActiveRange(venta.fecha))
}

function pagosPeriodo(ventas = ventasRaw.value) {
  return ventas.flatMap((venta: any) =>
    (venta.pagos ?? [])
      .filter((pago: any) => pago.fecha && isDateInActiveRange(pago.fecha))
      .map((pago: any) => ({ venta, pago })),
  )
}

function observacionMovimientoFactura(venta: any, pago?: any) {
  if (!pago) return 'Registro de factura emitida dentro del periodo seleccionado.'
  const mismaFecha = fechaKey(venta.fecha) === fechaKey(pago.fecha)
  if (mismaFecha) return 'Pago aplicado el mismo dia de emision de la factura.'
  if (venta.estado === 'COMPLETADA') return 'Pago posterior: la factura quedo cancelada en una fecha diferente a su emision.'
  if (venta.estado === 'PARCIAL') return 'Abono posterior: la factura conserva saldo pendiente.'
  return 'Pago posterior registrado sobre esta factura.'
}

function facturasMovimientos() {
  const movimientos: any[][] = []

  for (const venta of ventasRaw.value) {
    if (venta.fecha && isDateInActiveRange(venta.fecha)) {
      movimientos.push([
        formatReportDate(venta.fecha),
        'FACTURA',
        venta.cliente?.nombre ?? emptyLabel,
        venta.numero ?? emptyLabel,
        formatReportDate(venta.fecha),
        venta.estado ?? emptyLabel,
        Number(venta.totalVenta ?? 0),
        0,
        Number(venta.saldoPendiente ?? 0),
        observacionMovimientoFactura(venta),
      ])
    }

    for (const pago of venta.pagos ?? []) {
      if (!pago.fecha || !isDateInActiveRange(pago.fecha)) continue
      movimientos.push([
        formatReportDate(pago.fecha),
        pago.numero ? `PAGO ${pago.numero}` : 'PAGO',
        venta.cliente?.nombre ?? emptyLabel,
        venta.numero ?? emptyLabel,
        formatReportDate(venta.fecha),
        venta.estado ?? emptyLabel,
        Number(venta.totalVenta ?? 0),
        Number(pago.monto ?? 0),
        Number(venta.saldoPendiente ?? 0),
        observacionMovimientoFactura(venta, pago),
      ])
    }
  }

  return movimientos.sort((a, b) => {
    const fechaA = String(a[0]).split('/').reverse().join('-')
    const fechaB = String(b[0]).split('/').reverse().join('-')
    return fechaA.localeCompare(fechaB) || String(a[3]).localeCompare(String(b[3]))
  })
}

function resumenPorFecha() {
  const map: Record<string, any> = {}

  for (const pedido of pedidosRaw.value) {
    const key = fechaKey(pedido.fecha)
    if (!map[key]) {
      map[key] = { fecha: displayDateISO(key), pedidos: 0, entregados: 0, pendientes: 0, totalPedidos: 0, ventas: 0, cobrado: 0 }
    }
    map[key].pedidos += 1
    map[key].entregados += pedido.estado === 'ENTREGADO' ? 1 : 0
    map[key].pendientes += pedido.estado === 'PENDIENTE' ? 1 : 0
    map[key].totalPedidos += totalPedido(pedido)
  }

  for (const venta of ventasRaw.value) {
    if (venta.fecha && isDateInActiveRange(venta.fecha)) {
      const key = fechaKey(venta.fecha)
      if (!map[key]) {
        map[key] = { fecha: displayDateISO(key), pedidos: 0, entregados: 0, pendientes: 0, totalPedidos: 0, ventas: 0, cobrado: 0 }
      }
      map[key].ventas += Number(venta.totalVenta ?? 0)
    }

    for (const pago of venta.pagos ?? []) {
      if (!pago.fecha || !isDateInActiveRange(pago.fecha)) continue
      const key = fechaKey(pago.fecha)
      if (!map[key]) {
        map[key] = { fecha: displayDateISO(key), pedidos: 0, entregados: 0, pendientes: 0, totalPedidos: 0, ventas: 0, cobrado: 0 }
      }
      map[key].cobrado += Number(pago.monto ?? 0)
    }
  }

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => value)
}

function resumenProductos() {
  const map: Record<string, any> = {}

  for (const pedido of pedidosRaw.value) {
    for (const detalle of pedido.detalles ?? []) {
      const producto = detalle.producto?.nombre ?? `Producto ${detalle.productoId ?? ''}`
      if (!map[producto]) {
        map[producto] = { producto, cantidad: 0, total: 0 }
      }
      map[producto].cantidad += Number(detalle.cantidad ?? 0)
      map[producto].total += Number(detalle.subtotal ?? 0)
    }
  }

  return Object.values(map).sort((a: any, b: any) => Number(b.total) - Number(a.total))
}

function trabajadorPedido(pedido: any) {
  const id = String(pedido.trabajadorId ?? pedido.trabajador?.id ?? '0')
  return {
    id,
    nombre: pedido.trabajador?.nombre ?? (id === '0' ? 'Sin trabajador asignado' : `Trabajador ${id}`),
  }
}

function productoEsPaca(detalle: any) {
  const producto = detalle.producto ?? {}
  const texto = `${producto.nombre ?? ''} ${producto.codigo ?? ''} ${producto.categoria ?? ''}`.toUpperCase()
  return texto.includes('PACA')
}

function resumenPedidosTrabajadores() {
  const map: Record<string, any> = {}

  for (const pedido of pedidosRaw.value) {
    const trabajador = trabajadorPedido(pedido)
    if (!map[trabajador.id]) {
      map[trabajador.id] = {
        trabajador: trabajador.nombre,
        pedidos: 0,
        entregados: 0,
        pacas: 0,
        total: 0,
        productos: new Map<string, number>(),
      }
    }

    const item = map[trabajador.id]
    item.pedidos += 1
    item.entregados += pedido.estado === 'ENTREGADO' ? 1 : 0
    item.total += totalPedido(pedido)

    for (const detalle of pedido.detalles ?? []) {
      const cantidad = Number(detalle.cantidad ?? 0)
      const producto = detalle.producto?.nombre ?? `Producto ${detalle.productoId ?? ''}`
      item.productos.set(producto, (item.productos.get(producto) ?? 0) + cantidad)
      if (productoEsPaca(detalle)) item.pacas += cantidad
    }
  }

  return Object.values(map)
    .map((item: any) => ({
      ...item,
      productosDetalle: [...item.productos.entries()]
        .map(([producto, cantidad]) => `${producto}: ${cantidadLabel(cantidad)}`)
        .join('; ') || emptyLabel,
    }))
    .sort((a: any, b: any) => Number(b.total) - Number(a.total))
}

function pedidosTrabajadorProductoRows() {
  return resumenPedidosTrabajadores().map((item: any) => [
    item.trabajador,
    item.pedidos,
    item.entregados,
    item.pacas,
    item.productosDetalle,
    Number(item.total ?? 0),
  ])
}

function ventasDetalladasPorTrabajadorPrecio() {
  const map: Record<string, {
    trabajador: string
    total: number
    lineas: Map<string, { producto: string; precioUnitario: number; cantidad: number; subtotal: number }>
  }> = {}

  for (const pedido of pedidosRaw.value) {
    const trabajador = trabajadorPedido(pedido)
    if (!map[trabajador.id]) {
      map[trabajador.id] = {
        trabajador: trabajador.nombre,
        total: 0,
        lineas: new Map(),
      }
    }

    const item = map[trabajador.id]
    for (const detalle of pedido.detalles ?? []) {
      const producto = detalle.producto?.nombre ?? `Producto ${detalle.productoId ?? ''}`
      const precioUnitario = Number(detalle.precioUnitario ?? 0)
      const cantidad = Number(detalle.cantidad ?? 0)
      const subtotal = Number(detalle.subtotal ?? cantidad * precioUnitario)
      const key = `${producto}\0${precioUnitario}`

      if (!item.lineas.has(key)) {
        item.lineas.set(key, { producto, precioUnitario, cantidad: 0, subtotal: 0 })
      }

      const linea = item.lineas.get(key)!
      linea.cantidad += cantidad
      linea.subtotal += subtotal
      item.total += subtotal
    }
  }

  return Object.values(map)
    .map(item => ({
      trabajador: item.trabajador,
      total: item.total,
      lineas: [...item.lineas.values()].sort((a, b) => {
        const byProducto = a.producto.localeCompare(b.producto, 'es')
        if (byProducto !== 0) return byProducto
        return a.precioUnitario - b.precioUnitario
      }),
    }))
    .filter(item => item.lineas.length > 0)
    .sort((a, b) => b.total - a.total)
}

function ventasDetalladasTrabajadorPrecioExportRows() {
  const rows: any[][] = []

  for (const item of ventasDetalladasPorTrabajadorPrecio()) {
    for (const linea of item.lineas) {
      rows.push([
        item.trabajador,
        linea.producto,
        Number(linea.precioUnitario),
        Number(linea.cantidad),
        Number(linea.subtotal),
      ])
    }
    rows.push([
      `Total vendido ${item.trabajador}`,
      '',
      '',
      '',
      Number(item.total),
    ])
  }

  return rows
}

function uniqueById(items: any[]) {
  const map = new Map<string, any>()
  for (const item of items) {
    const key = String(item?.id ?? `${item?.anticipoPrestamoId ?? ''}-${item?.fecha ?? ''}-${item?.monto ?? ''}`)
    if (!map.has(key)) map.set(key, item)
  }
  return [...map.values()]
}

function abonosFromAnticipos() {
  return anticiposRaw.value.flatMap((anticipo: any) =>
    (anticipo.abonos ?? []).map((abono: any) => ({
      ...abono,
      trabajador: abono.trabajador ?? anticipo.trabajador,
      anticipoPrestamo: abono.anticipoPrestamo ?? anticipo,
    })),
  )
}

function abonosConsolidados() {
  return uniqueById([...abonosRaw.value, ...abonosFromAnticipos()])
}

function abonosPeriodoConsolidados() {
  return abonosConsolidados().filter((abono: any) => !abono.fecha || isDateInActiveRange(abono.fecha))
}

function totalAbonadoAnticipo(anticipo: any) {
  return (anticipo.abonos ?? []).reduce((s: number, abono: any) => s + Number(abono.monto ?? 0), 0)
}

function saldoAnticipo(anticipo: any) {
  return Math.max(0, Number(anticipo.monto ?? 0) - totalAbonadoAnticipo(anticipo))
}

const movimientosTrabajadores = computed(() => {
  const pagos = pagosTrabajadoresRaw.value.map((p: any) => ({
    key: `pago-${p.id}`,
    fecha: p.fecha,
    trabajador: p.trabajador?.nombre ?? '-',
    tipo: 'Pago trabajador',
    monto: Number(p.montoEntregado ?? p.montoBase ?? 0),
  }))
  const anticipos = anticiposRaw.value.map((a: any) => ({
    key: `anticipo-${a.id}`,
    fecha: a.fecha,
    trabajador: a.trabajador?.nombre ?? '-',
    tipo: a.tipo ?? 'Anticipo',
    monto: Number(a.monto ?? 0),
  }))
  const abonos = abonosPeriodoConsolidados().map((a: any) => ({
    key: `abono-${a.id}`,
    fecha: a.fecha,
    trabajador: a.trabajador?.nombre ?? '-',
    tipo: 'Abono deuda',
    monto: Number(a.monto ?? 0),
  }))

  return [...pagos, ...anticipos, ...abonos].sort((a, b) => fechaKey(b.fecha).localeCompare(fechaKey(a.fecha)))
})

function cantidadLabel(value: any) {
  const numero = Number(value ?? 0)
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(numero)
}

function unidadLaborLabel(labor: any, cantidad: number) {
  const tipo = labor.laborTarifa?.laborTipo?.tipo
  const unidad = String(labor.laborTarifa?.unidad ?? '').toUpperCase()
  if (tipo === 'POR_PACA' || unidad === 'PACA') return cantidad === 1 ? 'paca' : 'pacas'
  if (tipo === 'POR_HORA' || unidad === 'HORA') return cantidad === 1 ? 'hora' : 'horas'
  return cantidad === 1 ? 'jornada' : 'jornadas'
}

function laborDetalleLabel(labor: any) {
  const nombre = labor.laborTarifa?.laborTipo?.nombre ?? emptyLabel
  const cantidad = Number(labor.cantidadRealizado ?? 0)
  const unidad = unidadLaborLabel(labor, cantidad)
  const tarifa = Number(labor.laborTarifa?.tarifa ?? 0)

  if (tarifa > 0) {
    return `${nombre}: ${cantidadLabel(cantidad)} ${unidad} x ${formatCurrency(tarifa)}`
  }

  return `${nombre}: ${cantidadLabel(cantidad)} ${unidad}`
}

function ensureResumenTrabajador(map: Record<string, any>, id: string, nombre: string) {
  if (!map[id]) {
    map[id] = {
      trabajador: nombre,
      labores: 0,
      laboresDetalle: [] as string[],
      generado: 0,
      pagado: 0,
      anticipado: 0,
      abonado: 0,
    }
  }

  return map[id]
}

function resumenTrabajadores() {
  const map: Record<string, any> = {}

  for (const labor of laboresRaw.value) {
    const id = String(labor.trabajadorId ?? labor.trabajador?.id ?? '0')
    const item = ensureResumenTrabajador(map, id, labor.trabajador?.nombre ?? `Trabajador ${id}`)
    item.labores += 1
    item.laboresDetalle.push(laborDetalleLabel(labor))
    item.generado += Number(labor.montoAPagar ?? 0)
  }

  for (const pago of pagosTrabajadoresRaw.value) {
    const id = String(pago.trabajadorId ?? pago.trabajador?.id ?? '0')
    const item = ensureResumenTrabajador(map, id, pago.trabajador?.nombre ?? `Trabajador ${id}`)
    item.pagado += Number(pago.montoEntregado ?? pago.montoBase ?? 0)
  }

  for (const anticipo of anticiposRaw.value) {
    const id = String(anticipo.trabajadorId ?? anticipo.trabajador?.id ?? '0')
    const item = ensureResumenTrabajador(map, id, anticipo.trabajador?.nombre ?? `Trabajador ${id}`)
    item.anticipado += Number(anticipo.monto ?? 0)
  }

  for (const abono of abonosPeriodoConsolidados()) {
    const id = String(abono.trabajadorId ?? abono.trabajador?.id ?? '0')
    const item = ensureResumenTrabajador(map, id, abono.trabajador?.nombre ?? `Trabajador ${id}`)
    item.abonado += Number(abono.monto ?? 0)
  }

  return Object.values(map)
    .map((item: any) => ({
      ...item,
      laboresDetalle: item.laboresDetalle.length ? item.laboresDetalle.join('; ') : emptyLabel,
    }))
    .sort((a: any, b: any) => Number(b.generado + b.pagado + b.anticipado) - Number(a.generado + a.pagado + a.anticipado))
}

function egresosRows() {
  return egresosRaw.value.map((m: any) => [
    formatReportDate(m.fecha),
    m.tipo ?? emptyLabel,
    m.concepto ?? emptyLabel,
    m.observaciones ?? emptyLabel,
    m.trabajador?.nombre ?? emptyLabel,
    Number(m.monto ?? 0),
    m.medioPago ?? emptyLabel,
  ])
}

function laboresRows() {
  return laboresRaw.value.map((l: any) => [
    formatReportDate(l.fecha),
    l.trabajador?.nombre ?? emptyLabel,
    l.laborTarifa?.laborTipo?.nombre ?? emptyLabel,
    l.cantidadRealizado ?? 0,
    Number(l.montoAPagar ?? 0),
    l.observaciones ?? emptyLabel,
  ])
}

function movimientosTrabajadoresRows() {
  return movimientosTrabajadores.value.map((m: any) => [
    formatReportDate(m.fecha),
    m.trabajador,
    m.tipo,
    Number(m.monto ?? 0),
  ])
}

function deudasTrabajadoresRows() {
  return anticiposRaw.value.map((a: any) => [
    formatReportDate(a.fecha),
    a.trabajador?.nombre ?? emptyLabel,
    a.numero ?? emptyLabel,
    a.tipo ?? emptyLabel,
    Number(a.monto ?? 0),
    totalAbonadoAnticipo(a),
    saldoAnticipo(a),
    a.estado ?? emptyLabel,
    a.motivo ?? a.observaciones ?? emptyLabel,
  ])
}

function applySheetStyle(XLSX: any, ws: any, color = reportColors.navy, moneyColumns: number[] = []) {
  if (!ws['!ref']) return
  const range = XLSX.utils.decode_range(ws['!ref'])
  ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) }

  for (let col = range.s.c; col <= range.e.c; col++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c: col })]
    if (cell) {
      cell.s = {
        font: { bold: true, color: { rgb: reportColors.white } },
        fill: { fgColor: { rgb: color } },
        alignment: { horizontal: 'center' },
      }
    }
  }

  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    for (const col of moneyColumns) {
      const cell = ws[XLSX.utils.encode_cell({ r: row, c: col })]
      if (cell && typeof cell.v === 'number') {
        cell.t = 'n'
        cell.z = '"$"#,##0'
      }
    }
  }
}

function escapeHtml(value: any) {
  return String(value ?? emptyLabel)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function htmlRows(rows: any[][], moneyColumns: number[] = []) {
  return rows
    .map(row => `
      <tr>
        ${row
          .map((value, index) => {
            const isNumber = typeof value === 'number'
            const text = moneyColumns.includes(index) ? formatCurrency(Number(value ?? 0)) : value
            return `<td class="${isNumber ? 'num' : ''}">${escapeHtml(text)}</td>`
          })
          .join('')}
      </tr>
    `)
    .join('')
}

function htmlTable(title: string, headers: string[], rows: any[][], color = reportColors.navy, moneyColumns: number[] = [], description = '') {
  return `
    <section class="section">
      <h2 style="border-left-color:#${color}">${escapeHtml(title)}</h2>
      ${description ? `<p class="section-note">${escapeHtml(description)}</p>` : ''}
      <table>
        <thead>
          <tr>${headers.map(header => `<th style="border-top-color:#${color}">${escapeHtml(header)}</th>`).join('')}</tr>
        </thead>
        <tbody>${rows.length ? htmlRows(rows, moneyColumns) : `<tr><td colspan="${headers.length}" class="empty">Sin datos</td></tr>`}</tbody>
      </table>
    </section>
  `
}

function htmlInfoBox(title: string, items: string[]) {
  return `
    <section class="section info-box">
      <h2 style="border-left-color:#${reportColors.navy}">${escapeHtml(title)}</h2>
      <ul>
        ${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
    </section>
  `
}

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

async function ensureFreshReportData() {
  if (loading.value && activeFetch) {
    await activeFetch
  }

  if (lastLoadedRange.value !== currentRangeKey()) {
    await fetchAll()
  }

  return lastLoadedRange.value === currentRangeKey()
}

function exportExcelEmpresarial() {
  const clientes = Object.values(
    pedidosRaw.value.reduce((acc: Record<string, any>, p: any) => {
      const key = String(p.clienteId ?? 0)
      if (!acc[key]) {
        acc[key] = { cliente: p.cliente?.nombre ?? `Cliente ${p.clienteId ?? ''}`, pedidos: 0, entregados: 0, pendientes: 0, total: 0 }
      }
      acc[key].pedidos += 1
      acc[key].entregados += p.estado === 'ENTREGADO' ? 1 : 0
      acc[key].pendientes += p.estado === 'PENDIENTE' ? 1 : 0
      acc[key].total += totalPedido(p)
      return acc
    }, {}),
  )
    .sort((a: any, b: any) => Number(b.total) - Number(a.total))
    .map((c: any) => [c.cliente, c.pedidos, c.entregados, c.pendientes, c.total])

  const pedidoRows = pedidosRaw.value.flatMap((p: any) => {
    const detalles = p.detalles ?? []
    const pedidoTotal = totalPedido(p)
    if (!detalles.length) {
      return [[
        formatReportDate(p.fecha),
        p.numero,
        p.cliente?.nombre ?? emptyLabel,
        trabajadorPedido(p).nombre,
        p.estado,
        numeroFactura(p),
        estadoFactura(p),
        saldoFactura(p),
        emptyLabel,
        0,
        0,
        0,
        0,
        p.observaciones ?? '',
      ]]
    }
    return detalles.map((d: any) => [
      formatReportDate(p.fecha),
      p.numero,
      p.cliente?.nombre ?? emptyLabel,
      trabajadorPedido(p).nombre,
      p.estado,
      numeroFactura(p),
      estadoFactura(p),
      saldoFactura(p),
      d.producto?.nombre ?? d.productoId,
      Number(d.cantidad ?? 0),
      Number(d.precioUnitario ?? 0),
      Number(d.subtotal ?? 0),
      pedidoTotal,
      p.observaciones ?? '',
    ])
  })

  const pedidosPorDia = resumenPorFecha()
    .map((dia: any) => {
      const rows = pedidoRows.filter(row => row[0] === dia.fecha)
      return htmlTable(`Pedidos del ${dia.fecha}`, ['Fecha', 'Pedido', 'Cliente', 'Trabajador', 'Estado pedido', 'Factura', 'Estado factura', 'Saldo factura', 'Producto', 'Cant.', 'Precio unit.', 'Subtotal', 'Total pedido', 'Observaciones'], rows, reportColors.orange, [7, 10, 11, 12], 'Detalle operativo de los pedidos registrados en esa fecha.')
    })
    .join('')

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Reporte JORDAN</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <style>
          body { font-family: Aptos, Calibri, Arial, sans-serif; color: #0f172a; background: #f8fafc; }
          .cover { background: #f8fafc; color: #0f172a; padding: 24px 28px; border: 1px solid #cbd5e1; border-left: 8px solid #173b57; border-radius: 14px; margin-bottom: 18px; }
          .cover h1 { margin: 0; font-size: 28px; letter-spacing: 1px; color: #173b57; }
          .cover p { margin: 6px 0 0; color: #334155; font-size: 13px; }
          .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; }
          .kpi { background: white; border: 1px solid #cbd5e1; border-left: 6px solid #2563eb; padding: 14px; border-radius: 10px; }
          .kpi small { display: block; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
          .kpi strong { display: block; margin-top: 7px; font-size: 20px; color: #0f172a; }
          .section { margin: 22px 0; background: white; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; }
          h2 { margin: 0 0 10px; padding-left: 10px; border-left: 5px solid #173b57; font-size: 17px; color: #173b57; }
          .section-note { margin: -4px 0 10px; color: #64748b; font-size: 12px; }
          .info-box { background: #f8fafc; border-left: 5px solid #173b57; }
          .info-box ul { margin: 0; padding-left: 18px; color: #334155; font-size: 12px; }
          .info-box li { margin: 4px 0; }
          table { border-collapse: collapse; width: 100%; background: white; }
          th { color: #0f172a; background: #f1f5f9; text-transform: uppercase; font-size: 11px; letter-spacing: .05em; padding: 9px; border: 1px solid #cbd5e1; border-top: 3px solid #173b57; }
          td { padding: 8px; border: 1px solid #e2e8f0; font-size: 12px; vertical-align: top; white-space: normal; }
          tr:nth-child(even) td { background: #f8fafc; }
          .num { text-align: right; mso-number-format: "#,##0"; }
          .empty { text-align: center; color: #64748b; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="cover">
          <h1>JORDAN - Reporte consolidado</h1>
          <p>Tipo: ${escapeHtml(reporteTipoLabel())} | Periodo: ${escapeHtml(periodoLabel())} | Generado: ${escapeHtml(new Date().toLocaleString('es-CO'))}</p>
        </div>
        <div class="kpis">
          <div class="kpi"><small>Ventas periodo</small><strong>${escapeHtml(formatCurrency(kpi.totalVentas))}</strong></div>
          <div class="kpi"><small>Cobrado periodo</small><strong>${escapeHtml(formatCurrency(kpi.totalCobrado))}</strong></div>
          <div class="kpi"><small>Cartera pendiente</small><strong>${escapeHtml(formatCurrency(kpi.carteraPendiente))}</strong></div>
          <div class="kpi"><small>Pedidos entregados</small><strong>${escapeHtml(kpi.pedidosEntregados)}</strong></div>
          <div class="kpi"><small>Egresos caja</small><strong>${escapeHtml(formatCurrency(kpi.totalEgresos))}</strong></div>
          <div class="kpi"><small>Pagos trabajadores</small><strong>${escapeHtml(formatCurrency(kpi.totalPagosTrabajadores))}</strong></div>
          <div class="kpi"><small>Anticipos emitidos</small><strong>${escapeHtml(formatCurrency(kpi.totalAnticipos))}</strong></div>
          <div class="kpi"><small>Abonos deuda</small><strong>${escapeHtml(formatCurrency(kpi.totalAbonosDeuda))}</strong></div>
          <div class="kpi"><small>Saldo deudas trabajadores</small><strong>${escapeHtml(formatCurrency(kpi.saldoDeudasTrabajadores))}</strong></div>
          <div class="kpi"><small>Resultado caja</small><strong>${escapeHtml(formatCurrency(kpi.resultadoCaja))}</strong></div>
        </div>
        ${htmlInfoBox('Guia de lectura del reporte', [
          'Pedidos y total pedido se calculan por fecha del pedido.',
          'Ventas se calcula por fecha de emision de la factura.',
          'Cobrado se calcula por fecha real del pago, incluso si la factura fue emitida en otro dia.',
          'Egresos caja incluye otros egresos, pagos a trabajadores, anticipos y prestamos registrados en caja.',
          'Anticipos emitidos muestra el dinero entregado; saldo deudas descuenta los abonos registrados.',
          'Resultado caja se calcula como cobrado real menos egresos del periodo.',
          'La tabla de facturas y cobros permite identificar cliente, factura, saldo y si el pago fue posterior.',
        ])}
        ${htmlTable('Resumen consolidado por fecha', ['Fecha', 'Pedidos', 'Entregados', 'Pendientes', 'Total pedidos', 'Ventas facturadas', 'Cobrado real'], resumenPorFecha().map((d: any) => [d.fecha, d.pedidos, d.entregados, d.pendientes, d.totalPedidos, d.ventas, d.cobrado]), reportColors.blue, [4, 5, 6], 'Consolida la operacion diaria separando pedidos, facturacion y pagos reales.')}
        ${htmlTable('Trazabilidad de facturas y cobros', ['Fecha movimiento', 'Movimiento', 'Cliente', 'Factura', 'Fecha factura', 'Estado factura', 'Total factura', 'Valor cobrado', 'Saldo actual', 'Interpretacion'], facturasMovimientos(), reportColors.green, [6, 7, 8], 'Relaciona cada factura y cada pago/cancelacion con su cliente, saldo e interpretacion contable.')}
        ${htmlTable('Caja y egresos', ['Fecha', 'Tipo', 'Concepto', 'Nota', 'Trabajador', 'Monto', 'Medio'], egresosRows(), reportColors.orange, [5], 'Lista salidas de caja del periodo, incluyendo egresos generales, pagos a trabajadores, anticipos y prestamos.')}
        ${htmlTable('Pedidos y pacas por trabajador', ['Trabajador', 'Pedidos', 'Entregados', 'Pacas', 'Productos vendidos', 'Total pedidos'], pedidosTrabajadorProductoRows(), reportColors.blue, [5], 'Agrupa pedidos del periodo por trabajador y detalla cuantas pacas/productos vendio cada uno.')}
        ${htmlTable('Ventas detalladas por trabajador y precio', ['Trabajador', 'Producto', 'Precio unitario', 'Cantidad', 'Subtotal'], ventasDetalladasTrabajadorPrecioExportRows(), reportColors.blue, [2, 4], 'Desglose de productos vendidos por trabajador, separados por el precio unitario registrado en cada pedido. Las filas de total resumen cada trabajador.')}
        ${htmlTable('Trabajadores - labores', ['Fecha', 'Trabajador', 'Labor', 'Cantidad', 'Valor', 'Observaciones'], laboresRows(), reportColors.green, [4], 'Detalle de labores registradas y valor generado por trabajador.')}
        ${htmlTable('Trabajadores - pagos, anticipos y abonos', ['Fecha', 'Trabajador', 'Movimiento', 'Monto'], movimientosTrabajadoresRows(), reportColors.navy, [3], 'Consolida pagos entregados, anticipos/prestamos y abonos de deuda del periodo.')}
        ${htmlTable('Anticipos, prestamos y saldos', ['Fecha', 'Trabajador', 'Numero', 'Tipo', 'Monto original', 'Abonado', 'Saldo', 'Estado', 'Motivo'], deudasTrabajadoresRows(), reportColors.orange, [4, 5, 6], 'Detalle contable de cada deuda: valor original, abonos aplicados y saldo pendiente.')}
        ${htmlTable('Resumen por trabajador', ['Trabajador', 'Detalle labores', 'Cant. labores', 'Generado', 'Pagado', 'Anticipado', 'Abonado'], resumenTrabajadores().map((t: any) => [t.trabajador, t.laboresDetalle, t.labores, t.generado, t.pagado, t.anticipado, t.abonado]), reportColors.slate, [3, 4, 5, 6], 'Resume la actividad economica de cada trabajador dentro del periodo con el detalle de labores realizadas.')}
        ${htmlTable('Clientes', ['Cliente', 'Pedidos', 'Entregados', 'Pendientes', 'Total pedido'], clientes, reportColors.green, [4], 'Agrupa pedidos del periodo por cliente, usando la fecha del pedido.')}
        ${htmlTable('Productos pedidos', ['Producto', 'Cantidad total', 'Valor total'], resumenProductos().map((p: any) => [p.producto, p.cantidad, p.total]), reportColors.navy, [2], 'Agrupa cantidades y valores solicitados por producto dentro del periodo.')}
        ${htmlTable('Detalle completo de pedidos', ['Fecha', 'Pedido', 'Cliente', 'Trabajador', 'Estado pedido', 'Factura', 'Estado factura', 'Saldo factura', 'Producto', 'Cant.', 'Precio unit.', 'Subtotal', 'Total pedido', 'Observaciones'], pedidoRows, reportColors.orange, [7, 10, 11, 12], 'Lista cada producto solicitado, con estado del pedido y estado actual de la factura asociada.')}
        ${pedidosPorDia}
        ${htmlTable('Ventas por estado', ['Estado', 'Cantidad', 'Total'], ventasPorEstado.value.map(v => [v.estado, v.count, v.total]), reportColors.blue, [2], 'Clasifica las facturas emitidas en el periodo por su estado actual.')}
        ${htmlTable('Pedidos por estado', ['Estado', 'Cantidad'], pedidosPorEstado.value.map(p => [p.estado, p.count]), reportColors.slate, [], 'Clasifica los pedidos del periodo por estado operativo.')}
      </body>
    </html>
  `

  downloadBlob(new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' }), `${nombreArchivo('reporte_jordan_empresarial')}.xls`)
  notify.success('Excel empresarial descargado')
}

async function exportExcel() {
  try {
    const fresh = await ensureFreshReportData()
    if (!fresh) return

    exportExcelEmpresarial()
    return

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
          fecha: formatReportDate(p.fecha),
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
        fecha: formatReportDate(p.fecha),
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
      { indicador: 'Pedidos en rango', valor: pedidosRaw.value.length },
      { indicador: 'Ventas en rango', valor: ventasRaw.value.length },
    ]

    const wsResumen = XLSX.utils.json_to_sheet(resumen)
    wsResumen['!cols'] = [{ wch: 30 }, { wch: 20 }]
    applySheetStyle(XLSX, wsResumen, reportColors.navy, [1])

    const wsPorFecha = XLSX.utils.json_to_sheet(
      resumenPorFecha().map((d: any) => ({
        fecha: d.fecha,
        pedidos: d.pedidos,
        entregados: d.entregados,
        pendientes: d.pendientes,
        totalPedidos: Number(d.totalPedidos ?? 0),
        ventas: Number(d.ventas ?? 0),
        cobrado: Number(d.cobrado ?? 0),
      })),
    )
    wsPorFecha['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 18 }]
    applySheetStyle(XLSX, wsPorFecha, reportColors.blue, [4, 5, 6])

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
    applySheetStyle(XLSX, wsClientes, reportColors.green, [4])

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
    applySheetStyle(XLSX, wsPedidosDetalle, reportColors.orange, [6, 7, 8])

    const wsVentasEstado = XLSX.utils.json_to_sheet(
      ventasPorEstado.value.map(v => ({ estado: v.estado, cantidad: v.count, total: v.total })),
    )
    wsVentasEstado['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 18 }]
    applySheetStyle(XLSX, wsVentasEstado, reportColors.blue, [2])

    const wsPedidosEstado = XLSX.utils.json_to_sheet(
      pedidosPorEstado.value.map(p => ({ estado: p.estado, cantidad: p.count })),
    )
    wsPedidosEstado['!cols'] = [{ wch: 20 }, { wch: 12 }]
    applySheetStyle(XLSX, wsPedidosEstado, reportColors.slate)

    const wsCartera = XLSX.utils.json_to_sheet(
      carteraRaw.value.map(c => ({
        cliente: c.cliente?.nombre ?? '—',
        saldoPendiente: Number(c.saldoPendiente ?? 0),
        venta: c.venta?.numero ?? '—',
        fechaVenta: c.venta?.fecha ? formatReportDate(c.venta.fecha) : '—',
        estadoVenta: c.venta?.estado ?? '—',
      })),
    )
    wsCartera['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 14 }]
    applySheetStyle(XLSX, wsCartera, reportColors.orange, [1])

    const wsRutas = XLSX.utils.json_to_sheet(
      rutasRaw.value.map((r: any) => ({
        numero: r.numero,
        fecha: formatReportDate(r.fecha),
        estado: r.estado,
        trabajador: r.domiciliario?.nombre ?? '—',
        pedidos: r.itemsRuta?.length ?? 0,
      })),
    )
    wsRutas['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 24 }, { wch: 10 }]
    applySheetStyle(XLSX, wsRutas, reportColors.navy)

    const wb = XLSX.utils.book_new()
    wb.Props = {
      Title: `Reporte JORDAN ${periodoLabel()}`,
      Subject: 'Reporte consolidado empresarial',
      Author: 'Sistema JORDAN',
      Company: 'JORDAN',
      CreatedDate: new Date(),
    }
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')
    XLSX.utils.book_append_sheet(wb, wsPorFecha, 'PorFecha')
    XLSX.utils.book_append_sheet(wb, wsClientes, 'Clientes')
    XLSX.utils.book_append_sheet(wb, wsPedidosDetalle, 'PedidosDetalle')
    XLSX.utils.book_append_sheet(wb, wsVentasEstado, 'VentasEstado')
    XLSX.utils.book_append_sheet(wb, wsPedidosEstado, 'PedidosEstado')
    XLSX.utils.book_append_sheet(wb, wsCartera, 'CarteraDetalle')
    XLSX.utils.book_append_sheet(wb, wsRutas, 'Rutas')
    XLSX.writeFile(wb, `${nombreArchivo('reporte_jordan')}.xlsx`, { cellStyles: true })
    notify.success('Excel descargado')
  } catch {
    notify.error('No se pudo generar el Excel')
  }
}

function drawPdfHeader(doc: any) {
  const pageWidth = doc.internal.pageSize.getWidth()
  doc.setFillColor(23, 59, 87)
  doc.rect(0, 0, pageWidth, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('JORDAN', 14, 13)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Reporte consolidado empresarial', 14, 20)
  doc.text(`${reporteTipoLabel()} | ${periodoLabel()}`, pageWidth - 14, 13, { align: 'right' })
  doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, pageWidth - 14, 20, { align: 'right' })
  doc.setTextColor(15, 23, 42)
}

function drawPdfFooter(doc: any) {
  const pageCount = doc.internal.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page)
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(`Pagina ${page} de ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' })
    doc.text('Sistema JORDAN Gestion 2026', 14, pageHeight - 8)
  }
}

function addPdfSection(doc: any, title: string, note = '') {
  const pageHeight = doc.internal.pageSize.getHeight()
  let y = ((doc as any).lastAutoTable?.finalY ?? 30) + 8
  if (y > pageHeight - 55) {
    doc.addPage()
    drawPdfHeader(doc)
    y = 36
  }

  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(title, 14, y)

  if (!note) return y + 4

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  const lines = doc.splitTextToSize(note, doc.internal.pageSize.getWidth() - 28)
  doc.text(lines, 14, y + 4)
  doc.setTextColor(15, 23, 42)
  return y + 5 + lines.length * 3
}

function pdfTableDefaults() {
  return {
    showHead: 'everyPage',
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.1,
    bodyStyles: {
      valign: 'top',
      overflow: 'linebreak',
    },
  }
}

async function exportPdf() {
  try {
    const fresh = await ensureFreshReportData()
    if (!fresh) return

    const [jsPDFModule, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ])

    const doc = new jsPDFModule.jsPDF({ orientation: 'landscape', unit: 'mm' })
    const autoTable =
      (autoTableModule as any).default ??
      (autoTableModule as any).autoTable

    if (!autoTable) throw new Error('autoTable no disponible')

    drawPdfHeader(doc)

    autoTable(doc, {
      startY: 36,
      ...pdfTableDefaults(),
      head: [['Indicador', 'Valor']],
      body: [
        ['Tipo de reporte', reporteTipoLabel()],
        ['Periodo', periodoLabel()],
        ['Ventas (periodo)', formatCurrency(kpi.totalVentas)],
        ['Cobrado (periodo)', formatCurrency(kpi.totalCobrado)],
        ['Cartera pendiente', formatCurrency(kpi.carteraPendiente)],
        ['Pedidos entregados', String(kpi.pedidosEntregados)],
        ['Egresos caja', formatCurrency(kpi.totalEgresos)],
        ['Pagos trabajadores', formatCurrency(kpi.totalPagosTrabajadores)],
        ['Anticipos emitidos', formatCurrency(kpi.totalAnticipos)],
        ['Abonos deuda trabajador', formatCurrency(kpi.totalAbonosDeuda)],
        ['Saldo deudas trabajadores', formatCurrency(kpi.saldoDeudasTrabajadores)],
        ['Resultado caja', formatCurrency(kpi.resultadoCaja)],
        ['Pedidos en rango', String(pedidosRaw.value.length)],
        ['Ventas facturadas en rango', String(ventasFacturadasPeriodo().length)],
        ['Pagos/cobros en rango', String(pagosPeriodo().length)],
        ['Labores registradas', String(laboresRaw.value.length)],
      ],
      styles: { fontSize: 9, cellPadding: 2.6 },
      headStyles: { fillColor: [23, 59, 87], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 34, left: 14, right: 14, bottom: 14 },
      didDrawPage: () => drawPdfHeader(doc),
    })

    autoTable(doc, {
      startY: addPdfSection(doc, 'Resumen consolidado por fecha', 'Pedidos y total pedidos usan la fecha del pedido. Ventas usa la fecha de factura. Cobrado usa la fecha real del pago, por eso una factura pendiente puede aparecer cobrada en otro dia.'),
      ...pdfTableDefaults(),
      head: [['Fecha', 'Pedidos', 'Entregados', 'Pendientes', 'Total pedidos', 'Ventas facturadas', 'Cobrado real']],
      body: resumenPorFecha().map((d: any) => [
        d.fecha,
        String(d.pedidos),
        String(d.entregados),
        String(d.pendientes),
        formatCurrency(d.totalPedidos),
        formatCurrency(d.ventas),
        formatCurrency(d.cobrado),
      ]),
      styles: { fontSize: 8, cellPadding: 2.2 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 34, left: 14, right: 14, bottom: 14 },
      didDrawPage: () => drawPdfHeader(doc),
    })

    autoTable(doc, {
      startY: addPdfSection(doc, 'Trazabilidad de facturas y cobros', 'Detalle de cada factura y pago/cancelacion del rango: cliente, factura afectada, estado actual, saldo e interpretacion del movimiento.'),
      ...pdfTableDefaults(),
      head: [['Fecha mov.', 'Movimiento', 'Cliente', 'Factura', 'Fecha factura', 'Estado', 'Total', 'Cobrado', 'Saldo', 'Interpretacion']],
      body: facturasMovimientos().map(row => [
        row[0],
        row[1],
        row[2],
        row[3],
        row[4],
        row[5],
        formatCurrency(row[6]),
        formatCurrency(row[7]),
        formatCurrency(row[8]),
        row[9],
      ]),
      styles: { fontSize: 6.7, cellPadding: 1.6 },
      columnStyles: {
        0: { cellWidth: 17 },
        1: { cellWidth: 28 },
        2: { cellWidth: 38 },
        3: { cellWidth: 30 },
        4: { cellWidth: 17 },
        5: { cellWidth: 22 },
        6: { cellWidth: 21, halign: 'right' },
        7: { cellWidth: 21, halign: 'right' },
        8: { cellWidth: 21, halign: 'right' },
        9: { cellWidth: 50 },
      },
      headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      margin: { top: 34, left: 14, right: 14, bottom: 14 },
      didDrawPage: () => drawPdfHeader(doc),
    })

    autoTable(doc, {
      startY: addPdfSection(doc, 'Caja y egresos', 'Salidas reales de caja registradas en el periodo: egresos generales, pagos a trabajadores, anticipos y prestamos.'),
      ...pdfTableDefaults(),
      head: [['Fecha', 'Tipo', 'Concepto', 'Nota', 'Trabajador', 'Monto', 'Medio']],
      body: egresosRows().map(row => [
        row[0],
        row[1],
        row[2],
        row[3],
        row[4],
        formatCurrency(row[5]),
        row[6],
      ]),
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 28 },
        2: { cellWidth: 54 },
        3: { cellWidth: 64 },
        4: { cellWidth: 34 },
        5: { cellWidth: 24, halign: 'right' },
        6: { cellWidth: 22 },
      },
      headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 247, 237] },
      margin: { top: 34, left: 14, right: 14, bottom: 14 },
      didDrawPage: () => drawPdfHeader(doc),
    })

    autoTable(doc, {
      startY: addPdfSection(doc, 'Trabajadores - labores y pagos', 'Resumen compacto con detalle de labores generadas, pagos entregados, anticipos/prestamos y abonos por trabajador.'),
      ...pdfTableDefaults(),
      head: [['Trabajador', 'Detalle labores', 'Cant.', 'Generado', 'Pagado', 'Anticipado', 'Abonado']],
      body: resumenTrabajadores().map((t: any) => [
        t.trabajador,
        t.laboresDetalle,
        String(t.labores),
        formatCurrency(t.generado),
        formatCurrency(t.pagado),
        formatCurrency(t.anticipado),
        formatCurrency(t.abonado),
      ]),
      styles: { fontSize: 7.2, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 42 },
        1: { cellWidth: 82 },
        2: { cellWidth: 13, halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
      },
      headStyles: { fillColor: [23, 59, 87], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 34, left: 14, right: 14, bottom: 14 },
      didDrawPage: () => drawPdfHeader(doc),
    })

    autoTable(doc, {
      startY: addPdfSection(doc, 'Pedidos y pacas por trabajador', 'Agrupa pedidos del periodo por trabajador y muestra cuantas pacas/productos vendio cada uno.'),
      ...pdfTableDefaults(),
      head: [['Trabajador', 'Pedidos', 'Entregados', 'Pacas', 'Productos vendidos', 'Total pedidos']],
      body: pedidosTrabajadorProductoRows().map(row => [
        row[0],
        String(row[1]),
        String(row[2]),
        String(row[3]),
        row[4],
        formatCurrency(row[5]),
      ]),
      styles: { fontSize: 7.2, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 42 },
        1: { cellWidth: 16, halign: 'center' },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 118 },
        5: { cellWidth: 28, halign: 'right' },
      },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 34, left: 14, right: 14, bottom: 14 },
      didDrawPage: () => drawPdfHeader(doc),
    })

    const ventasDetalladasTrabajadores = ventasDetalladasPorTrabajadorPrecio()
    if (ventasDetalladasTrabajadores.length) {
      addPdfSection(
        doc,
        'Ventas detalladas por trabajador y precio',
        'Desglose de productos vendidos por trabajador, separados por el precio unitario registrado en cada pedido.',
      )

      ventasDetalladasTrabajadores.forEach((item) => {
        autoTable(doc, {
          startY: addPdfSection(doc, `Trabajador: ${item.trabajador}`),
          ...pdfTableDefaults(),
          head: [['Producto', 'Precio unitario', 'Cantidad', 'Subtotal']],
          body: item.lineas.map(linea => [
            linea.producto,
            formatCurrency(linea.precioUnitario),
            cantidadLabel(linea.cantidad),
            formatCurrency(linea.subtotal),
          ]),
          foot: [[`Total vendido ${item.trabajador}`, '', '', formatCurrency(item.total)]],
          styles: { fontSize: 7.2, cellPadding: 2 },
          columnStyles: {
            0: { cellWidth: 118 },
            1: { cellWidth: 34, halign: 'right' },
            2: { cellWidth: 24, halign: 'right' },
            3: { cellWidth: 34, halign: 'right' },
          },
          headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
          footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { top: 34, left: 14, right: 14, bottom: 14 },
          didDrawPage: () => drawPdfHeader(doc),
        })
      })
    }

    autoTable(doc, {
      startY: addPdfSection(doc, 'Anticipos, prestamos y saldos', 'Detalle contable de cada deuda: valor original entregado, abonos aplicados y saldo pendiente.'),
      ...pdfTableDefaults(),
      head: [['Fecha', 'Trabajador', 'Numero', 'Tipo', 'Monto', 'Abonado', 'Saldo', 'Estado']],
      body: deudasTrabajadoresRows().map(row => [
        row[0],
        row[1],
        row[2],
        row[3],
        formatCurrency(row[4]),
        formatCurrency(row[5]),
        formatCurrency(row[6]),
        row[7],
      ]),
      styles: { fontSize: 7.2, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 42 },
        2: { cellWidth: 36 },
        3: { cellWidth: 24 },
        4: { cellWidth: 24, halign: 'right' },
        5: { cellWidth: 24, halign: 'right' },
        6: { cellWidth: 24, halign: 'right' },
        7: { cellWidth: 38 },
      },
      headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 247, 237] },
      margin: { top: 34, left: 14, right: 14, bottom: 14 },
      didDrawPage: () => drawPdfHeader(doc),
    })

    autoTable(doc, {
      startY: addPdfSection(doc, 'Ventas por estado', 'Clasifica las facturas emitidas dentro del periodo por su estado actual.'),
      ...pdfTableDefaults(),
      head: [['Estado venta', 'Cantidad', 'Total']],
      body: ventasPorEstado.value.map(v => [v.estado, String(v.count), formatCurrency(v.total)]),
      styles: { fontSize: 8, cellPadding: 2.2 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 34, left: 14, right: 14, bottom: 14 },
      didDrawPage: () => drawPdfHeader(doc),
    })

    autoTable(doc, {
      startY: addPdfSection(doc, 'Clientes', 'Agrupa los pedidos del periodo por cliente, usando la fecha del pedido.'),
      ...pdfTableDefaults(),
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
      styles: { fontSize: 8, cellPadding: 2.2 },
      headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 34, left: 14, right: 14, bottom: 14 },
      didDrawPage: () => drawPdfHeader(doc),
    })

    autoTable(doc, {
      startY: addPdfSection(doc, 'Productos pedidos', 'Agrupa cantidades y valores solicitados por producto dentro del periodo.'),
      ...pdfTableDefaults(),
      head: [['Producto', 'Cantidad total', 'Valor total']],
      body: resumenProductos()
        .slice(0, 20)
        .map((p: any) => [
          p.producto,
          String(p.cantidad),
          formatCurrency(p.total),
        ]),
      styles: { fontSize: 8, cellPadding: 2.2 },
      headStyles: { fillColor: [23, 59, 87], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 34, left: 14, right: 14, bottom: 14 },
      didDrawPage: () => drawPdfHeader(doc),
    })

    autoTable(doc, {
      startY: addPdfSection(doc, 'Detalle completo de pedidos', 'Lista cada producto solicitado, con estado del pedido y estado actual de la factura asociada.'),
      ...pdfTableDefaults(),
      head: [['Fecha', 'Pedido', 'Cliente', 'Trabajador', 'Estado pedido', 'Factura', 'Estado factura', 'Producto', 'Cant.', 'Subtotal']],
      body: pedidosRaw.value
        .flatMap((p: any) =>
          (p.detalles ?? []).map((d: any) => [
            formatReportDate(p.fecha),
            p.numero,
            p.cliente?.nombre ?? '—',
            trabajadorPedido(p).nombre,
            p.estado,
            numeroFactura(p),
            estadoFactura(p),
            d.producto?.nombre ?? d.productoId,
            String(Number(d.cantidad ?? 0)),
            formatCurrency(Number(d.subtotal ?? 0)),
          ]),
        )
        .slice(0, 250),
      styles: { fontSize: 7, cellPadding: 1.8 },
      columnStyles: {
        0: { cellWidth: 17 },
        1: { cellWidth: 31 },
        2: { cellWidth: 34 },
        3: { cellWidth: 32 },
        4: { cellWidth: 24 },
        5: { cellWidth: 31 },
        6: { cellWidth: 24 },
        7: { cellWidth: 42 },
        8: { cellWidth: 10, halign: 'center' },
        9: { cellWidth: 22, halign: 'right' },
      },
      headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 247, 237] },
      margin: { top: 34, left: 14, right: 14, bottom: 14 },
      didDrawPage: () => drawPdfHeader(doc),
    })

    drawPdfFooter(doc)
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

async function fetchPaged(endpoint: string, params: Record<string, any>) {
  const first = await api.get(endpoint, { params: { ...params, page: 1, limit: PAGE_SIZE } })
  const firstPayload = apiResponse.unwrap(first) as any
  const firstItems = toArray(firstPayload)
  const totalPages = Number(firstPayload?.totalPages ?? firstPayload?.pages ?? 1)

  if (totalPages <= 1) return firstItems

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      api.get(endpoint, { params: { ...params, page: index + 2, limit: PAGE_SIZE } }),
    ),
  )

  return [
    ...firstItems,
    ...rest.flatMap(response => toArray(apiResponse.unwrap(response) as any)),
  ]
}

async function fetchAll(): Promise<void> {
  if (new Date(`${filtroDesde.value}T00:00:00`) > new Date(`${filtroHasta.value}T23:59:59`)) {
    notify.warning('La fecha inicial no puede ser mayor que la fecha final')
    return
  }

  const requestedRange = currentRangeKey()
  if (activeFetch && loadingRange.value === requestedRange) {
    return activeFetch
  }

  loadingRange.value = requestedRange
  loading.value = true

  activeFetch = (async () => {
    try {
      const params = {
        fechaDesde: filtroDesde.value,
        fechaHasta: filtroHasta.value,
      }
      const [vRes, pRes, cRes, rRes, eRes, lRes, ptRes, aRes, abRes] = await Promise.allSettled([
        fetchPaged('/operaciones/ventas/reporte/movimientos', params),
        fetchPaged('/operaciones/pedidos', params),
        api.get('/operaciones/ventas/cartera/resumen'),
        fetchPaged('/operaciones/rutas', params),
        fetchPaged('/operaciones/egresos', params),
        api.get('/trabajadores-ops/labores', { params }),
        api.get('/trabajadores-ops/pagos', { params }),
        api.get('/trabajadores-ops/anticipos', { params }),
        api.get('/trabajadores-ops/abonos', { params }),
      ])

      if (loadingRange.value !== requestedRange) return

      ventasRaw.value = []
      pedidosRaw.value = []
      rutasRaw.value = []
      egresosRaw.value = []
      laboresRaw.value = []
      pagosTrabajadoresRaw.value = []
      anticiposRaw.value = []
      abonosRaw.value = []
      ventasPorEstado.value = []
      pedidosPorEstado.value = []
      kpi.totalVentas = 0
      kpi.totalCobrado = 0
      kpi.pedidosEntregados = 0
      kpi.totalEgresos = 0
      kpi.totalPagosTrabajadores = 0
      kpi.totalAnticipos = 0
      kpi.totalAbonosDeuda = 0
      kpi.saldoDeudasTrabajadores = 0
      kpi.resultadoCaja = 0
      kpi.totalLabores = 0

      // Ventas
      if (vRes.status === 'fulfilled') {
        const ventas = toArray(vRes.value)
        ventasRaw.value = ventas
        const ventasPeriodo = ventasFacturadasPeriodo(ventas)
        const pagosEnPeriodo = pagosPeriodo(ventas)
        kpi.totalVentas = ventasPeriodo.reduce((s: number, v: any) => s + Number(v.totalVenta ?? 0), 0)
        kpi.totalCobrado = pagosEnPeriodo.reduce((s: number, item: any) => s + Number(item.pago?.monto ?? 0), 0)
        const map: Record<string, { count: number; total: number }> = {}
        for (const v of ventasPeriodo) {
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
        const pedidos = toArray(pRes.value)
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
        rutasRaw.value = toArray(rRes.value)
        rutasRecientes.value = rutasRaw.value
      }

      // Caja y egresos
      if (eRes.status === 'fulfilled') {
        egresosRaw.value = toArray(eRes.value)
        kpi.totalEgresos = egresosRaw.value.reduce((s: number, item: any) => s + Number(item.monto ?? 0), 0)
      }

      // Trabajadores
      if (lRes.status === 'fulfilled') {
        laboresRaw.value = toArray(apiResponse.unwrap(lRes.value) as any)
        kpi.totalLabores = laboresRaw.value.reduce((s: number, item: any) => s + Number(item.montoAPagar ?? 0), 0)
      }

      if (ptRes.status === 'fulfilled') {
        pagosTrabajadoresRaw.value = toArray(apiResponse.unwrap(ptRes.value) as any)
        kpi.totalPagosTrabajadores = pagosTrabajadoresRaw.value.reduce((s: number, item: any) => s + Number(item.montoEntregado ?? item.montoBase ?? 0), 0)
      }

      if (aRes.status === 'fulfilled') {
        anticiposRaw.value = toArray(apiResponse.unwrap(aRes.value) as any)
        kpi.totalAnticipos = anticiposRaw.value.reduce((s: number, item: any) => s + Number(item.monto ?? 0), 0)
        kpi.saldoDeudasTrabajadores = anticiposRaw.value.reduce((s: number, item: any) => s + saldoAnticipo(item), 0)
      }

      if (abRes.status === 'fulfilled') {
        abonosRaw.value = toArray(apiResponse.unwrap(abRes.value) as any)
      }

      kpi.totalAbonosDeuda = abonosPeriodoConsolidados().reduce((s: number, item: any) => s + Number(item.monto ?? 0), 0)
      kpi.resultadoCaja = kpi.totalCobrado - kpi.totalEgresos

      lastLoadedRange.value = requestedRange
    } catch {
      notify.error('Error al cargar reportes')
    } finally {
      if (loadingRange.value === requestedRange) {
        loading.value = false
        activeFetch = null
      }
    }
  })()

  return activeFetch
}

onMounted(() => {
  reporteTipo.value = 'diario'
  fechaReferencia.value = todayISO()
  filtroDesde.value = fechaReferencia.value
  filtroHasta.value = fechaReferencia.value
  void fetchAll()
})
</script>
