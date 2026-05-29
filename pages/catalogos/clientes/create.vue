<template>
  <div class="max-w-3xl mx-auto space-y-6 py-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Nuevo cliente</h1>
        <p class="text-sm text-gray-500">Registra un nuevo cliente en el catálogo.</p>
      </div>
      <NuxtLink to="/catalogos/clientes" class="btn-secondary">Volver</NuxtLink>
    </div>

    <div class="card space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Código *" :error="errors.codigo">
          <input v-model="form.codigo" class="form-input" />
        </FormField>
        <FormField label="Nombre *" :error="errors.nombre">
          <input v-model="form.nombre" class="form-input" />
        </FormField>
        <FormField label="Tipo *" :error="errors.tipo">
          <select v-model="form.tipo" class="form-input">
            <option value="TIENDA">TIENDA</option>
            <option value="NEGOCIO">NEGOCIO</option>
            <option value="DIRECTO">DIRECTO</option>
            <option value="VEREDA">VEREDA</option>
            <option value="FRECUENTE">FRECUENTE</option>
          </select>
        </FormField>
        <FormField label="NIT">
          <input v-model="form.nit" class="form-input" />
        </FormField>
        <FormField label="Cédula">
          <input v-model="form.cedula" class="form-input" />
        </FormField>
        <FormField label="Teléfono">
          <input v-model="form.telefono" class="form-input" />
        </FormField>
        <FormField label="Dirección">
          <input v-model="form.direccion" class="form-input" />
        </FormField>
        <FormField label="Vereda">
          <input v-model="form.vereda" class="form-input" />
        </FormField>
      </div>

      <FormField label="Observaciones">
        <textarea v-model="form.observaciones" rows="3" class="form-input resize-none" />
      </FormField>

      <div class="flex justify-end gap-3 pt-2">
        <NuxtLink to="/catalogos/clientes" class="btn-secondary">Cancelar</NuxtLink>
        <button class="btn-primary" :disabled="saving" @click="guardarCliente">
          {{ saving ? 'Guardando…' : 'Crear cliente' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useApiResponse } from '~/composables/useApiResponse'
import { useNotification } from '~/composables/useNotification'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const apiResponse = useApiResponse()
const notify = useNotification()

const saving = ref(false)
const form = reactive({
  codigo: '',
  nombre: '',
  tipo: 'TIENDA',
  nit: '',
  cedula: '',
  telefono: '',
  direccion: '',
  vereda: '',
  observaciones: '',
})
const errors = reactive({ codigo: '', nombre: '', tipo: '' })

function validarForm() {
  errors.codigo = form.codigo.trim() ? '' : 'El código es requerido'
  errors.nombre = form.nombre.trim() ? '' : 'El nombre es requerido'
  errors.tipo = form.tipo ? '' : 'El tipo es requerido'
  return !errors.codigo && !errors.nombre && !errors.tipo
}

async function guardarCliente() {
  if (!validarForm()) return
  saving.value = true
  try {
    await api.post('/catalogos/clientes', form)
    notify.success('Cliente creado')
    navigateTo('/catalogos/clientes')
  } catch (e: any) {
    notify.error(apiResponse.errorMessage(e))
  } finally {
    saving.value = false
  }
}
</script>
