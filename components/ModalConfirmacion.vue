<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <!-- HEADER CON ICONO -->
        <div class="bg-gradient-to-r from-red-500 to-red-600 p-6">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-white/20">
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

        <!-- CONTENIDO -->
        <div class="p-6">
          <!-- DETALLES DE LO QUE SE VA A ELIMINAR/CAMBIAR -->
          <div v-if="detalles" class="bg-red-50 rounded-lg p-4 border border-red-200 mb-4">
            <div v-for="(valor, clave, idx) in detalles" :key="idx" class="flex gap-2 text-sm mb-2 last:mb-0">
              <span class="text-gray-600 font-medium min-w-fit">{{ clave }}:</span>
              <span class="text-gray-900 font-semibold">{{ valor }}</span>
            </div>
          </div>

          <!-- ADVERTENCIA ADICIONAL -->
          <p v-if="advertencia" class="text-xs text-gray-500 italic mb-4">
            ⚠️ {{ advertencia }}
          </p>
        </div>

        <!-- BOTONES -->
        <div class="bg-gray-50 border-t border-gray-200 p-4 flex gap-3 justify-end">
          <button
            @click="cancel()"
            :disabled="isLoading"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
          >
            {{ textoCancel }}
          </button>
          <button
            @click="confirm()"
            :disabled="isLoading"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition flex items-center gap-2"
          >
            <span v-if="isLoading" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            {{ isLoading ? 'Procesando...' : textoConfirm }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'

interface Props {
  titulo?: string
  descripcion?: string
  textoConfirm?: string
  textoCancel?: string
  detalles?: Record<string, any>
  advertencia?: string
}

const props = withDefaults(defineProps<Props>(), {
  titulo: '¿Confirmar esta acción?',
  textoConfirm: 'Sí, eliminar',
  textoCancel: 'Cancelar',
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const isVisible = ref(false)
const isLoading = ref(false)

const open = () => {
  isVisible.value = true
  isLoading.value = false
}

const close = () => {
  isVisible.value = false
}

const confirm = async () => {
  isLoading.value = true
  emit('confirm')
  // El padre decidirá si cierra o no después de procesar
}

const cancel = () => {
  emit('cancel')
  close()
}

defineExpose({
  open,
  close,
})
</script>
