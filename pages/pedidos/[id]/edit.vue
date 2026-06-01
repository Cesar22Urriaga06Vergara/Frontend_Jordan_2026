<template>
  <div class="max-w-4xl mx-auto space-y-6 py-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Editar pedido</h1>
        <p class="text-sm text-gray-500">Modifica los datos del pedido y guarda los cambios.</p>
      </div>
      <NuxtLink to="/pedidos" class="btn-secondary">Volver a pedidos</NuxtLink>
    </div>

    <div v-if="loading" class="card flex items-center justify-center h-40 text-gray-500">
      Cargando pedido…
    </div>

    <div v-else class="card space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Cliente *" :error="errors.clienteId">
          <select v-model="form.clienteId" class="form-input">
            <option :value="undefined">Seleccionar…</option>
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

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-gray-700">Detalles del pedido</h2>
          <button type="button" class="text-xs text-blue-600 hover:underline inline-flex items-center gap-1" @click="agregarDetalle">
            <Plus class="h-4 w-4" />
            Añadir producto
          </button>
        </div>

        <div v-if="!form.detalles.length" class="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
          Este pedido no tiene productos cargados.
        </div>

        <div v-for="(detalle, index) in form.detalles" :key="index" class="grid grid-cols-1 sm:grid-cols-[1fr_90px_120px_32px] gap-2 items-end">
          <FormField label="Producto *" :error="errors.detalles[index]?.productoId">
            <select v-model="detalle.productoId" class="form-input">
              <option :value="undefined">Seleccionar producto…</option>
              <option v-for="producto in productos" :key="producto.id" :value="producto.id">
                {{ producto.nombre }}
              </option>
            </select>
          </FormField>

          <FormField label="Cant." :error="errors.detalles[index]?.cantidad">
            <input v-model.number="detalle.cantidad" type="number" min="1" class="form-input" />
          </FormField>

          <FormField label="Precio" :error="errors.detalles[index]?.precioUnitario">
            <input v-model.number="detalle.precioUnitario" type="number" min="0" class="form-input" />
          </FormField>

          <button type="button" class="text-red-500 text-lg leading-none" @click="form.detalles.splice(index, 1)">×</button>
        </div>
      </div>

      <div class="flex items-center justify-between border-t border-gray-200 pt-4">
        <p class="text-sm text-gray-600">Total estimado</p>
        <p class="font-semibold text-gray-900">{{ formatCurrency(totalPedido) }}</p>
      </div>

      <FormField label="Observaciones">
        <textarea v-model="form.observaciones" rows="3" class="form-input resize-none" />
      </FormField>

      <div class="flex justify-end gap-3 pt-2">
        <NuxtLink to="/pedidos" class="btn-secondary">Cancelar</NuxtLink>
        <button class="btn-primary" :disabled="saving" @click="actualizarPedido">
          {{ saving ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from '#imports'
import { useApi } from '~/composables/useApi'
import { useApiResponse } from '~/composables/useApiResponse'
import { useNotification } from '~/composables/useNotification'
import { formatCurrency, todayISO } from '~/utils/formats'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const api = useApi()
const apiResponse = useApiResponse()
const { error, success } = useNotification()

const loading = ref(true)
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

const totalPedido = computed(() => {
  return form.detalles.reduce((total, detalle) => {
    const cantidad = Number(detalle.cantidad) || 0
    const precio = Number(detalle.precioUnitario) || 0
    return total + cantidad * precio
  }, 0)
})

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
    error('No se pudieron cargar los catálogos')
  }
}

async function fetchPedido() {
  loading.value = true
  try {
    const res = await api.get(`/operaciones/pedidos/${route.params.id}`)
    const pedido = apiResponse.unwrap(res) as any
    form.clienteId = pedido.clienteId
    form.trabajadorId = pedido.trabajadorId
    form.fecha = pedido.fecha?.split('T')[0] ?? todayISO()
    form.observaciones = pedido.observaciones ?? ''
    form.detalles = (pedido.detalles ?? []).map((detalle: any) => ({
      productoId: detalle.productoId,
      cantidad: detalle.cantidad,
      precioUnitario: detalle.precioUnitario,
    }))
  } catch {
    error('No se pudo cargar el pedido')
  } finally {
    loading.value = false
  }
}

function agregarDetalle() {
  form.detalles.push({ productoId: undefined, cantidad: 1, precioUnitario: 0 })
}

async function actualizarPedido() {
  if (!validarForm()) return
  saving.value = true
  try {
    await api.patch(`/operaciones/pedidos/${route.params.id}`, {
      clienteId: form.clienteId,
      trabajadorId: form.trabajadorId,
      fecha: form.fecha,
      detalles: form.detalles.filter((d) => d.productoId && d.cantidad > 0 && d.precioUnitario > 0),
      observaciones: form.observaciones || undefined,
    })
    success('Pedido actualizado')
    navigateTo('/pedidos')
  } catch (e: any) {
    error(e?.response?.data?.message || 'Error al actualizar pedido')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadCatalogos()
  await fetchPedido()
})
</script>
