<template>
  <div class="max-w-3xl mx-auto space-y-6 py-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Editar producto</h1>
        <p class="text-sm text-gray-500">Modifica la información del producto.</p>
      </div>
      <NuxtLink to="/catalogos/productos" class="btn-secondary">Volver</NuxtLink>
    </div>

    <div v-if="loading" class="card flex items-center justify-center h-40 text-gray-500">
      Cargando producto…
    </div>

    <div v-else class="card space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Código *" :error="errors.codigo">
          <input v-model="form.codigo" class="form-input" disabled />
        </FormField>
        <FormField label="Nombre *" :error="errors.nombre">
          <input v-model="form.nombre" class="form-input" />
        </FormField>
        <FormField label="Categoría *" :error="errors.categoria">
          <select v-model="form.categoria" class="form-input">
            <option v-for="c in CATEGORIAS_PRODUCTO" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
        </FormField>
        <FormField label="Unidad *" :error="errors.unidad">
          <select v-model="form.unidad" class="form-input">
            <option v-for="u in UNIDADES_PRODUCTO" :key="u.value" :value="u.value">{{ u.label }}</option>
          </select>
        </FormField>
      </div>

      <FormField label="Descripción">
        <input v-model="form.descripcion" class="form-input" />
      </FormField>

      <div class="flex justify-end gap-3 pt-2">
        <NuxtLink to="/catalogos/productos" class="btn-secondary">Cancelar</NuxtLink>
        <button class="btn-primary" :disabled="saving" @click="guardarProducto">
          {{ saving ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from '#imports'
import { useApi } from '~/composables/useApi'
import { useApiResponse } from '~/composables/useApiResponse'
import { useNotification } from '~/composables/useNotification'
import { CATEGORIAS_PRODUCTO, UNIDADES_PRODUCTO } from '~/utils/producto-labels'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const api = useApi()
const apiResponse = useApiResponse()
const notify = useNotification()

const loading = ref(true)
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

async function fetchProducto() {
  loading.value = true
  try {
    const res = await api.get(`/catalogos/productos/${route.params.id}`)
    const producto = apiResponse.unwrap(res) as any
    Object.assign(form, {
      codigo: producto.codigo ?? '',
      nombre: producto.nombre ?? '',
      categoria: producto.categoria ?? 'PACA',
      unidad: producto.unidad ?? 'UNIDAD',
      descripcion: producto.descripcion ?? '',
    })
  } catch (e: any) {
    notify.error(apiResponse.errorMessage(e))
  } finally {
    loading.value = false
  }
}

async function guardarProducto() {
  if (!validarForm()) return
  saving.value = true
  try {
    await api.put(`/catalogos/productos/${route.params.id}`, form)
    notify.success('Producto actualizado')
    navigateTo('/catalogos/productos')
  } catch (e: any) {
    notify.error(apiResponse.errorMessage(e))
  } finally {
    saving.value = false
  }
}

onMounted(fetchProducto)
</script>
