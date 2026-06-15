<template>
  <div class="space-y-6">
    <ReprogramadosAlert />

    <div class="flex flex-wrap items-start gap-4">
      <button
        type="button"
        class="btn-secondary inline-flex items-center gap-2 text-sm"
        @click="router.push('/rutas')"
      >
        <ArrowLeft :size="18" /> Volver al listado
      </button>
      <div v-if="ruta" class="flex-1 min-w-0">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-800 truncate">{{ ruta.numero }}</h1>
          <EstadoBadge :estado="ruta.estado" />
        </div>
        <p class="text-sm text-gray-500 mt-1">
          {{ formatDate(ruta.fecha) }}
          <span v-if="ruta.domiciliario?.nombre"> · {{ ruta.domiciliario.nombre }}</span>
        </p>
      </div>
      <button
        v-if="ruta"
        type="button"
        class="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-40"
        :disabled="deleting"
        @click="modalEliminarRuta?.open()"
      >
        <Trash2 :size="16" /> Eliminar ruta
      </button>
    </div>

    <div v-if="loading" class="card py-12 text-center text-gray-400">Cargando ruta…</div>
    <div v-else-if="loadError" class="card py-8 text-center text-red-600">{{ loadError }}</div>

    <template v-else-if="ruta">
      <!-- Pedidos -->
      <section class="card space-y-4">
        <h2 class="text-lg font-semibold text-gray-800">Pedidos en ruta ({{ ruta.itemsRuta?.length ?? 0 }})</h2>
        <ul class="text-sm divide-y divide-gray-100 border rounded-lg overflow-hidden">
          <li
            v-for="item in itemsRutaOrdenados"
            :key="item.id"
            class="flex flex-col gap-3 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0 text-left">
              <p class="font-medium text-gray-800">{{ item.pedido?.numero ?? item.pedidoId }}</p>
              <p class="text-xs text-gray-500 truncate">
                {{ item.pedido?.cliente?.nombre ?? '' }}
                <span v-if="item.pedido?.trabajador?.nombre"> · {{ item.pedido.trabajador.nombre }}</span>
              </p>
              <p class="mt-1 flex items-start gap-1.5 text-xs text-gray-500">
                <MapPin class="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-300" />
                <span>{{ direccionPedidoRuta(item.pedido) }}</span>
              </p>
              <p class="mt-0.5 text-xs text-gray-400">{{ resumenPedidoRuta(item.pedido) }}</p>
            </div>
            <div class="flex flex-wrap items-center gap-2 sm:justify-end">
              <EstadoBadge :estado="item.pedido?.estado ?? ''" />
              <button
                v-if="puedeCorregirPedido(item)"
                type="button"
                class="text-xs text-blue-600 hover:underline"
                @click="abrirEditarPedidoEnRuta(item)"
              >
                Corregir
              </button>
              <button
                v-if="puedeEditarPedidos"
                type="button"
                class="text-xs text-red-600 hover:underline"
                @click="quitarPedido(item.pedidoId)"
              >
                Quitar
              </button>
            </div>
          </li>
          <li v-if="!ruta.itemsRuta?.length" class="px-4 py-8 text-gray-400 text-center">Sin pedidos</li>
        </ul>

        <p
          v-if="puedeEditarPedidos"
          class="text-sm text-blue-800 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2"
        >
          Podés <strong>agregar o quitar</strong> pedidos mientras la ruta no esté liquidada. Si un pedido ya generó venta,
          primero corrige la liquidación o elimina la ruta completa.
        </p>
      </section>

      <!-- Agregar pedidos -->
      <section v-if="puedeEditarPedidos" class="card space-y-3">
        <h2 class="text-lg font-semibold text-gray-800">Agregar pedidos disponibles</h2>
        <div v-if="loadingPendientes" class="text-sm text-gray-400">Cargando…</div>
        <div v-else-if="!pedidosPendientes.length" class="text-sm text-gray-400">No hay pedidos disponibles para ruta.</div>
        <div v-else class="space-y-1 max-h-56 overflow-y-auto border rounded-lg p-2 bg-gray-50">
          <label
            v-for="p in pedidosPendientesOrdenados"
            :key="p.id"
            class="flex items-center gap-3 p-2 rounded hover:bg-white cursor-pointer text-sm"
            :class="pedidosSeleccionados.includes(p.id) ? 'bg-white ring-1 ring-blue-300' : ''"
          >
            <input v-model="pedidosSeleccionados" type="checkbox" :value="p.id" class="accent-blue-600" />
            <span class="font-medium text-gray-700">{{ p.numero ?? p.numeroPedido }}</span>
            <span class="text-gray-500 text-xs truncate">{{ p.cliente?.nombre ?? '' }}</span>
            <EstadoBadge :estado="p.estado" />
            <span v-if="p.estado === 'REPROGRAMADO'" class="text-[11px] text-purple-600">
              {{ formatDate(p.fechaReprogramacion ?? p.fecha) }}
            </span>
          </label>
        </div>
        <button
          type="button"
          class="btn-primary w-full sm:w-auto"
          :disabled="!pedidosSeleccionados.length || agregandoPedidos"
          @click="agregarPedidosSeleccionados"
        >
          {{ agregandoPedidos ? 'Agregando…' : `Agregar ${pedidosSeleccionados.length || ''} pedido(s)` }}
        </button>
      </section>

      <!-- Siguiente paso (acciones de estado) -->
      <section v-if="acciones.length" class="card space-y-3">
        <h2 class="text-lg font-semibold text-gray-800">Siguiente paso</h2>
        <div class="flex flex-wrap gap-3">
          <div v-for="a in acciones" :key="a.valor" class="flex flex-col gap-1 min-w-[200px] flex-1">
            <button
              type="button"
              :class="[
                'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition',
                a.variant === 'danger'
                  ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                  : 'bg-blue-950 text-white hover:bg-blue-900',
              ]"
              @click="cambiarEstadoRuta(a.valor)"
            >
              <component :is="a.icon" :size="18" />
              {{ a.label }}
            </button>
            <p v-if="a.hint" class="text-xs text-gray-500 px-0.5">{{ a.hint }}</p>
          </div>
        </div>
      </section>

      <!-- Liquidación: pantalla aparte -->
      <section
        v-if="ruta.estado === 'EN_LIQUIDACION'"
        class="card border-2 border-green-200 bg-gradient-to-br from-green-50 to-white space-y-3"
      >
        <h2 class="text-lg font-semibold text-gray-900">Listo para liquidar</h2>
        <p class="text-sm text-gray-600">
          Abrí el <strong>panel de liquidación</strong> en una vista dedicada (entregas, cobros y totales).
        </p>
        <button
          type="button"
          class="btn-primary bg-green-600 hover:bg-green-700 inline-flex items-center gap-2 w-full sm:w-auto"
          :disabled="navegandoLiquidacion"
          @click="abrirLiquidacion"
        >
          <span
            v-if="navegandoLiquidacion"
            class="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"
          />
          {{ navegandoLiquidacion ? 'Abriendo liquidación...' : 'Abrir panel de liquidación' }}
        </button>
      </section>

      <section v-if="ruta.estado === 'LIQUIDADA'" class="card border-green-200 bg-green-50/50">
        <p class="text-green-800 font-medium">Esta ruta ya fue liquidada.</p>
      </section>
      <section v-if="ruta.estado === 'ANULADA'" class="card border-gray-200 bg-gray-50">
        <p class="text-gray-700">Esta ruta fue anulada.</p>
      </section>
    </template>

    <ModalConfirmacion
      ref="modalAnulaConfirm"
      titulo="¿Anular esta ruta?"
      descripcion="No podrá liquidarse. Los pedidos volverán a estado pendiente donde aplique."
      textoConfirm="Anular"
      textoCancel="Volver"
      :detalles="{ Ruta: ruta?.numero, Trabajador: ruta?.domiciliario?.nombre }"
      advertencia="Esta acción no se puede deshacer."
      @confirm="procederAnular"
      @cancel="modalAnulaConfirm?.close()"
    />

    <ModalConfirmacion
      ref="modalEliminarRuta"
      titulo="Eliminar ruta"
      descripcion="La ruta se eliminara y sus pedidos volveran a pendiente si aun no tiene historial operativo."
      textoConfirm="Eliminar"
      textoCancel="Cancelar"
      :detalles="{ Ruta: ruta?.numero, Trabajador: ruta?.domiciliario?.nombre }"
      advertencia="Si la ruta esta en liquidacion, tambien se limpiaran ventas, cartera, caja e inventario generados por esa liquidacion."
      @confirm="eliminarRuta"
      @cancel="modalEliminarRuta?.close()"
    />

    <div
      v-if="modalEditarPedido && pedidoEditando"
      class="fixed inset-0 bg-black/40 flex items-stretch justify-center z-50 p-0 sm:items-center sm:p-4"
      @click.self="cerrarEditarPedidoEnRuta"
    >
      <div class="bg-white rounded-none shadow-xl w-full max-w-3xl p-4 sm:rounded-lg sm:p-6 space-y-4 max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="font-bold text-gray-800">Corregir pedido</h2>
            <p class="text-sm text-gray-500 mt-1">{{ pedidoEditando.numero }}</p>
          </div>
          <EstadoBadge :estado="pedidoEditando.estado" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Cliente *">
            <select v-model="pedidoForm.clienteId" class="form-input">
              <option :value="undefined">Seleccionar...</option>
              <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">
                {{ cliente.nombre }}
              </option>
            </select>
          </FormField>
          <FormField label="Trabajador *">
            <select v-model="pedidoForm.trabajadorId" class="form-input">
              <option :value="undefined">Seleccionar...</option>
              <option v-for="trabajador in trabajadores" :key="trabajador.id" :value="trabajador.id">
                {{ trabajador.nombre }}
              </option>
            </select>
          </FormField>
          <FormField label="Fecha *">
            <input v-model="pedidoForm.fecha" type="date" class="form-input" />
          </FormField>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <h3 class="font-semibold text-gray-700">Productos</h3>
            <button
              type="button"
              class="btn-secondary text-xs py-1 px-2 inline-flex items-center gap-1"
              @click="agregarDetallePedido"
            >
              <Plus :size="14" />
              Agregar
            </button>
          </div>

          <div
            v-for="(detalle, index) in pedidoForm.detalles"
            :key="index"
            class="grid grid-cols-1 sm:grid-cols-[1fr_90px_130px_36px] gap-2 items-end"
          >
            <FormField label="Producto *">
              <select v-model="detalle.productoId" class="form-input" @change="aplicarPrecioProducto(detalle)">
                <option :value="undefined">Seleccionar...</option>
                <option v-for="producto in productos" :key="producto.id" :value="producto.id">
                  {{ producto.nombre }}
                </option>
              </select>
            </FormField>
            <FormField label="Cant.">
              <input v-model.number="detalle.cantidad" type="number" min="1" class="form-input" />
            </FormField>
            <FormField label="Precio">
              <input v-model.number="detalle.precioUnitario" type="number" min="0" class="form-input" />
            </FormField>
            <button
              type="button"
              class="h-10 rounded-lg text-red-500 hover:bg-red-50"
              @click="pedidoForm.detalles.splice(index, 1)"
            >
              <X :size="16" class="mx-auto" />
            </button>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t pt-4">
          <p class="text-sm text-gray-600">
            Total corregido:
            <span class="font-semibold text-gray-900">{{ formatCurrency(totalPedidoEditando) }}</span>
          </p>
          <div class="flex justify-end gap-2">
            <button class="btn-secondary" @click="cerrarEditarPedidoEnRuta">Cancelar</button>
            <button class="btn-primary" :disabled="guardandoEdicionPedido" @click="guardarPedidoEnRuta">
              {{ guardandoEdicionPedido ? 'Guardando...' : 'Guardar corrección' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency, formatDate } from '~/utils/formats'
import {
  ArrowLeft,
  Ban,
  ClipboardList,
  MapPin,
  PackageCheck,
  Plus,
  Trash2,
  Truck,
  X,
} from 'lucide-vue-next'
import { ordenarPedidosAscendente } from '~/utils/reglas-negocio'
definePageMeta({ middleware: 'auth' })

type Accion = {
  valor: string
  label: string
  hint?: string
  variant?: 'danger'
  icon: typeof PackageCheck
}

const TRANSICIONES: Record<string, Accion[]> = {
  CREADA: [
    {
      valor: 'CARGADA',
      label: 'Carga lista',
      hint: 'Confirma que el pedido físico va en el vehículo.',
      icon: PackageCheck,
    },
    { valor: 'ANULADA', label: 'Anular ruta', variant: 'danger', icon: Ban },
  ],
  CARGADA: [
    {
      valor: 'EN_ENTREGA',
      label: 'Salir a entregar',
      hint: 'Bloquea cambios de pedidos en esta ruta.',
      icon: Truck,
    },
    { valor: 'ANULADA', label: 'Anular ruta', variant: 'danger', icon: Ban },
  ],
  EN_ENTREGA: [
    {
      valor: 'EN_LIQUIDACION',
      label: 'Fin de entrega',
      hint: 'Volviste a base. Después abrí el panel de liquidación para registrar cobros.',
      icon: ClipboardList,
    },
  ],
}

const route = useRoute()
const router = useRouter()
const api = useApi()
const notify = useNotification()
const apiResponse = useApiResponse()

const id = computed(() => Number(route.params.id))

const loading = ref(true)
const loadError = ref('')
const ruta = ref<any>(null)

const pedidosSeleccionados = ref<number[]>([])
const agregandoPedidos = ref(false)
const pedidosPendientes = ref<any[]>([])
const loadingPendientes = ref(false)
const modalAnulaConfirm = ref()
const modalEliminarRuta = ref()
const navegandoLiquidacion = ref(false)
const deleting = ref(false)
const modalEditarPedido = ref(false)
const guardandoEdicionPedido = ref(false)
const pedidoEditando = ref<any>(null)
const clientes = ref<any[]>([])
const productos = ref<any[]>([])
const trabajadores = ref<any[]>([])
const pedidoForm = reactive({
  clienteId: undefined as number | undefined,
  trabajadorId: undefined as number | undefined,
  fecha: '',
  observaciones: '',
  detalles: [] as Array<{ productoId: number | undefined; cantidad: number; precioUnitario: number }>,
})

const puedeEditarPedidos = computed(() =>
  ['CREADA', 'CARGADA', 'EN_ENTREGA', 'EN_LIQUIDACION'].includes(ruta.value?.estado ?? ''),
)

const itemsRutaOrdenados = computed(() =>
  ordenarPedidosAscendente<any>(ruta.value?.itemsRuta ?? [], (item) =>
    String(item.pedido?.numero ?? item.pedidoId ?? ''),
  ),
)

const pedidosPendientesOrdenados = computed(() =>
  ordenarPedidosAscendente<any>(pedidosPendientes.value, (p) =>
    String(p.numero ?? p.numeroPedido ?? p.id ?? ''),
  ),
)

const totalPedidoEditando = computed(() =>
  pedidoForm.detalles.reduce((total, detalle) => {
    return total + Number(detalle.cantidad ?? 0) * Number(detalle.precioUnitario ?? 0)
  }, 0),
)

const acciones = computed(() => {
  const e = ruta.value?.estado
  if (!e || e === 'EN_LIQUIDACION' || e === 'LIQUIDADA' || e === 'ANULADA') return []
  return TRANSICIONES[e] ?? []
})

function puedeCorregirPedido(item: any) {
  const estadoPedido = item?.pedido?.estado
  return puedeEditarPedidos.value && ['PENDIENTE', 'CARGADO_EN_RUTA'].includes(estadoPedido)
}

function direccionPedidoRuta(pedido: any) {
  return pedido?.cliente?.direccion || pedido?.direccionEntrega || pedido?.direccion || 'Sin direccion registrada'
}

function resumenPedidoRuta(pedido: any) {
  const detalles = Array.isArray(pedido?.detalles) ? pedido.detalles : []
  if (!detalles.length) return 'Sin productos detallados'
  const resumen = detalles.slice(0, 2).map((detalle: any) => {
    const nombre = detalle.producto?.nombre ?? detalle.productoNombre ?? `Producto ${detalle.productoId ?? ''}`.trim()
    const cantidad = Number(detalle.cantidad ?? 0)
    return cantidad > 0 ? `${cantidad} ${nombre}` : nombre
  })
  const faltantes = detalles.length - resumen.length
  return faltantes > 0 ? `${resumen.join(', ')} +${faltantes}` : resumen.join(', ')
}

function fechaInput(value: string | Date | undefined) {
  if (!value) return new Date().toISOString().split('T')[0]
  return String(value).split('T')[0]
}

function listaCatalogo(res: any) {
  const data = apiResponse.unwrap(res) as any
  return data.items ?? data.data ?? data ?? []
}

async function cargarCatalogosEdicion() {
  if (clientes.value.length && productos.value.length && trabajadores.value.length) return

  const [clientesRes, productosRes, trabajadoresRes] = await Promise.all([
    api.get('/catalogos/clientes', { params: { activo: 'true', limit: 500 } }),
    api.get('/catalogos/productos', { params: { activo: 'true', limit: 500 } }),
    api.get('/catalogos/trabajadores', { params: { activo: 'true', limit: 500 } }),
  ])
  clientes.value = listaCatalogo(clientesRes)
  productos.value = listaCatalogo(productosRes)
  trabajadores.value = listaCatalogo(trabajadoresRes)
}

async function abrirEditarPedidoEnRuta(item: any) {
  const pedidoId = item?.pedido?.id ?? item?.pedidoId
  if (!pedidoId) return

  try {
    await cargarCatalogosEdicion()
    const res = await api.get(`/operaciones/pedidos/${pedidoId}`)
    const pedido = apiResponse.unwrap(res) as any
    pedidoEditando.value = pedido
    pedidoForm.clienteId = pedido.clienteId
    pedidoForm.trabajadorId = pedido.trabajadorId
    pedidoForm.fecha = fechaInput(pedido.fecha)
    pedidoForm.observaciones = pedido.observaciones ?? ''
    pedidoForm.detalles = (pedido.detalles ?? []).map((detalle: any) => ({
      productoId: detalle.productoId,
      cantidad: Number(detalle.cantidad ?? 1),
      precioUnitario: Number(detalle.precioUnitario ?? 0),
    }))
    modalEditarPedido.value = true
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'No se pudo cargar el pedido para corregir')
  }
}

