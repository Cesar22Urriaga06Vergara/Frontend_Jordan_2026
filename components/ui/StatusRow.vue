<template>
  <div class="flex items-center gap-2 text-sm">
    <span class="text-base">{{ ok ? '✅' : '⏳' }}</span>
    <span :class="ok ? 'text-gray-700' : 'text-gray-400'">{{ label }}</span>
    <span v-if="detail" class="text-orange-500 text-xs">{{ detail }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; ok: boolean; detail?: string }>()
</script>
