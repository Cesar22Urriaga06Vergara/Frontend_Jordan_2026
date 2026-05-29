<template>
  <NuxtLink
    :to="to"
    class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md transition-all duration-150 text-center group"
  >
    <span class="text-3xl group-hover:scale-110 transition-transform">
      <component v-if="isComponentIcon" :is="icon" class="h-6 w-6" />
      <span v-else>{{ icon }}</span>
    </span>
    <span class="text-xs font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">{{ label }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'

const props = defineProps<{ to: string; icon?: Component | string; label: string }>()
const isComponentIcon = computed(() => props.icon && typeof props.icon !== 'string')
</script>
