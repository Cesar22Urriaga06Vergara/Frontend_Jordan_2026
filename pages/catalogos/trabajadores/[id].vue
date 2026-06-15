<template>
  <div class="max-w-4xl mx-auto space-y-6 py-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Editar trabajador</h1>
        <p class="text-sm text-gray-500">Actualiza la información del trabajador.</p>
      </div>
      <NuxtLink to="/catalogos/trabajadores" class="btn-secondary">Volver</NuxtLink>
    </div>

    <div v-if="loading" class="card flex items-center justify-center h-40 text-gray-500">
      Cargando trabajador…
    </div>

    <div v-else class="card space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Código *" :error="errors.codigo">
          <input v-model="form.codigo" class="form-input" disabled />
        </FormField>
        <FormField label="Nombre *" :error="errors.nombre">
          <input v-model="form.nombre" class="form-input" />
        </FormField>
        <FormField label="Cédula *" :error="errors.cedula">
          <input v-model="form.cedula" class="form-input" />
        </FormField>
        <FormField label="Teléfono">
          <input v-model="form.telefono" class="form-input" />
        </FormField>
        <FormField label="Dirección">
          <input v-model="form.direccion" class="form-input" />
        </FormField>
        <FormField label="ClasificaciÃ³n *" :error="errors.tipoTrabajador">
          <select v-model="form.tipoTrabajador" class="form-input">
            <option v-for="tipo in tiposTrabajador" :key="tipo.nombre" :value="tipo.nombre">
              {{ tipo.nombre }}
            </option>
          </select>
        </FormField>
        <FormField label="Cargo / labor principal">
          <select v-model="form.cargo" class="form-input">
            <option value="">Sin cargo definido</option>
            <option v-for="labor in laborTipos" :key="labor.id" :value="labor.nombre">
              {{ labor.nombre }} - {{ tipoPagoLabel(labor.tipo) }}
            </option>
          </select>
        </FormField>
        <FormField label="Modalidad pago *" class="sm:col-span-2">
          <select v-model="form.modalidadPago" class="form-input">
            <option value="POR_JORNADA">Por jornada</option>
            <option value="POR_HORA">Por hora</option>
            <option value="POR_PACA">Por paca</option>
          </select>
          <p class="mt-1 text-xs text-gray-500">{{ modalidadPagoHelp }}</p>
        </FormField>
        <FormField
          v-if="form.modalidadPago === 'POR_JORNADA'"
          label="Tarifa por jornada *"
          :error="errors.valorPago"
          class="sm:col-span-2"
        >
          <input v-model.number="form.valorPago" type="number" min="0" class="form-input" />
        </FormField>
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <NuxtLink to="/catalogos/trabajadores" class="btn-secondary">Cancelar</NuxtLink>
        <button class="btn-primary" :disabled="saving" @click="guardarTrabajador">
          {{ saving ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from '#imports'
import { useApi } from '~/composables/useApi'
import { useApiResponse } from '~/composables/useApiResponse'
import { useNotification } from '~/composables/useNotification'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const api = useApi()
const apiResponse = useApiResponse()
const notify = useNotification()

const loading = ref(true)
const saving = ref(false)
const laborTipos = ref<any[]>([])
const TIPOS_FALLBACK = ['PERMANENTE', 'TEMPORAL', 'PREVENTISTA', 'DOMICILIARIO', 'MIXTO'].map((nombre) => ({ nombre }))
const tiposTrabajador = ref<any[]>(TIPOS_FALLBACK)
const form = reactive({
  codigo: '',
  nombre: '',
  cedula: '',
  telefono: '',
  direccion: '',
  tipoTrabajador: 'PERMANENTE',
  cargo: '',
  modalidadPago: 'POR_JORNADA',
  valorPago: undefined as number | undefined,
})
const errors = reactive({ codigo: '', nombre: '', cedula: '', tipoTrabajador: '', valorPago: '' })
const modalidadPagoHelp = computed(() => {
  if (form.modalidadPago === 'POR_HORA') {
    return 'El valor por hora se define al registrar cada labor en Labores y Pagos.'
  }
  if (form.modalidadPago === 'POR_PACA') {
    return 'El valor por paca se define al registrar cada labor en Labores y Pagos.'
  }
  return 'Tarifa fija por jornada. Se puede usar como referencia al registrar labores.'
})

function tipoPagoLabel(tipo?: string) {
  if (tipo === 'POR_HORA') return 'por hora'
  if (tipo === 'POR_PACA') return 'por paca'
  if (tipo === 'POR_JORNADA') return 'por jornada'
  return 'manual'
}

async function fetchLaborTipos() {
  try {
    const res = await api.get('/catalogos/labor-tipos', { params: { activo: 'true' } })
    const d = apiResponse.unwrap(res) as any
    laborTipos.value = d.items ?? d
  } catch {
    laborTipos.value = []
  }
}

async function fetchTiposTrabajador() {
  try {
    const res = await api.get('/catalogos/trabajador-tipos', { params: { activo: 'true' } })
    const d = apiResponse.unwrap(res) as any
    tiposTrabajador.value = d.items ?? d
  } catch {
    tiposTrabajador.value = TIPOS_FALLBACK
  }
}

function validarForm() {
  errors.codigo = form.codigo.trim() ? '' : 'El código es requerido'
  errors.nombre = form.nombre.trim() ? '' : 'El nombre es requerido'
  errors.cedula = form.cedula.trim() ? '' : 'La cédula es requerida'
  errors.valorPago = form.modalidadPago === 'POR_JORNADA' && (!form.valorPago || form.valorPago <= 0)
    ? 'La tarifa por jornada es requerida'
    : form.valorPago && form.valorPago <= 0 ? 'Debe ser mayor a 0' : ''
  return !errors.codigo && !errors.nombre && !errors.cedula && !errors.valorPago
}

async function fetchTrabajador() {
  loading.value = true
  try {
    const res = await api.get(`/catalogos/trabajadores/${route.params.id}`)
    const trabajador = apiResponse.unwrap(res) as any
    Object.assign(form, {
      codigo: trabajador.codigo ?? '',
      nombre: trabajador.nombre ?? '',
      cedula: trabajador.cedula ?? '',
      telefono: trabajador.telefono ?? '',
      direccion: trabajador.direccion ?? '',
      tipoTrabajador: trabajador.tipoTrabajador ?? 'PERMANENTE',
      cargo: trabajador.cargo ?? '',
      modalidadPago: trabajador.modalidadPago ?? 'POR_JORNADA',
      valorPago: undefined,
    })

    if (trabajador.modalidadPago === 'POR_JORNADA' && Number(trabajador.tarifaBase ?? 0) > 0) {
      form.valorPago = Number(trabajador.tarifaBase)
    } else {
      const tarifaBase = (trabajador.laboresDisponibles ?? []).find(
        (lt: any) => lt?.laborTipo?.tipo === 'POR_JORNADA' && lt?.activo !== false && Number(lt?.tarifa ?? 0) > 0,
      )
      if (tarifaBase) form.valorPago = Number(tarifaBase.tarifa)
    }
  } catch (e: any) {
    notify.error(apiResponse.errorMessage(e))
  } finally {
    loading.value = false
  }
}

async function guardarTrabajador() {
  if (!validarForm()) return
  saving.value = true
  try {
    const payload: Record<string, any> = {
      codigo: form.codigo,
      nombre: form.nombre,
      cedula: form.cedula,
      telefono: form.telefono,
      direccion: form.direccion,
      tipoTrabajador: form.tipoTrabajador,
      cargo: form.cargo || undefined,
      modalidadPago: form.modalidadPago,
    }
    if (form.modalidadPago === 'POR_JORNADA' && form.valorPago && form.valorPago > 0) {
      payload.valorPago = form.valorPago
    }
    await api.put(`/catalogos/trabajadores/${route.params.id}`, payload)
    notify.success('Trabajador actualizado')
    navigateTo('/catalogos/trabajadores')
  } catch (e: any) {
    notify.error(apiResponse.errorMessage(e))
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchTrabajador(), fetchLaborTipos(), fetchTiposTrabajador()])
})
</script>
