<template>
  <div>
    <label class="block text-xs font-medium text-gray-600 mb-1">
      {{ label }}<span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>
    <div :class="{ 'has-error': error }">
      <slot />
    </div>
    <p v-if="error" class="text-xs text-red-600 mt-1">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; required?: boolean; error?: string }>()
</script>

<style scoped>
.has-error :deep(input),
.has-error :deep(select),
.has-error :deep(textarea) {
  @apply border-red-500 focus:ring-red-500;
}
</style>
