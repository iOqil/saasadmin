<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth'] })
</script>

<template>
  <UDashboardPanel id="announcements">
    <template #header>
      <UDashboardNavbar title="Xabarlar va E'lonlar">
        <template #leading><UDashboardSidebarCollapse /></template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="flex flex-col items-center justify-center py-32 text-gray-400">
        <UIcon name="i-lucide-bell" class="text-6xl mb-4" />
        <p class="text-lg font-medium">Xabarlar tez orada</p>
        <p class="text-sm mt-1">Bu bo'lim ishlab chiqilmoqda</p>
      </div>
    </template>
  </UDashboardPanel>
</template>