function cerrarEditarPedidoEnRuta() {
  modalEditarPedido.value = false
  pedidoEditando.value = null
  pedidoForm.detalles = []
}

function agregarDetallePedido() {
  pedidoForm.detalles.push({ productoId: undefined, cantidad: 1, precioUnitario: 0 })
}

function aplicarPrecioProducto(detalle: { productoId: number | undefined; precioUnitario: number }) {
  const producto = productos.value.find((p) => p.id === detalle.productoId)
  if (producto && !detalle.precioUnitario) {
    detalle.precioUnitario = Number(producto.precioVenta ?? producto.precio ?? 0)
  }
}

function validarPedidoEnRuta() {
  if (!pedidoForm.clienteId) return 'Selecciona un cliente'
  if (!pedidoForm.trabajadorId) return 'Selecciona un trabajador'
  if (!pedidoForm.fecha) return 'Selecciona una fecha'
  const detallesValidos = pedidoForm.detalles.filter(
    (detalle) => detalle.productoId && detalle.cantidad > 0 && detalle.precioUnitario > 0,
  )
  if (!detallesValidos.length) return 'Agrega al menos un producto valido'
  if (detallesValidos.length !== pedidoForm.detalles.length) {
    return 'Revisa productos, cantidades y precios antes de guardar'
  }
  return ''
}

