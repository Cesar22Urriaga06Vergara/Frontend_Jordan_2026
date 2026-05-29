<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="cancel()"
    >
      <div class="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl">
        <div class="bg-red-600 p-6">
          <div class="flex items-start gap-4">
            <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
              <AlertTriangle class="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">
                {{ titulo }}
              </h3>
              <p v-if="descripcion" class="mt-1 text-sm text-red-50">
                {{ descripcion }}
              </p>
            </div>
          </div>
        </div>

        <div class="p-6">
          <div v-if="detalles" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <div
              v-for="(valor, clave, idx) in detalles"
              :key="idx"
              class="mb-2 flex gap-2 text-sm last:mb-0"
            >
              <span class="min-w-fit font-medium text-gray-600">{{ clave }}:</span>
              <span class="font-semibold text-gray-900">{{ valor }}</span>
            </div>
          </div>

          <p v-if="advertencia" class="mb-4 flex items-center gap-2 text-xs italic text-gray-500">
            <CircleAlert class="h-4 w-4 text-gray-500" />
            <span>{{ advertencia }}</span>
          </p>
        </div>

        <div class="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 p-4">
          <button
            :disabled="isLoading"
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            @click="cancel()"
          >
            {{ textoCancel }}
          </button>
          <button
            :disabled="isLoading"
            class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
            @click="confirm()"
          >
            <span
              v-if="isLoading"
              class="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"
            />
            {{ isLoading ? 'Procesando...' : textoConfirm }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { AlertTriangle, CircleAlert } from 'lucide-vue-next'

interface Props {
  titulo?: string
  descripcion?: string
  textoConfirm?: string
  textoCancel?: string
  detalles?: Record<string, any>
  advertencia?: string
}

withDefaults(defineProps<Props>(), {
  titulo: '¿Confirmar esta acción?',
  textoConfirm: 'Sí, eliminar',
  textoCancel: 'Cancelar',
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const route = useRoute()
const isVisible = ref(false)
const isLoading = ref(false)

const open = () => {
  isVisible.value = true
  isLoading.value = false
}

const close = () => {
  isVisible.value = false
  isLoading.value = false
}

const confirm = async () => {
  isLoading.value = true
  emit('confirm')
}

const cancel = () => {
  emit('cancel')
  close()
}

watch(
  () => route.fullPath,
  () => close(),
)

defineExpose({
  open,
  close,
})
</script>
