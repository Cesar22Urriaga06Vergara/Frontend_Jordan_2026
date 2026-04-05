<template>
  <NuxtLink
    :to="to"
    class="flex flex-col items-center gap-1 p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors text-center"
  >
    <span class="text-2xl">{{ icon }}</span>
    <span class="text-xs font-medium text-gray-700">{{ label }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{ to: string; icon: string; label: string }>()
</script>
