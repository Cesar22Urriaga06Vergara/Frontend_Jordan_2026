<template>
  <div class="relative">
    <input
      :value="displayValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="[
        'form-input',
        disabled && 'bg-gray-50 cursor-not-allowed',
        error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
      ]"
      type="text"
      inputmode="numeric"
      @input="handleInput"
      @blur="handleBlur"
      @keydown.backspace="handleBackspace"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: number | string | null | undefined
  placeholder?: string
  disabled?: boolean
  error?: boolean
  min?: number
  max?: number
}

interface Emits {
  (e: 'update:modelValue', value: number): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '0',
  disabled: false,
  error: false,
  min: 0,
  max: 999_999_999,
})

const emit = defineEmits<Emits>()

// Estado interno para mantener la entrada del usuario sin formatear
const rawValue = computed(() => {
  const val = props.modelValue
  if (val === null || val === undefined) return ''
  return String(val).replace(/[^\d]/g, '')
})

// Display formateado
const displayValue = computed(() => {
  if (!rawValue.value) return ''
  const num = parseInt(rawValue.value, 10)
  if (Number.isNaN(num)) return ''
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
})

function handleInput(event: Event) {
  const input = event.target as HTMLInputElement
  // Solo números
  const cleaned = input.value.replace(/[^\d]/g, '')

  if (!cleaned) {
    emit('update:modelValue', 0)
    return
  }

  const num = parseInt(cleaned, 10)

  // Validaciones
  if (Number.isNaN(num) || num < 0) {
    emit('update:modelValue', 0)
    return
  }

  if (num > props.max) {
    emit('update:modelValue', props.max)
    return
  }

  emit('update:modelValue', num)
}

function handleBlur(_event: Event) {
  // Al salir, asegurar valor mínimo
  const num = parseInt(rawValue.value, 10) || 0
  if (num < props.min) {
    emit('update:modelValue', props.min)
  }
}

function handleBackspace(event: KeyboardEvent) {
  // Backspace normal en el input, no hacer nada especial
  // El input ya maneja esto correctamente
}
</script>
