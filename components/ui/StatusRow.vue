<template>
  <div class="flex items-center gap-2 text-sm">
    <component :is="icon" class="h-4 w-4 text-gray-500" />
    <span :class="ok ? 'text-gray-700' : 'text-gray-400'">{{ label }}</span>
    <span v-if="detail" class="text-orange-500 text-xs">{{ detail }}</span>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle, Clock } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps<{ label: string; ok: boolean; detail?: string }>()
const icon = computed(() => (props.ok ? CheckCircle : Clock))
</script>
