<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Inventario</h1>
        <p class="mt-1 text-sm text-gray-500">Stock de productos, alertas y tanques de agua.</p>
      </div>
      <div class="flex gap-2">
        <input v-model="filtroFecha" type="date" class="form-input w-40" @change="fetchAll" />
        <button class="btn-secondary inline-flex items-center gap-2" @click="fetchAll">
          <RefreshCw class="h-4 w-4" />
          Actualizar
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
      <StatCard label="Productos en stock" :value="String(inventarioActual.length)" :icon="Boxes" color="blue" :loading="loading" />
      <StatCard label="Alertas de stock" :value="String(stockBajo.length + tanquesBajo.length)" :icon="AlertTriangle" color="orange" :loading="loading" />
      <StatCard label="Produccion usable" :value="String(totalProducido)" :icon="Factory" color="green" :loading="loading" />
      <StatCard label="Tanques activos" :value="String(tanquesActivos.length)" :icon="Droplets" color="purple" :loading="loading" />
    </div>

    <section v-if="stockBajo.length" class="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div class="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 class="font-semibold text-amber-900">Alertas de stock bajo</h2>
          <p class="text-sm text-amber-700">Cuando un producto llegue al mínimo (2 unidades por defecto), se marca aquí para producir o ajustar stock.</p>
        </div>
        <span class="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">{{ stockBajo.length }} alertas</span>
      </div>
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-amber-200 text-left text-xs uppercase text-amber-800">
            <th class="pb-2 font-medium">Producto</th>
            <th class="pb-2 text-right font-medium">Stock</th>
            <th class="pb-2 text-right font-medium">Mínimo</th>
            <th class="pb-2 text-right font-medium">Faltante</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in stockBajo" :key="item.id" class="border-b border-amber-100">
            <td class="py-2 font-medium text-gray-900">{{ item.producto?.nombre ?? item.productoId }}</td>
            <td class="py-2 text-right text-amber-900">{{ formatQuantity(item.stockActual) }}</td>
            <td class="py-2 text-right text-amber-900">{{ formatQuantity(item.stockMinimo) }}</td>
            <td class="py-2 text-right font-semibold text-amber-900">{{ formatQuantity(faltanteStock(item)) }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section v-if="tanquesBajo.length" class="rounded-lg border border-purple-200 bg-purple-50 p-4">
      <div class="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 class="font-semibold text-purple-900">Alertas de tanques bajos</h2>
          <p class="text-sm text-purple-700">Los tanques con {{ INVENTARIO.LITROS_MINIMO_TANQUE }} litros o menos se marcan para revisar abastecimiento.</p>
        </div>
        <span class="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-800">{{ tanquesBajo.length }} alertas</span>
      </div>
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-purple-200 text-left text-xs uppercase text-purple-800">
            <th class="pb-2 font-medium">Tanque</th>
            <th class="pb-2 text-right font-medium">Litros</th>
            <th class="pb-2 text-right font-medium">Mínimo</th>
            <th class="pb-2 text-right font-medium">Faltante</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in tanquesBajo" :key="item.id" class="border-b border-purple-100">
            <td class="py-2 font-medium text-gray-900">{{ item.tanqueAgua?.nombre ?? item.tanqueAguaId }}</td>
            <td class="py-2 text-right text-purple-900">{{ formatQuantity(item.litrosContados) }} L</td>
            <td class="py-2 text-right text-purple-900">{{ INVENTARIO.LITROS_MINIMO_TANQUE }} L</td>
            <td class="py-2 text-right font-semibold text-purple-900">{{ formatQuantity(faltanteLitrosTanque(item)) }} L</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="card">
      <div class="mb-4 flex items-center justify-between gap-3">
        <h2 class="font-semibold text-gray-700">Stock actual de productos</h2>
        <span class="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-500">{{ inventarioActual.length }} productos</span>
      </div>
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b text-left text-xs uppercase text-gray-500">
            <th class="pb-2 font-medium">Producto</th>
            <th class="pb-2 text-right font-medium">Stock actual</th>
            <th class="pb-2 text-right font-medium">Stock mínimo</th>
            <th class="pb-2 font-medium">Estado</th>
            <th class="pb-2 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in inventarioActual" :key="item.id" class="border-b border-gray-50">
            <td class="py-2 font-medium text-gray-800">
              <div>{{ item.producto?.nombre ?? item.productoId }}</div>
              <ProductUnitBadge
                v-if="item.producto"
                :categoria="item.producto.categoria"
                :unidad="item.producto.unidad"
                class="mt-1"
              />
            </td>
            <td class="py-2 text-right text-gray-600">{{ formatQuantity(item.stockActual) }}</td>
            <td class="py-2 text-right text-gray-600">{{ formatQuantity(item.stockMinimo) }}</td>
            <td class="py-2">
              <span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="stockEstaBajo(item) ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-700'">
                {{ stockEstaBajo(item) ? 'Bajo' : 'OK' }}
              </span>
            </td>
            <td class="py-2 text-right">
              <button class="btn-secondary inline-flex items-center gap-1 px-2 py-1 text-xs" @click="openAjusteStock(item)">
                <Pencil class="h-3.5 w-3.5" />
                Corregir
              </button>
            </td>
          </tr>
          <tr v-if="!inventarioActual.length">
            <td colspan="5" class="py-4 text-center text-gray-400">Sin stock registrado</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <div class="card">
        <h2 class="mb-4 font-semibold text-gray-700">Inventario inicial - {{ formatDate(filtroFecha) }}</h2>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b text-left text-xs uppercase text-gray-500">
              <th class="pb-2 font-medium">Producto</th>
              <th class="pb-2 text-right font-medium">Cantidad inicial</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in inventarioInicial" :key="item.id" class="border-b border-gray-50">
              <td class="py-2 font-medium text-gray-800">{{ item.producto?.nombre ?? item.productoId }}</td>
              <td class="py-2 text-right text-gray-600">{{ formatQuantity(item.cantidadInicial) }}</td>
            </tr>
            <tr v-if="!inventarioInicial.length">
              <td colspan="2" class="py-4 text-center text-gray-400">Sin apertura para la fecha seleccionada</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <h2 class="mb-4 font-semibold text-gray-700">Producción registrada</h2>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b text-left text-xs uppercase text-gray-500">
              <th class="pb-2 font-medium">Producto</th>
              <th class="pb-2 text-right font-medium">Usable</th>
              <th class="pb-2 text-right font-medium">Filtradas</th>
              <th class="pb-2 text-right font-medium">Reempacadas</th>
              <th class="pb-2 text-right font-medium">Merma</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in produccion" :key="item.id" class="border-b border-gray-50">
              <td class="py-2 font-medium text-gray-800">{{ item.producto?.nombre ?? item.productoId }}</td>
              <td class="py-2 text-right text-gray-600">{{ formatQuantity(item.cantidad) }}</td>
              <td class="py-2 text-right text-gray-600">{{ formatQuantity(item.cantidadFiltrada ?? 0) }}</td>
              <td class="py-2 text-right text-gray-600">{{ formatQuantity(item.cantidadReempacada ?? 0) }}</td>
              <td class="py-2 text-right text-red-600">{{ formatQuantity(item.cantidadMerma ?? 0) }}</td>
            </tr>
            <tr v-if="!produccion.length">
              <td colspan="5" class="py-4 text-center text-gray-400">Sin produccion registrada</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <div class="card">
        <h2 class="mb-4 font-semibold text-gray-700">Inventario de cierre</h2>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b text-left text-xs uppercase text-gray-500">
              <th class="pb-2 font-medium">Producto</th>
              <th class="pb-2 text-right font-medium">Esperado</th>
              <th class="pb-2 text-right font-medium">Real</th>
              <th class="pb-2 text-right font-medium">Dif.</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in cierreInventario" :key="item.id" class="border-b border-gray-50">
              <td class="py-2 font-medium text-gray-800">{{ item.producto?.nombre ?? item.productoId }}</td>
              <td class="py-2 text-right text-gray-600">{{ formatQuantity(item.cantidadEsperada) }}</td>
              <td class="py-2 text-right text-gray-600">{{ formatQuantity(item.cantidadContada) }}</td>
              <td class="py-2 text-right font-semibold" :class="Number(item.diferencia ?? 0) === 0 ? 'text-gray-400' : 'text-amber-700'">{{ formatQuantity(item.diferencia) }}</td>
            </tr>
            <tr v-if="!cierreInventario.length">
              <td colspan="4" class="py-4 text-center text-gray-400">Cierre pendiente</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <h2 class="mb-4 font-semibold text-gray-700">Tanques al cierre</h2>
        <p class="mb-3 text-xs text-gray-500">Mínimo operativo por tanque: {{ INVENTARIO.LITROS_MINIMO_TANQUE }} litros.</p>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b text-left text-xs uppercase text-gray-500">
              <th class="pb-2 font-medium">Tanque</th>
              <th class="pb-2 text-right font-medium">Litros</th>
              <th class="pb-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in tanquesCierre"
              :key="item.id"
              class="border-b border-gray-50"
              :class="tanqueEstaBajo(item) ? 'bg-purple-50' : ''"
            >
              <td class="py-2 font-medium text-gray-800">{{ item.tanqueAgua?.nombre ?? item.tanqueAguaId }}</td>
              <td class="py-2 text-right text-gray-600">{{ formatQuantity(item.litrosContados) }} L</td>
              <td class="py-2">
                <span
                  class="rounded-full px-2 py-0.5 text-xs font-semibold"
                  :class="tanqueEstaBajo(item) ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-700'"
                >
                  {{ tanqueEstaBajo(item) ? 'Bajo' : 'OK' }}
                </span>
              </td>
            </tr>
            <tr v-if="!tanquesCierre.length">
              <td colspan="3" class="py-4 text-center text-gray-400">Sin conteo de tanques para esta fecha</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="card">
      <div class="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 class="font-semibold text-gray-700">Tanques de agua</h2>
          <p class="mt-1 text-sm text-gray-500">Catálogo físico usado en el cierre de Gestión de Planta.</p>
        </div>
        <button class="btn-primary inline-flex items-center gap-2 text-sm" @click="openCreateTanque">
          <Plus class="h-4 w-4" />
          Nuevo tanque
        </button>
      </div>

      <table class="w-full text-sm">
        <thead>
          <tr class="border-b text-left text-xs uppercase text-gray-500">
            <th class="pb-2 font-medium">Tanque</th>
            <th class="pb-2 text-right font-medium">Capacidad</th>
            <th class="pb-2 text-center font-medium">Orden</th>
            <th class="pb-2 font-medium">Estado</th>
            <th class="pb-2 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tanque in tanques" :key="tanque.id" class="border-b border-gray-50">
            <td class="py-2">
              <p class="font-medium text-gray-800">{{ tanque.nombre }}</p>
              <p v-if="tanque.observaciones" class="text-xs text-gray-400">{{ tanque.observaciones }}</p>
            </td>
            <td class="py-2 text-right text-gray-600">{{ tanque.capacidadLitros ? `${tanque.capacidadLitros} L` : '-' }}</td>
            <td class="py-2 text-center text-gray-500">{{ tanque.orden ?? 0 }}</td>
            <td class="py-2">
              <span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="tanque.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                {{ tanque.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="py-2">
              <div class="flex justify-end gap-2">
                <button class="btn-secondary px-2 py-1 text-xs" @click="openEditTanque(tanque)">Editar</button>
                <button v-if="tanque.activo" class="rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100" @click="desactivarTanque(tanque)">Eliminar</button>
                <button v-else class="rounded-lg bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-100" @click="activarTanque(tanque)">Activar</button>
              </div>
            </td>
          </tr>
          <tr v-if="!tanques.length">
            <td colspan="5" class="py-4 text-center text-gray-400">Sin tanques configurados</td>
          </tr>
        </tbody>
      </table>
    </section>

    <div v-if="modalTanque" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="modalTanque = false">
      <div class="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl">
        <h2 class="text-lg font-bold text-gray-800">{{ editingTanqueId ? 'Editar tanque' : 'Nuevo tanque' }}</h2>
        <FormField label="Nombre *">
          <input v-model="tanqueForm.nombre" class="form-input" placeholder="Tanque 1" />
        </FormField>
        <FormField label="Capacidad en litros">
          <input v-model.number="tanqueForm.capacidadLitros" class="form-input" type="number" min="0" />
        </FormField>
        <FormField label="Orden">
          <input v-model.number="tanqueForm.orden" class="form-input" type="number" min="0" />
        </FormField>
        <FormField label="Observaciones">
          <textarea v-model="tanqueForm.observaciones" class="form-input resize-none" rows="2" />
        </FormField>
        <label class="flex items-center gap-2 text-sm text-gray-600">
          <input v-model="tanqueForm.activo" type="checkbox" class="h-4 w-4 rounded border-gray-300" />
          Activo
        </label>
        <div class="flex justify-end gap-2 pt-1">
          <button class="btn-secondary" @click="modalTanque = false">Cancelar</button>
          <button class="btn-primary" :disabled="savingTanque" @click="guardarTanque">
            {{ savingTanque ? 'Guardando...' : 'Guardar tanque' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="modalAjusteStock" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="modalAjusteStock = false">
      <div class="w-full max-w-lg space-y-5 rounded-2xl bg-white p-6 shadow-xl">
        <div>
          <h2 class="text-lg font-bold text-gray-800">Corregir stock de {{ ajusteStockForm.productoNombre }}</h2>
          <p class="mt-1 text-sm text-gray-500">Revisar el stock actual, ingresar la cantidad real y justificar el cambio.</p>
        </div>

        <!-- Comparativo antes/después -->
        <div class="grid grid-cols-2 gap-4">
          <div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p class="text-xs font-bold uppercase text-blue-600">Stock actual (antes)</p>
            <p class="mt-2 text-2xl font-black text-blue-900">{{ formatQuantity(ajusteStockForm.cantidadAnterior) }}</p>
          </div>
          <div class="rounded-lg border border-green-200 bg-green-50 p-4">
            <p class="text-xs font-bold uppercase text-green-600">Stock nuevo (después)</p>
            <p class="mt-2 text-2xl font-black text-green-900">{{ formatQuantity(ajusteStockForm.nuevaCantidad) }}</p>
          </div>
        </div>

        <!-- Diferencia y clasificación -->
        <div v-if="ajusteStockForm.nuevaCantidad !== ajusteStockForm.cantidadAnterior" class="rounded-lg p-4" :class="ajusteStockForm.nuevaCantidad > ajusteStockForm.cantidadAnterior ? 'border border-green-200 bg-green-50' : 'border border-red-200 bg-red-50'">
          <div class="flex items-end justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase" :class="ajusteStockForm.nuevaCantidad > ajusteStockForm.cantidadAnterior ? 'text-green-600' : 'text-red-600'">
                {{ ajusteStockForm.nuevaCantidad > ajusteStockForm.cantidadAnterior ? '📈 Incremento' : '📉 Decremento' }}
              </p>
              <p class="mt-1 text-lg font-bold" :class="ajusteStockForm.nuevaCantidad > ajusteStockForm.cantidadAnterior ? 'text-green-900' : 'text-red-900'">
                {{ Math.abs(ajusteStockForm.nuevaCantidad - ajusteStockForm.cantidadAnterior) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Entrada de cantidad real -->
        <FormField label="Cantidad real contada en físico *">
          <input v-model.number="ajusteStockForm.nuevaCantidad" class="form-input text-lg font-semibold" type="number" min="0" placeholder="0" />
        </FormField>

        <!-- Razón del ajuste -->
        <FormField label="Razón del ajuste *" message="Explica brevemente por qué se requiere este cambio (ej: error de digitación, merma encontrada, etc.)">
          <textarea v-model="ajusteStockForm.razon" class="form-input resize-none" rows="3" placeholder="Ej: Se encontraron 5 unidades dañadas durante conteo físico" />
        </FormField>

        <!-- Botones de acción -->
        <div class="flex justify-end gap-2 border-t pt-4">
          <button class="btn-secondary" @click="modalAjusteStock = false">Cancelar</button>
          <button class="btn-primary" :disabled="savingAjusteStock || !ajusteStockForm.razon.trim()" @click="guardarAjusteStock">
            {{ savingAjusteStock ? 'Guardando...' : 'Guardar ajuste' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertTriangle, Boxes, Droplets, Factory, Pencil, Plus, RefreshCw } from 'lucide-vue-next'
import { formatDate, formatQuantity, todayISOLocal } from '~/utils/formats'
import { INVENTARIO } from '~/utils/reglas-negocio'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const apiResponse = useApiResponse()
const notify = useNotification()

const filtroFecha = ref(todayISOLocal())
const loading = ref(true)
const savingTanque = ref(false)
const savingAjusteStock = ref(false)
const modalTanque = ref(false)
const modalAjusteStock = ref(false)
const editingTanqueId = ref<number | null>(null)

const inventarioInicial = ref<any[]>([])
const produccion = ref<any[]>([])
const cierreInventario = ref<any[]>([])
const tanquesCierre = ref<any[]>([])
const inventarioActual = ref<any[]>([])
const stockBajo = ref<any[]>([])
const tanques = ref<any[]>([])

const tanqueForm = reactive({
  nombre: '',
  capacidadLitros: undefined as number | undefined,
  orden: 0,
  observaciones: '',
  activo: true,
})

const ajusteStockForm = reactive({
  productoId: null as number | null,
  productoNombre: '',
  cantidadAnterior: 0,
  nuevaCantidad: 0,
  razon: '',
})

const totalProducido = computed(() =>
  produccion.value.reduce((sum, item) => sum + Number(item?.cantidad ?? 0), 0),
)
const tanquesActivos = computed(() => tanques.value.filter(tanque => tanque.activo))
const tanquesBajo = computed(() =>
  tanquesCierre.value.filter(item => tanqueEstaBajo(item)),
)

function tanqueEstaBajo(item: any) {
  return Number(item?.litrosContados ?? 0) <= INVENTARIO.LITROS_MINIMO_TANQUE
}

function faltanteLitrosTanque(item: any) {
  return Math.max(0, INVENTARIO.LITROS_MINIMO_TANQUE - Number(item?.litrosContados ?? 0))
}

function stockEstaBajo(item: any) {
  return Number(item?.stockActual ?? 0) <= Number(item?.stockMinimo ?? 0)
}

function faltanteStock(item: any) {
  return Math.max(0, Number(item?.stockMinimo ?? 0) - Number(item?.stockActual ?? 0))
}

async function fetchAll() {
  loading.value = true
  inventarioInicial.value = []
  produccion.value = []
  cierreInventario.value = []
  tanquesCierre.value = []
  try {
    const [estadoRes, inventarioRes, stockBajoRes, tanquesRes] = await Promise.allSettled([
      api.get('/diario/estado', { params: { fecha: filtroFecha.value } }),
      api.get('/inventarios', { params: { limit: 500 } }),
      api.get('/inventarios/stock-bajo'),
      api.get('/diario/tanques-agua', { params: { includeInactive: 'true' } }),
    ])

    if (estadoRes.status === 'fulfilled') {
      const d = apiResponse.unwrap(estadoRes.value) as any
      inventarioInicial.value = d.apertura?.inventariosInicial ?? []
      produccion.value = d.apertura?.producciondiaria ?? []
      cierreInventario.value = d.cierre?.cierreInventario ?? []
      tanquesCierre.value = d.cierre?.cierreTanquesAgua ?? []
    }
    if (inventarioRes.status === 'fulfilled') inventarioActual.value = apiResponse.list(inventarioRes.value)
    if (stockBajoRes.status === 'fulfilled') stockBajo.value = apiResponse.list(stockBajoRes.value)
    if (tanquesRes.status === 'fulfilled') tanques.value = apiResponse.list(tanquesRes.value)
  } catch {
    notify.error('No se pudo cargar inventario')
  } finally {
    loading.value = false
  }
}

function resetTanqueForm() {
  editingTanqueId.value = null
  tanqueForm.nombre = ''
  tanqueForm.capacidadLitros = undefined
  tanqueForm.orden = (tanques.value.length || 0) + 1
  tanqueForm.observaciones = ''
  tanqueForm.activo = true
}

function openCreateTanque() {
  resetTanqueForm()
  modalTanque.value = true
}

function openEditTanque(tanque: any) {
  editingTanqueId.value = tanque.id
  tanqueForm.nombre = tanque.nombre ?? ''
  tanqueForm.capacidadLitros = tanque.capacidadLitros === null ? undefined : Number(tanque.capacidadLitros ?? 0)
  tanqueForm.orden = Number(tanque.orden ?? 0)
  tanqueForm.observaciones = tanque.observaciones ?? ''
  tanqueForm.activo = Boolean(tanque.activo)
  modalTanque.value = true
}

function tanquePayload(activo = tanqueForm.activo) {
  return {
    nombre: tanqueForm.nombre,
    capacidadLitros: tanqueForm.capacidadLitros,
    orden: tanqueForm.orden,
    observaciones: tanqueForm.observaciones,
    activo,
  }
}

async function guardarTanque() {
  if (!tanqueForm.nombre.trim()) {
    notify.error('El nombre del tanque es requerido')
    return
  }
  savingTanque.value = true
  try {
    if (editingTanqueId.value) {
      await api.patch(`/diario/tanques-agua/${editingTanqueId.value}`, tanquePayload())
    } else {
      await api.post('/diario/tanques-agua', tanquePayload())
    }
    notify.success('Tanque guardado')
    modalTanque.value = false
    await fetchAll()
  } catch (e: any) {
    notify.error(apiResponse.errorMessage(e))
  } finally {
    savingTanque.value = false
  }
}

async function desactivarTanque(tanque: any) {
  try {
    await api.delete(`/diario/tanques-agua/${tanque.id}`)
    notify.success('Tanque eliminado del uso diario')
    await fetchAll()
  } catch (e: any) {
    notify.error(apiResponse.errorMessage(e))
  }
}

async function activarTanque(tanque: any) {
  try {
    await api.patch(`/diario/tanques-agua/${tanque.id}`, {
      nombre: tanque.nombre,
      capacidadLitros: tanque.capacidadLitros,
      orden: tanque.orden,
      observaciones: tanque.observaciones,
      activo: true,
    })
    notify.success('Tanque activado')
    await fetchAll()
  } catch (e: any) {
    notify.error(apiResponse.errorMessage(e))
  }
}

function openAjusteStock(item: any) {
  ajusteStockForm.productoId = Number(item.productoId ?? item.producto?.id ?? 0)
  ajusteStockForm.productoNombre = item.producto?.nombre ?? `Producto ${ajusteStockForm.productoId}`
  ajusteStockForm.cantidadAnterior = Number(item.stockActual ?? 0)
  ajusteStockForm.nuevaCantidad = Number(item.stockActual ?? 0)
  ajusteStockForm.razon = ''
  modalAjusteStock.value = true
}

async function guardarAjusteStock() {
  if (!ajusteStockForm.productoId) {
    notify.error('Producto inválido')
    return
  }
  if (Number(ajusteStockForm.nuevaCantidad) < 0) {
    notify.error('La cantidad no puede ser negativa')
    return
  }
  if (!ajusteStockForm.razon.trim()) {
    notify.error('La razón del ajuste es requerida')
    return
  }

  savingAjusteStock.value = true
  try {
    await api.patch(`/inventarios/${ajusteStockForm.productoId}/ajuste`, {
      nuevaCantidad: Number(ajusteStockForm.nuevaCantidad),
      razon: ajusteStockForm.razon.trim(),
    })
    notify.success('Stock corregido')
    modalAjusteStock.value = false
    await fetchAll()
  } catch (e: any) {
    notify.error(apiResponse.errorMessage(e))
  } finally {
    savingAjusteStock.value = false
  }
}

onMounted(fetchAll)
</script>