async function guardarPedidoEnRuta() {
  if (!pedidoEditando.value) return
  const error = validarPedidoEnRuta()
  if (error) {
    notify.error(error)
    return
  }

  guardandoEdicionPedido.value = true
  try {
    await api.patch(`/operaciones/pedidos/${pedidoEditando.value.id}`, {
      clienteId: pedidoForm.clienteId,
      trabajadorId: pedidoForm.trabajadorId,
      fecha: pedidoForm.fecha,
      observaciones: pedidoForm.observaciones || undefined,
      detalles: pedidoForm.detalles.map((detalle) => ({
        productoId: detalle.productoId,
        cantidad: detalle.cantidad,
        precioUnitario: detalle.precioUnitario,
      })),
    })
    notify.success(`Pedido ${pedidoEditando.value.numero} corregido`)
    cerrarEditarPedidoEnRuta()
    await fetchRuta()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'No se pudo corregir el pedido')
  } finally {
    guardandoEdicionPedido.value = false
  }
}

async function fetchRuta() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await api.get(`/operaciones/rutas/${id.value}`)
    ruta.value = apiResponse.unwrap(res)
    pedidosSeleccionados.value = []
    await fetchPedidosPendientes()
  } catch {
    loadError.value = 'No se pudo cargar la ruta.'
    ruta.value = null
  } finally {
    loading.value = false
  }
}

