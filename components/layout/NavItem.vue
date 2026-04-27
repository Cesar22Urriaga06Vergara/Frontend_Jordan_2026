<template>
  <NuxtLink
    :to="to"
    class="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg mx-2 transition-all duration-150"
    :class="isActive 
      ? 'bg-blue-600 text-white shadow-md' 
      : 'text-blue-100 hover:bg-blue-800 hover:text-white'"
  >
    <span class="text-base leading-none">{{ icon }}</span>
    <span class="flex-1">{{ label }}</span>
    <span v-if="isActive" class="text-xs">→</span>
  </NuxtLink>
</template>

<script setup lang="ts">
const props = defineProps<{
  to: string
  icon: string
  label: string
}>()

const route = useRoute()
const isActive = computed(() =>
  props.to === '/' ? route.path === '/' : route.path.startsWith(props.to),
)
</script>
