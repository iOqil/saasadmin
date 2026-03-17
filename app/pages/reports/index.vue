<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth'] })

const paymentStore = usePaymentStore()
const toast = useToast()
const loading = ref(false)
const dateFrom = ref('')
const dateTo = ref('')

onMounted(() => loadReport())

async function loadReport() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (dateFrom.value) params.date_from = dateFrom.value
    if (dateTo.value) params.date_to = dateTo.value
    await paymentStore.fetchReport(params)
  }
  catch {
    toast.add({ title: 'Hisobot yuklanmadi', color: 'error' })
  }
  finally {
    loading.value = false
  }
}

function exportCsv() {
  if (!r.value) return

  const rows: string[][] = [
    ['Oy', 'Jami (so\'m)', 'To\'lovlar soni'],
    ...r.value.monthly.map(m => [monthLabel(m.month), String(m.total), String(m.count)]),
    [],
    ['Tarif', 'Jami (so\'m)', 'To\'lovlar soni'],
    ...r.value.by_plan.map(p => [p.plan, String(p.total), String(p.count)]),
    [],
    ['To\'lov usuli', 'Jami (so\'m)', 'To\'lovlar soni'],
    ...r.value.by_method.map(m => [methodLabel(m.payment_method), String(m.total), String(m.count)]),
  ]

  const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `hisobot-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const r = computed(() => paymentStore.report)

function formatMoney(n: number | string) {
  return new Intl.NumberFormat('uz-UZ').format(Number(n)) + " so'm"
}

function methodLabel(m: string) {
  const map: Record<string, string> = { transfer: "Bank o'tkazmasi", cash: 'Naqd pul', card: 'Karta', other: 'Boshqa' }
  return map[m] ?? m
}

function monthLabel(m: string) {
  const months = ['', 'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
  const [year, month] = m.split('-')
  return `${months[Number(month)]} ${year}`
}

const maxMonthly = computed(() => {
  if (!r.value?.monthly.length) return 1
  return Math.max(...r.value.monthly.map(m => Number(m.total)))
})

function barWidth(total: number) {
  return `${(Number(total) / maxMonthly.value * 100).toFixed(1)}%`
}
</script>

<template>
  <UDashboardPanel id="reports">
    <template #header>
      <UDashboardNavbar title="Hisobotlar" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            v-if="r"
            color="neutral"
            variant="ghost"
            icon="i-lucide-download"
            @click="exportCsv"
          >
            CSV
          </UButton>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-refresh-cw"
            :loading="loading"
            @click="loadReport"
          />
        </template>
      </UDashboardNavbar>
      <UDashboardToolbar>
        <template #left>
          <div class="flex items-center gap-2">
            <UInput v-model="dateFrom" type="date" class="w-40" />
            <span class="text-gray-400 text-sm">—</span>
            <UInput v-model="dateTo" type="date" class="w-40" />
            <UButton size="sm" icon="i-lucide-filter" @click="loadReport">
              Filter
            </UButton>
            <UButton
              v-if="dateFrom || dateTo"
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              @click="dateFrom = ''; dateTo = ''; loadReport()"
            />
          </div>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div v-if="loading" class="flex justify-center py-32">
        <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl text-primary-500" />
      </div>

      <div v-else-if="r" class="p-6 space-y-8">

        <!-- KPI Summary -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <UCard>
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <UIcon name="i-lucide-trending-up" class="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p class="text-xs text-gray-500">Tasdiqlangan daromad</p>
                <p class="text-xl font-bold text-green-600 mt-0.5">{{ formatMoney(r.total_confirmed) }}</p>
              </div>
            </div>
          </UCard>
          <UCard>
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                <UIcon name="i-lucide-clock" class="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p class="text-xs text-gray-500">Kutilayotgan to'lovlar</p>
                <p class="text-xl font-bold text-yellow-600 mt-0.5">{{ formatMoney(r.total_pending) }}</p>
              </div>
            </div>
          </UCard>
          <UCard>
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                <UIcon name="i-lucide-circle-dollar-sign" class="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p class="text-xs text-gray-500">So'nggi oy</p>
                <p class="text-xl font-bold text-primary-600 mt-0.5">
                  {{ formatMoney(r.monthly.at(-1)?.total ?? 0) }}
                </p>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Monthly Bar Chart -->
        <UCard>
          <template #header>
            <h3 class="font-semibold text-base">Oylik Daromad (so'nggi 12 oy)</h3>
          </template>
          <div v-if="!r.monthly.length" class="text-center py-10 text-gray-400">
            <p>Hozircha ma'lumot yo'q</p>
          </div>
          <div v-else class="space-y-2">
            <div v-for="m in r.monthly" :key="m.month" class="flex items-center gap-3">
              <span class="text-xs text-gray-500 w-28 shrink-0">{{ monthLabel(m.month) }}</span>
              <div class="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-6 overflow-hidden">
                <div
                  class="h-full bg-primary-500 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                  :style="{ width: barWidth(m.total) }"
                >
                  <span class="text-xs text-white font-medium whitespace-nowrap">{{ formatMoney(m.total) }}</span>
                </div>
              </div>
              <span class="text-xs text-gray-400 w-12 text-right shrink-0">{{ m.count }} ta</span>
            </div>
          </div>
        </UCard>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <!-- By Plan -->
          <UCard>
            <template #header>
              <h3 class="font-semibold text-base">Tarif Bo'yicha Daromad</h3>
            </template>
            <div v-if="!r.by_plan.length" class="text-center py-8 text-gray-400">
              <p class="text-sm">Ma'lumot yo'q</p>
            </div>
            <div v-else class="space-y-3">
              <div v-for="item in r.by_plan" :key="item.plan" class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ item.plan }}</span>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold text-gray-900 dark:text-white">{{ formatMoney(item.total) }}</p>
                  <p class="text-xs text-gray-400">{{ item.count }} ta to'lov</p>
                </div>
              </div>
            </div>
          </UCard>

          <!-- By Method -->
          <UCard>
            <template #header>
              <h3 class="font-semibold text-base">To'lov Usuli Bo'yicha</h3>
            </template>
            <div v-if="!r.by_method.length" class="text-center py-8 text-gray-400">
              <p class="text-sm">Ma'lumot yo'q</p>
            </div>
            <div v-else class="space-y-3">
              <div v-for="item in r.by_method" :key="item.payment_method" class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <UIcon
                    :name="item.payment_method === 'cash' ? 'i-lucide-banknote' :
                           item.payment_method === 'transfer' ? 'i-lucide-arrow-left-right' :
                           item.payment_method === 'card' ? 'i-lucide-credit-card' : 'i-lucide-more-horizontal'"
                    class="w-4 h-4 text-gray-400"
                  />
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ methodLabel(item.payment_method) }}
                  </span>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold text-gray-900 dark:text-white">{{ formatMoney(item.total) }}</p>
                  <p class="text-xs text-gray-400">{{ item.count }} ta</p>
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <div class="flex justify-end">
          <UButton to="/payments" trailing-icon="i-lucide-arrow-right" variant="ghost" color="neutral">
            Barcha to'lovlarni ko'rish
          </UButton>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-32 text-gray-400">
        <UIcon name="i-lucide-bar-chart-3" class="text-6xl mb-4" />
        <p class="text-lg font-medium">Hisobot yuklanmadi</p>
        <UButton class="mt-4" @click="paymentStore.fetchReport()">Qayta urinish</UButton>
      </div>
    </template>
  </UDashboardPanel>
</template>
