<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <h1 class="text-2xl font-bold text-gray-800">Cartera</h1>
      <button class="btn-secondary" @click="fetchCartera">Actualizar</button>
    </div>

    <!-- Resumen -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="card">
        <p class="text-sm text-gray-500">Total en cartera</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ formatCurrency(totalCartera) }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-gray-500">Clientes con deuda</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ cartera.length }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-gray-500">Deuda promedio</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ formatCurrency(promedioCartera) }}</p>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card flex flex-wrap gap-3">
      <input
        v-model="search"
        placeholder="Buscar cliente…"
        class="form-input max-w-xs"
      />
    </div>

    <!-- Tabla -->
    <div class="card overflow-x-auto p-0">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-center text-gray-500 border-b text-xs uppercase">
            <th class="px-4 py-3 font-medium">Cliente</th>
            <th class="px-4 py-3 font-medium">Venta</th>
            <th class="px-4 py-3 font-medium">Total venta</th>
            <th class="px-4 py-3 font-medium">Saldo pendiente</th>
            <th class="px-4 py-3 font-medium">Estado</th>
            <th class="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="px-4 py-8 text-center text-gray-400">Cargando…</td>
          </tr>
          <tr v-else-if="!filtradas.length">
            <td colspan="6" class="px-4 py-8 text-center text-gray-400">Sin deudas pendientes.</td>
          </tr>
          <tr
            v-for="c in filtradas"
            :key="c.id"
            class="border-b border-gray-50 hover:bg-gray-50 transition"
          >
            <td class="px-4 py-3 font-medium text-gray-800">{{ c.cliente?.nombre ?? '—' }}</td>
            <td class="px-4 py-3 text-gray-500 text-xs">{{ c.venta?.numero ?? '—' }}</td>
            <td class="px-4 py-3 text-right text-gray-600">{{ formatCurrency(c.venta?.totalVenta ?? 0) }}</td>
            <td class="px-4 py-3 text-right font-semibold text-orange-600">{{ formatCurrency(c.saldoPendiente) }}</td>
            <td class="px-4 py-3"><EstadoBadge :estado="c.estado ?? 'ACTIVO'" /></td>
            <td class="px-4 py-3 text-right">
              <button
                class="text-xs text-blue-600 hover:underline"
                @click="abrirPagoModal(c)"
              >Registrar pago</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal pago cartera -->
    <div
      v-if="modalPago"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="modalPago = false"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 class="font-bold text-gray-800">Registrar pago</h2>
        <p class="text-sm text-gray-500">
          {{ carteraSeleccionada?.cliente?.nombre }} —
          Saldo: {{ formatCurrency(carteraSeleccionada?.saldoPendiente ?? 0) }}
        </p>

        <FormField label="Monto ($) *">
          <input v-model.number="pagoForm.monto" class="form-input" type="number" min="0" />
        </FormField>
        <FormField label="Forma de pago">
          <select v-model="pagoForm.formaPago" class="form-input">
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia</option>
          </select>
        </FormField>
        <FormField label="Notas">
          <textarea v-model="pagoForm.notas" rows="2" class="form-input resize-none" />
        </FormField>

        <div class="flex justify-end gap-2 pt-2">
          <button class="btn-secondary" @click="modalPago = false">Cancelar</button>
          <button class="btn-primary" :disabled="saving || !pagoForm.monto" @click="registrarPago">
            {{ saving ? 'Guardando…' : 'Registrar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from '~/utils/formats'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const notify = useNotification()
const apiResponse = useApiResponse()

const loading = ref(true)
const saving = ref(false)
const cartera = ref<any[]>([])
const search = ref('')

const modalPago = ref(false)
const carteraSeleccionada = ref<any>(null)
const pagoForm = reactive({ monto: 0, formaPago: 'EFECTIVO', notas: '' })

const totalCartera = computed(() =>
  cartera.value.reduce((s, c) => s + (c.saldoPendiente ?? 0), 0)
)

const promedioCartera = computed(() =>
  cartera.value.length ? totalCartera.value / cartera.value.length : 0
)

const filtradas = computed(() => {
  if (!search.value) return cartera.value
  const q = search.value.toLowerCase()
  return cartera.value.filter(c =>
    (c.cliente?.nombre ?? '').toLowerCase().includes(q) ||
    (c.venta?.numero ?? '').toLowerCase().includes(q)
  )
})

async function fetchCartera() {
  loading.value = true
  try {
    const res = await api.get('/operaciones/ventas/cartera/resumen')
    const d = apiResponse.unwrap(res) as any
    cartera.value = d.items ?? d
  } catch {
    notify.error('Error al cargar cartera')
  } finally {
    loading.value = false
  }
}

function abrirPagoModal(c: any) {
  carteraSeleccionada.value = c
  pagoForm.monto = c.saldoPendiente ?? 0
  pagoForm.formaPago = 'EFECTIVO'
  pagoForm.notas = ''
  modalPago.value = true
}

async function registrarPago() {
  if (!carteraSeleccionada.value) return
  if (pagoForm.monto <= 0) {
    notify.error('El monto del pago debe ser mayor a cero')
    return
  }
  if (pagoForm.monto > Number(carteraSeleccionada.value.saldoPendiente ?? 0)) {
    notify.error('El pago no puede superar el saldo pendiente')
    return
  }

  saving.value = true
  try {
    await api.post(`/operaciones/ventas/${carteraSeleccionada.value.ventaId}/pagos`, {
      tipo: pagoForm.formaPago,
      monto: pagoForm.monto,
      observaciones: pagoForm.notas || undefined,
    })
    notify.success('Pago registrado')
    modalPago.value = false
    await fetchCartera()
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al registrar pago')
  } finally {
    saving.value = false
  }
}

onMounted(fetchCartera)
</script>
