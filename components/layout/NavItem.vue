<template>
  <NuxtLink
    :to="to"
    class="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg mx-2 transition-all duration-150"
    :aria-current="isActive ? 'page' : undefined"
    :class="isActive 
      ? 'bg-blue-600 text-white shadow-md' 
      : 'text-blue-100 hover:bg-blue-800 hover:text-white'"
  >
    <span class="flex items-center justify-center w-8 h-8">
      <component
        v-if="icon && typeof icon !== 'string'"
        :is="icon"
        class="h-5 w-5"
      />
      <span v-else class="text-base leading-none">{{ icon }}</span>
    </span>
    <span class="flex-1">{{ label }}</span>
    <ChevronRight v-if="isActive" class="h-4 w-4" aria-hidden="true" />
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { ChevronRight } from 'lucide-vue-next'

const props = defineProps<{
  to: string
  icon?: Component | string
  label: string
}>()

const route = useRoute()
const isActive = computed(() =>
  props.to === '/' ? route.path === '/' : route.path.startsWith(props.to),
)
</script>
