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
        <FormField label="Modalidad pago *" :error="errors.valorPago">
          <select v-model="form.modalidadPago" class="form-input">
            <option value="POR_JORNADA">Por jornada</option>
            <option value="POR_HORA">Por hora</option>
            <option value="POR_PACA">Por paca</option>
          </select>
        </FormField>
        <FormField :label="tarifaBaseLabel" :error="errors.valorPago">
          <input v-model.number="form.valorPago" type="number" min="0" class="form-input" />
          <p class="mt-1 text-xs text-gray-500">{{ tarifaBaseHelp }}</p>
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
const tarifaBaseLabel = computed(() => {
  if (form.modalidadPago === 'POR_HORA') return 'Tarifa sugerida por hora ($)'
  if (form.modalidadPago === 'POR_PACA') return 'Tarifa sugerida por paca ($)'
  return 'Tarifa base por jornada ($)'
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
const tarifaBaseHelp = computed(() => {
  if (form.modalidadPago === 'POR_HORA') return 'Opcional. El valor real puede definirse al registrar la labor por horas.'
  if (form.modalidadPago === 'POR_PACA') return 'Opcional. El valor real se define al registrar pacas selladas.'
  return 'Se paga por jornada registrada en labores.'
})

function validarForm() {
  errors.codigo = form.codigo.trim() ? '' : 'El código es requerido'
  errors.nombre = form.nombre.trim() ? '' : 'El nombre es requerido'
  errors.cedula = form.cedula.trim() ? '' : 'La cédula es requerida'
  errors.valorPago = form.modalidadPago === 'POR_JORNADA' && (!form.valorPago || form.valorPago <= 0) ? 'La tarifa base debe ser mayor a 0' :
                      form.valorPago && form.valorPago <= 0 ? 'Debe ser mayor a 0' : ''
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
      valorPago: trabajador.valorPago ?? undefined,
    })

    const tarifaBase = (trabajador.laboresDisponibles ?? []).find(
      (lt: any) => ['POR_JORNADA', 'POR_HORA', 'POR_PACA'].includes(lt?.laborTipo?.tipo) && lt?.activo !== false,
    )
    if (tarifaBase) {
      form.modalidadPago = tarifaBase.laborTipo?.tipo ?? form.modalidadPago
      if (tarifaBase.tarifa !== undefined && tarifaBase.tarifa !== null) {
        form.valorPago = Number(tarifaBase.tarifa)
      }
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
    await api.put(`/catalogos/trabajadores/${route.params.id}`, {
      codigo: form.codigo,
      nombre: form.nombre,
      cedula: form.cedula,
      telefono: form.telefono,
      direccion: form.direccion,
      tipoTrabajador: form.tipoTrabajador,
      cargo: form.cargo || undefined,
      modalidadPago: form.modalidadPago,
      valorPago: form.valorPago,
    })
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