async function fetchPedidosPendientes() {
  if (!ruta.value || !puedeEditarPedidos.value) {
    pedidosPendientes.value = []
    return
  }
  loadingPendientes.value = true
  try {
    const res = await api.get('/operaciones/pedidos', {
      params: {
        soloDisponiblesRuta: 'true',
        limit: 200,
        rutaId: ruta.value.id,
      },
    })
    const d = apiResponse.unwrap(res) as any
    const lista = d.items ?? d.data ?? []
    const itemsRuta = ruta.value.itemsRuta ?? []
    const itemPorPedido = new Map<number, any>(
      itemsRuta.map((item: any) => [Number(item.pedidoId), item]),
    )

    pedidosPendientes.value = (Array.isArray(lista) ? lista : []).filter((p: any) => {
      const item = itemPorPedido.get(Number(p.id))
      if (!item) return true
      if (p.estado === 'REPROGRAMADO') return true
      if (item.estado === 'REPROGRAMADO' || item.pedido?.estado === 'REPROGRAMADO') return true
      return false
    })
  } catch {
    pedidosPendientes.value = []
    notify.error('No se pudieron cargar pedidos pendientes')
  } finally {
    loadingPendientes.value = false
  }
}

watch(id, () => fetchRuta())

async function agregarPedidosSeleccionados() {
  if (!pedidosSeleccionados.value.length || !ruta.value) return
  agregandoPedidos.value = true
  try {
    let orden = (ruta.value.itemsRuta?.length ?? 0) + 1
    for (const pedidoId of pedidosSeleccionados.value) {
      await api.post(`/operaciones/rutas/${ruta.value.id}/pedidos`, {
        pedidoId,
        ordenEntrega: orden++,
      })
    }
    notify.success(`${pedidosSeleccionados.value.length} pedido(s) agregado(s)`)
    pedidosSeleccionados.value = []
    await fetchRuta()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al agregar pedidos')
  } finally {
    agregandoPedidos.value = false
  }
}

