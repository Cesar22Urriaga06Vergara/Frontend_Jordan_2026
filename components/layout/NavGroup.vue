<template>
  <div class="mb-1">
    <p class="px-4 py-1 text-xs font-semibold text-blue-400 uppercase tracking-widest">{{ label }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string }>()
</script>
