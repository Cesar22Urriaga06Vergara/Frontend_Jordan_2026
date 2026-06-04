<template>
  <div class="mx-auto max-w-6xl space-y-6 py-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Nuevo pedido</h1>
        <p class="text-sm text-gray-500">Registra cliente, responsable y productos para despacho.</p>
      </div>
      <NuxtLink to="/pedidos" class="btn-secondary text-center">Volver a pedidos</NuxtLink>
    </div>

    <div class="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
      <div class="card space-y-6">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Cliente *" :error="errors.clienteId">
            <select v-model="form.clienteId" class="form-input">
              <option :value="undefined">Seleccionar...</option>
              <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">
                {{ cliente.nombre }}
              </option>
            </select>
          </FormField>
          <FormField label="Trabajador *" :error="errors.trabajadorId">
            <select v-model="form.trabajadorId" class="form-input">
              <option :value="undefined">Seleccionar...</option>
              <option v-for="trabajador in trabajadores" :key="trabajador.id" :value="trabajador.id">
                {{ trabajador.nombre }}
              </option>
            </select>
          </FormField>
          <FormField label="Fecha *" :error="errors.fecha">
            <input v-model="form.fecha" type="date" class="form-input" />
          </FormField>
        </div>

        <div v-if="selectedCliente" class="rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-sm">
          <p class="font-semibold text-blue-950">{{ selectedCliente.nombre }}</p>
          <div class="mt-2 grid grid-cols-1 gap-2 text-blue-900 sm:grid-cols-2">
            <p class="flex items-start gap-2">
              <MapPin class="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
              <span>{{ direccionCliente(selectedCliente) }}</span>
            </p>
            <p class="flex items-center gap-2">
              <Phone class="h-4 w-4 text-blue-500" />
              <span>{{ telefonoCliente(selectedCliente) }}</span>
            </p>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-semibold text-gray-700">Detalles del pedido</h2>
            <button type="button" class="btn-secondary inline-flex items-center gap-1 px-2 py-1 text-xs" @click="agregarDetalle">
              <Plus class="h-4 w-4" />
              Anadir producto
            </button>
          </div>

          <div v-if="!form.detalles.length" class="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
            Agrega al menos un producto para este pedido.
          </div>

          <div
            v-for="(detalle, index) in form.detalles"
            :key="index"
            class="grid grid-cols-1 items-end gap-2 rounded-lg border border-gray-100 p-3 sm:grid-cols-[1fr_96px_132px_36px]"
          >
            <FormField label="Producto *" :error="errors.detalles[index]?.productoId">
              <select v-model="detalle.productoId" class="form-input" @change="aplicarPrecioProducto(detalle)">
                <option :value="undefined">Seleccionar producto...</option>
                <option v-for="producto in productos" :key="producto.id" :value="producto.id">
                  {{ producto.nombre }}
                </option>
              </select>
            </FormField>

            <FormField label="Cant." :error="errors.detalles[index]?.cantidad">
              <input v-model.number="detalle.cantidad" type="number" min="1" class="form-input text-center" />
            </FormField>

            <FormField label="Precio" :error="errors.detalles[index]?.precioUnitario">
              <input v-model.number="detalle.precioUnitario" type="number" min="0" step="1" class="form-input text-right" />
            </FormField>

            <button type="button" class="h-10 rounded-lg text-red-500 hover:bg-red-50" @click="form.detalles.splice(index, 1)">
              x
            </button>
          </div>
        </div>

        <FormField label="Observaciones">
          <textarea v-model="form.observaciones" rows="3" class="form-input resize-none" />
        </FormField>
      </div>

      <aside class="card h-fit space-y-4">
        <div>
          <p class="text-xs font-semibold uppercase text-gray-400">Resumen</p>
          <h2 class="mt-1 text-lg font-bold text-gray-900">Pedido de hoy</h2>
        </div>
        <div class="space-y-3 text-sm">
          <div class="flex items-center justify-between gap-3 border-b border-gray-100 pb-2">
            <span class="text-gray-500">Cliente</span>
            <strong class="text-right text-gray-800">{{ selectedCliente?.nombre ?? 'Sin seleccionar' }}</strong>
          </div>
          <div class="flex items-center justify-between gap-3 border-b border-gray-100 pb-2">
            <span class="text-gray-500">Trabajador</span>
            <strong class="text-right text-gray-800">{{ selectedTrabajador?.nombre ?? 'Sin seleccionar' }}</strong>
          </div>
          <div class="flex items-center justify-between gap-3 border-b border-gray-100 pb-2">
            <span class="text-gray-500">Lineas</span>
            <strong class="text-gray-800">{{ form.detalles.length }}</strong>
          </div>
          <div class="flex items-center justify-between gap-3">
            <span class="text-gray-500">Total estimado</span>
            <strong class="text-xl text-gray-900">{{ formatCurrency(totalPedido) }}</strong>
          </div>
        </div>
        <div class="flex flex-col gap-2 pt-2">
          <button class="btn-primary w-full" :disabled="saving" @click="crearPedido">
            {{ saving ? 'Creando...' : 'Crear pedido' }}
          </button>
          <NuxtLink to="/pedidos" class="btn-secondary text-center">Cancelar</NuxtLink>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MapPin, Phone, Plus } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useApiResponse } from '~/composables/useApiResponse'