async function quitarPedido(pedidoId: number) {
  if (!ruta.value) return
  try {
    await api.delete(`/operaciones/rutas/${ruta.value.id}/pedidos/${pedidoId}`)
    notify.success('Pedido removido')
    await fetchRuta()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al quitar pedido')
  }
}

function cambiarEstadoRuta(estadoNuevo: string) {
  if (estadoNuevo === 'ANULADA') modalAnulaConfirm.value?.open()
  else procederCambioEstado(estadoNuevo)
}

async function procederAnular() {
  modalAnulaConfirm.value?.close()
  await procederCambioEstado('ANULADA')
}

async function procederCambioEstado(estadoNuevo: string) {
  if (!ruta.value) return
  try {
    await api.patch(`/operaciones/rutas/${ruta.value.id}/estado`, { estado: estadoNuevo })
    notify.success('Estado actualizado')
    await fetchRuta()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al cambiar estado')
  }
}

async function abrirLiquidacion() {
  if (!ruta.value || navegandoLiquidacion.value) return
  navegandoLiquidacion.value = true
  await router.push(`/rutas/${ruta.value.id}/liquidacion`)
}

async function eliminarRuta() {
  if (!ruta.value) return
  deleting.value = true
  try {
    await api.delete(`/operaciones/rutas/${ruta.value.id}`)
    notify.success(`Ruta ${ruta.value.numero} eliminada`)
    modalEliminarRuta.value?.close()
    await router.push('/rutas')
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'No se pudo eliminar la ruta')
    modalEliminarRuta.value?.close()
  } finally {
    deleting.value = false
  }
}

onMounted(fetchRuta)
</script>
