<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="n in notifications"
          :key="n.id"
          class="px-4 py-3 rounded-lg shadow-lg text-sm font-medium pointer-events-auto max-w-xs"
          :class="{
            'bg-green-600 text-white': n.type === 'success',
            'bg-red-600 text-white': n.type === 'error',
            'bg-yellow-500 text-white': n.type === 'warning',
            'bg-blue-600 text-white': n.type === 'info',
          }"
        >
          {{ n.message }}
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const { notifications } = useNotification()
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
