<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b text-left text-xs uppercase text-gray-500">
          <th v-for="header in headers" :key="header" class="whitespace-nowrap pb-2 pr-3 font-medium">
            {{ header }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, rowIndex) in rows" :key="rowIndex" class="border-b border-gray-50">
          <td v-for="(cell, cellIndex) in row" :key="cellIndex" class="whitespace-nowrap py-2 pr-3 text-gray-700">
            {{ cell }}
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td :colspan="headers.length" class="py-4 text-center text-gray-400">Sin datos</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  headers: string[]
  rows: Array<Array<string | number>>
}>()
</script>
