<script setup lang="ts">
  definePageMeta({ layout: 'dashboard', middleware: ['auth'] })

  const tenantStore = useTenantStore()

  const s = computed(() => tenantStore.stats)

  function formatMoney(n: number) {
    return new Intl.NumberFormat('uz-UZ').format(n ?? 0) + " so'm"
  }

  const activeRate = computed(() => {
    const total = s.value?.total ?? 0
    const active = s.value?.active ?? 0
    return total ? Math.round(active / total * 100) : 0
  })

  const kpiCards = computed(() => [
    {
      label: "Jami Markazlar",
      value: s.value?.total ?? 0,
      sub: `${activeRate.value}% faol`,
      icon: 'i-lucide-building-2',
      color: 'text-primary-600',
      bg: 'bg-primary-50 dark:bg-primary-900/20',
      to: '/tenants',
    },
    {
      label: "Faol",
      value: s.value?.active ?? 0,
      sub: `${s.value?.trial ?? 0} sinov muddatida`,
      icon: 'i-lucide-check-circle',
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
      to: '/tenants?status=active',
    },
    {
      label: "To'xtatilgan",
      value: s.value?.suspended ?? 0,
      sub: `${s.value?.expired ?? 0} muddati tugagan`,
      icon: 'i-lucide-pause-circle',
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-900/20',
      to: '/tenants?status=suspended',
    },
    {
      label: "Bu oy yangi",
      value: s.value?.new_this_month ?? 0,
      sub: 'oxirgi 30 kun',
      icon: 'i-lucide-trending-up',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      to: '/tenants',
    },
    {
      label: "Jami O'quvchilar",
      value: s.value?.total_students ?? 0,
      sub: `${s.value?.total_teachers ?? 0} o'qituvchi`,
      icon: 'i-lucide-graduation-cap',
      color: 'text-sky-600',
      bg: 'bg-sky-50 dark:bg-sky-900/20',
      to: '/tenants',
    },
    {
      label: "Oylik daromad",
      value: formatMoney(s.value?.monthly_revenue ?? 0),
      sub: 'joriy oy',
      icon: 'i-lucide-circle-dollar-sign',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      to: '/reports',
    },
  ])

  // Recent tenants
  const recentTenants = computed(() => tenantStore.tenants.slice(0, 5))

  onMounted(async () => {
    await Promise.all([
      tenantStore.fetchStats(),
      tenantStore.fetchTenants({}, 1),
    ])
  })

  type BadgeColor = 'error' | 'success' | 'warning' | 'neutral' | 'primary' | 'info'
  function statusColor(status: string): BadgeColor {
    const m: Record<string, BadgeColor> = { active: 'success', trial: 'warning', suspended: 'error', expired: 'neutral' }
    return m[status] ?? 'neutral'
  }
  function statusLabel(status: string) {
    const m: Record<string, string> = { active: 'Faol', trial: 'Sinov', suspended: "To'xtatilgan", expired: 'Muddati tugagan' }
    return m[status] ?? status
  }
</script>

<template>
  <UDashboardPanel id="dashboard">
    <template #header>
      <UDashboardNavbar title="Dashboard" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UColorModeButton />
          <UButton icon="i-lucide-refresh-cw" color="neutral" variant="ghost" square :loading="tenantStore.loading"
            @click="Promise.all([tenantStore.fetchStats(), tenantStore.fetchTenants({}, 1)])" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="sm:p-6 p-0 space-y-8">
        <!-- KPI Cards -->
        <div>
          <h2 class="text-base font-semibold text-gray-700 dark:text-gray-300 mb-4">Umumiy Ko'rsatkichlar</h2>
          <div v-if="tenantStore.loading && !s" class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <USkeleton v-for="i in 6" :key="i" class="h-24 rounded-xl" />
          </div>
          <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <NuxtLink v-for="card in kpiCards" :key="card.label" :to="card.to" class="group">
              <UCard class="hover:shadow-md transition-shadow cursor-pointer h-full">
                <div class="flex items-start gap-3">
                  <div :class="['w-10 h-10 rounded-lg flex items-center justify-center shrink-0', card.bg]">
                    <UIcon :name="card.icon" :class="['w-5 h-5', card.color]" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ card.label }}</p>
                    <p :class="['text-xl font-bold mt-0.5 truncate', card.color]">{{ card.value }}</p>
                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{{ card.sub }}</p>
                  </div>
                </div>
              </UCard>
            </NuxtLink>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Recent Tenants -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-base font-semibold text-gray-700 dark:text-gray-300">So'nggi Qo'shilgan Markazlar</h2>
              <UButton to="/tenants" variant="ghost" size="sm" trailing-icon="i-lucide-arrow-right">
                Barchasi
              </UButton>
            </div>
            <UCard>
              <div v-if="!recentTenants.length" class="text-center py-10 text-gray-400">
                Hech qanday markaz topilmadi
              </div>
              <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
                <div v-for="tenant in recentTenants" :key="tenant.id"
                  class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div class="flex items-center gap-3">
                    <UAvatar :alt="tenant.name" size="sm" />
                    <div>
                      <p class="font-medium text-sm text-gray-900 dark:text-white">{{ tenant.name }}</p>
                      <p class="text-xs text-gray-400">{{ tenant.primary_domain }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="text-right hidden sm:block">
                      <p class="text-xs text-gray-500">{{ tenant.students_count ?? 0 }} o'q. / {{ tenant.teachers_count
                        ?? 0 }} o'qi.</p>
                      <p class="text-xs text-gray-400">{{ tenant.plan?.name }}</p>
                    </div>
                    <UBadge :color="statusColor(tenant.status)" variant="subtle" size="sm">
                      {{ statusLabel(tenant.status) }}
                    </UBadge>
                    <UButton :to="`/tenants/${tenant.id}`" size="xs" color="neutral" variant="ghost"
                      icon="i-lucide-arrow-right" />
                  </div>
                </div>
              </div>
            </UCard>
          </div>

          <!-- By Plan Breakdown -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-base font-semibold text-gray-700 dark:text-gray-300">Tarif Bo'yicha Markazlar</h2>
              <UButton to="/plans" variant="ghost" size="sm" trailing-icon="i-lucide-arrow-right">
                Tariflar
              </UButton>
            </div>
            <UCard>
              <div v-if="!s?.by_plan?.length" class="text-center py-10 text-gray-400">
                <UIcon name="i-lucide-pie-chart" class="text-4xl mb-2" />
                <p class="text-sm">Ma'lumot yo'q</p>
              </div>
              <div v-else class="space-y-3">
                <div v-for="item in s.by_plan" :key="item.plan" class="space-y-1">
                  <div class="flex items-center justify-between text-sm">
                    <span class="font-medium text-gray-700 dark:text-gray-300">{{ item.plan }}</span>
                    <span class="text-gray-500">{{ item.count }} ta markaz</span>
                  </div>
                  <div class="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      class="h-full bg-primary-500 rounded-full transition-all duration-500"
                      :style="{ width: `${s.total ? (item.count / s.total * 100).toFixed(1) : 0}%` }"
                    />
                  </div>
                </div>
              </div>

              <template v-if="s?.by_plan?.length" #footer>
                <div class="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <p class="text-xs text-gray-500">Faol markazlar</p>
                    <p class="text-lg font-bold text-green-600">{{ s?.active ?? 0 }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">Bu oy yangi</p>
                    <p class="text-lg font-bold text-indigo-600">{{ s?.new_this_month ?? 0 }}</p>
                  </div>
                </div>
              </template>
            </UCard>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