import { useNotification } from '~/composables/useNotification'
import { formatCurrency, todayISO } from '~/utils/formats'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const apiResponse = useApiResponse()
const { error, success } = useNotification()
const { fetchEstadoJornada, requireJornadaAbierta } = useJornadaOperativa()

const saving = ref(false)
const clientes = ref<any[]>([])
const productos = ref<any[]>([])
const trabajadores = ref<any[]>([])
const form = reactive({
  clienteId: undefined as number | undefined,
  trabajadorId: undefined as number | undefined,
  fecha: todayISO(),
  detalles: [] as Array<{ productoId: number | undefined; cantidad: number; precioUnitario: number }>,
  observaciones: '',
})
const errors = reactive({ clienteId: '', trabajadorId: '', fecha: '', detalles: [] as Array<{ productoId: string; cantidad: string; precioUnitario: string }> })

const selectedCliente = computed(() => clientes.value.find(c => c.id === form.clienteId))
const selectedTrabajador = computed(() => trabajadores.value.find(t => t.id === form.trabajadorId))

const totalPedido = computed(() => {
  return form.detalles.reduce((total, detalle) => {
    const cantidad = Number(detalle.cantidad) || 0
    const precio = Number(detalle.precioUnitario) || 0
    return total + cantidad * precio
  }, 0)
})

function direccionCliente(cliente: any) {
  return cliente?.direccion || cliente?.vereda || 'Sin direccion registrada'
}

function telefonoCliente(cliente: any) {
  return cliente?.telefono || cliente?.celular || 'Sin telefono'
}

function aplicarPrecioProducto(detalle: { productoId: number | undefined; precioUnitario: number }) {
  const producto = productos.value.find(p => p.id === detalle.productoId)
  if (producto) detalle.precioUnitario = Number(producto.precioVenta ?? producto.precio ?? detalle.precioUnitario ?? 0)
}

function validarForm() {
  errors.clienteId = form.clienteId ? '' : 'El cliente es requerido'
  errors.trabajadorId = form.trabajadorId ? '' : 'El trabajador es requerido'
  errors.fecha = form.fecha ? '' : 'La fecha es requerida'
  errors.detalles = form.detalles.map((detalle) => ({
    productoId: detalle.productoId ? '' : 'El producto es requerido',
    cantidad: detalle.cantidad > 0 ? '' : 'La cantidad debe ser mayor a 0',
    precioUnitario: detalle.precioUnitario > 0 ? '' : 'El precio debe ser mayor a 0',
  }))
  return !errors.clienteId && !errors.trabajadorId && !errors.fecha && errors.detalles.every((d) => !d.productoId && !d.cantidad && !d.precioUnitario)
}

async function loadCatalogos() {
  try {
    const [clientesRes, productosRes, trabajadoresRes] = await Promise.all([
      api.get('/catalogos/clientes?activo=true&limit=200'),
      api.get('/catalogos/productos?activo=true&limit=200'),
      api.get('/catalogos/trabajadores?activo=true&limit=200'),
    ])
    clientes.value = apiResponse.list(clientesRes)
    productos.value = apiResponse.list(productosRes)
    trabajadores.value = apiResponse.list(trabajadoresRes)
  } catch {
    error('No se pudieron cargar los catalogos')
  }
}

function agregarDetalle() {
  form.detalles.push({ productoId: undefined, cantidad: 1, precioUnitario: 0 })
}

async function crearPedido() {
  if (!validarForm()) return
  saving.value = true
  try {
    await api.post('/operaciones/pedidos', {
      clienteId: form.clienteId,
      trabajadorId: form.trabajadorId,
      fecha: form.fecha,
      detalles: form.detalles.filter((d) => d.productoId && d.cantidad > 0 && d.precioUnitario > 0),
      observaciones: form.observaciones || undefined,
      esDeRuta: false,
    })
    success('Pedido creado')
    navigateTo('/pedidos')
  } catch (e: any) {
    error(e?.response?.data?.message || 'Error al crear pedido')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await fetchEstadoJornada()
  if (!requireJornadaAbierta()) {
    navigateTo('/pedidos')
    return
  }
  await loadCatalogos()
})
</script>
