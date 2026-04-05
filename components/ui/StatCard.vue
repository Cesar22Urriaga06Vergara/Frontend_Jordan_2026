<template>
  <div
    class="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4"
    :class="{ 'opacity-60': loading }"
  >
    <div
      class="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
      :class="bgClass"
    >
      {{ icon }}
    </div>
    <div>
      <p class="text-xs text-gray-500 font-medium uppercase tracking-wide">{{ label }}</p>
      <p class="text-xl font-bold text-gray-800 mt-0.5">
        {{ loading ? '...' : value }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string
  value: string
  icon: string
  color: 'green' | 'blue' | 'orange' | 'purple' | 'red'
  loading?: boolean
}>()

const bgClass = computed(() => ({
  green: 'bg-green-100',
  blue: 'bg-blue-100',
  orange: 'bg-orange-100',
  purple: 'bg-purple-100',
  red: 'bg-red-100',
}[props.color]))
</script>
