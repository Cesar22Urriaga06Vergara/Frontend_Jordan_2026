<template>
  <div class="flex items-center gap-1 text-sm text-gray-600">
    <NuxtLink to="/" class="hover:text-blue-600 hover:underline flex items-center gap-1 transition-colors duration-150">
      <Home :size="14" />
      <span class="hidden sm:inline">Inicio</span>
    </NuxtLink>

    <template v-for="(crumb, i) in crumbs" :key="i">
      <span class="text-gray-300 mx-0.5">/</span>

      <NuxtLink
        v-if="i < crumbs.length - 1"
        :to="crumb.href"
        class="hover:text-blue-600 hover:underline transition-colors duration-150"
      >
        {{ crumb.label }}
      </NuxtLink>
      <span v-else class="font-semibold text-gray-800">{{ crumb.label }}</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Home } from 'lucide-vue-next'

const props = defineProps<{
  crumbs: { label: string; href: string }[]
}>()
</script>
