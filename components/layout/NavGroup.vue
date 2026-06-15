<template>
  <div class="mb-4">
    <p class="px-4 py-2 text-[11px] font-bold text-blue-300 uppercase tracking-wider opacity-80 transition-opacity duration-200">
      {{ label }}
    </p>
    <slot />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ label: string }>()
</script>
