<template>
  <div class="max-w-3xl mx-auto space-y-6 py-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Nuevo producto</h1>
        <p class="text-sm text-gray-500">Registra un producto nuevo en el catálogo.</p>
      </div>
      <NuxtLink to="/catalogos/productos" class="btn-secondary">Volver</NuxtLink>
    </div>

    <div class="card space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Código *" :error="errors.codigo">
          <input v-model="form.codigo" class="form-input" />
        </FormField>
        <FormField label="Nombre *" :error="errors.nombre">
          <input v-model="form.nombre" class="form-input" />
        </FormField>
        <FormField label="Categoría *" :error="errors.categoria">
          <select v-model="form.categoria" class="form-input">
            <option value="Normal">Normal</option>
            <option value="Hielo">Hielo</option>
            <option value="Picadillo">Picadillo</option>
            <option value="Botellon">Botellon</option>
            <option value="Recarga Botellon">Recarga Botellon</option>
            <option value="Granel">Granel</option>
          </select>
        </FormField>
        <FormField label="Unidad *" :error="errors.unidad">
          <input v-model="form.unidad" class="form-input" />
        </FormField>
      </div>

      <FormField label="Descripción">
        <input v-model="form.descripcion" class="form-input" />
      </FormField>

      <div class="flex justify-end gap-3 pt-2">
        <NuxtLink to="/catalogos/productos" class="btn-secondary">Cancelar</NuxtLink>
        <button class="btn-primary" :disabled="saving" @click="guardarProducto">
          {{ saving ? 'Guardando…' : 'Crear producto' }}
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
  categoria: 'Normal',
  unidad: '',
  descripcion: '',
})
const errors = reactive({ codigo: '', nombre: '', categoria: '', unidad: '' })

function validarForm() {
  errors.codigo = form.codigo.trim() ? '' : 'El código es requerido'
  errors.nombre = form.nombre.trim() ? '' : 'El nombre es requerido'
  errors.categoria = form.categoria ? '' : 'La categoría es requerida'
  errors.unidad = form.unidad.trim() ? '' : 'La unidad es requerida'
  return !errors.codigo && !errors.nombre && !errors.categoria && !errors.unidad
}

async function guardarProducto() {
  if (!validarForm()) return
  saving.value = true
  try {
    await api.post('/catalogos/productos', form)
    notify.success('Producto creado')
    navigateTo('/catalogos/productos')
  } catch (e: any) {
    notify.error(apiResponse.errorMessage(e))
  } finally {
    saving.value = false
  }
}
</script>
