<template>
  <div
    class="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 p-6 flex items-start gap-4 hover:shadow-lg transition-shadow"
    :class="{ 'opacity-60': loading }"
  >
    <div
      class="w-14 h-14 rounded-lg flex items-center justify-center text-3xl flex-shrink-0 shadow-sm"
      :class="bgClass"
    >
      {{ icon }}
    </div>
    <div class="flex-1">
      <p class="text-xs text-gray-500 font-bold uppercase tracking-widest">{{ label }}</p>
      <p class="text-2xl font-black text-gray-900 mt-1">
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
