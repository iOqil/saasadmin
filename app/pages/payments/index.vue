<script setup lang="ts">
import type { TenantPayment } from '~/stores/payment'

definePageMeta({ layout: 'dashboard', middleware: ['auth'] })

const paymentStore = usePaymentStore()
const tenantStore = useTenantStore()
const planStore = usePlanStore()
const toast = useToast()

const addModalOpen = ref(false)
const receiptModalOpen = ref(false)
const viewReceiptOpen = ref(false)
const rejectModalOpen = ref(false)
const rejectReason = ref('')
const selectedPayment = ref<TenantPayment | null>(null)
const saving = ref(false)
const filterStatus = ref('all')
const filterTenant = ref('all')
const filterMonth = ref('')
const currentPage = ref(1)

// Form
const form = reactive({
  tenant_id: '',
  plan_id: null as number | null,
  amount: 0,
  payment_method: 'transfer' as string,
  payment_date: new Date().toISOString().slice(0, 10),
  notes: '',
})
const receiptFile = ref<File | null>(null)
const receiptFileInput = ref<HTMLInputElement | null>(null)

const methodOptions = [
  { label: 'Bank o\'tkazmasi', value: 'transfer' },
  { label: 'Naqd', value: 'cash' },
  { label: 'Karta', value: 'card' },
  { label: 'Boshqa', value: 'other' },
]

const statusOptions = [
  { label: 'Barchasi', value: 'all' },
  { label: 'Kutilmoqda', value: 'pending' },
  { label: 'Tasdiqlangan', value: 'confirmed' },
  { label: 'Rad etilgan', value: 'rejected' },
]

onMounted(async () => {
  await Promise.all([
    paymentStore.fetchPayments(),
    tenantStore.fetchTenants({}, 1),
    planStore.fetchPlans(),
  ])
})

const tenantOptions = computed(() =>
  tenantStore.tenants.map(t => ({ label: t.name, value: t.id })),
)

const planOptions = computed(() =>
  planStore.plans.map(p => ({ label: `${p.name} — ${formatMoney(p.price)}`, value: p.id })),
)

function buildFilters() {
  const filters: Record<string, string> = {}
  if (filterStatus.value && filterStatus.value !== 'all') filters.status = filterStatus.value
  if (filterTenant.value && filterTenant.value !== 'all') filters.tenant_id = filterTenant.value
  if (filterMonth.value) filters.month = filterMonth.value
  return filters
}

async function applyFilters() {
  currentPage.value = 1
  await paymentStore.fetchPayments(buildFilters(), 1)
}

async function goToPage(page: number) {
  currentPage.value = page
  await paymentStore.fetchPayments(buildFilters(), page)
}

// Auto-fill plan + amount when tenant is selected
watch(() => form.tenant_id, (id) => {
  if (!id) return
  const tenant = tenantStore.tenants.find(t => t.id === id)
  if (tenant?.plan) {
    form.plan_id = tenant.plan.id
    form.amount = Number(tenant.plan.price)
  }
})

function openAdd() {
  Object.assign(form, {
    tenant_id: '',
    plan_id: null as number | null,
    amount: 0,
    payment_method: 'transfer',
    payment_date: new Date().toISOString().slice(0, 10),
    notes: '',
  })
  receiptFile.value = null
  addModalOpen.value = true
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  receiptFile.value = input.files?.[0] ?? null
}

async function submitAdd() {
  if (!form.tenant_id || !form.plan_id) {
    toast.add({ title: 'Markaz va tarif tanlang', color: 'error' })
    return
  }
  saving.value = true
  try {
    const fd = new FormData()
    fd.append('tenant_id', form.tenant_id)
    fd.append('plan_id', String(form.plan_id))
    fd.append('amount', String(form.amount))
    fd.append('payment_method', form.payment_method)
    fd.append('payment_date', form.payment_date)
    if (form.notes) fd.append('notes', form.notes)
    if (receiptFile.value) fd.append('receipt', receiptFile.value)

    await paymentStore.createPayment(fd)
    toast.add({ title: "To'lov qo'shildi", color: 'success' })
    addModalOpen.value = false
  } catch (e: any) {
    toast.add({ title: e?.data?.message ?? 'Xatolik', color: 'error' })
  } finally { saving.value = false }
}

async function confirm(payment: TenantPayment) {
  try {
    await paymentStore.confirmPayment(payment.id)
    toast.add({ title: "To'lov tasdiqlandi", color: 'success' })
  } catch (e: any) {
    toast.add({ title: e?.data?.message ?? 'Xatolik', color: 'error' })
  }
}

function openReject(payment: TenantPayment) {
  selectedPayment.value = payment
  rejectReason.value = ''
  rejectModalOpen.value = true
}

async function submitReject() {
  if (!selectedPayment.value) return
  saving.value = true
  try {
    await paymentStore.rejectPayment(selectedPayment.value.id, rejectReason.value || undefined)
    toast.add({ title: "To'lov rad etildi", color: 'warning' })
    rejectModalOpen.value = false
  } catch (e: any) {
    toast.add({ title: e?.data?.message ?? 'Xatolik', color: 'error' })
  } finally { saving.value = false }
}

function openReceipt(payment: TenantPayment) {
  selectedPayment.value = payment
  viewReceiptOpen.value = true
}

function openUploadReceipt(payment: TenantPayment) {
  selectedPayment.value = payment
  receiptFile.value = null
  receiptModalOpen.value = true
}

async function submitUploadReceipt() {
  if (!selectedPayment.value || !receiptFile.value) return
  saving.value = true
  try {
    const fd = new FormData()
    fd.append('receipt', receiptFile.value)
    await paymentStore.uploadReceipt(selectedPayment.value.id, fd)
    toast.add({ title: 'Kvitansiya yuklandi', color: 'success' })
    receiptModalOpen.value = false
  } catch (e: any) {
    toast.add({ title: e?.data?.message ?? 'Xatolik', color: 'error' })
  } finally { saving.value = false }
}

async function remove(payment: TenantPayment) {
  try {
    await paymentStore.deletePayment(payment.id)
    toast.add({ title: "To'lov o'chirildi", color: 'success' })
  } catch (e: any) {
    toast.add({ title: e?.data?.message ?? 'Xatolik', color: 'error' })
  }
}

function formatMoney(n: number | string) {
  return new Intl.NumberFormat('uz-UZ').format(Number(n)) + " so'm"
}

function statusColor(s: string) {
  const m: Record<string, string> = { confirmed: 'success', pending: 'warning', rejected: 'error' }
  return (m[s] ?? 'neutral') as any
}

function statusLabel(s: string) {
  const m: Record<string, string> = { confirmed: 'Tasdiqlangan', pending: 'Kutilmoqda', rejected: 'Rad etilgan' }
  return m[s] ?? s
}

function methodLabel(m: string) {
  const map: Record<string, string> = { transfer: "O'tkazma", cash: 'Naqd', card: 'Karta', other: 'Boshqa' }
  return map[m] ?? m
}

function isImage(mime: string | null) {
  return mime?.startsWith('image/') ?? false
}
</script>

<template>
  <UDashboardPanel id="payments">
    <template #header>
      <UDashboardNavbar title="Obuna To'lovlari" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton icon="i-lucide-plus" @click="openAdd">Yangi To'lov</UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-5">
        <!-- Filters -->
        <div class="flex flex-wrap gap-3">
          <USelect
            v-model="filterStatus"
            :items="statusOptions"
            value-key="value"
            label-key="label"
            placeholder="Status"
            class="w-40"
            @change="applyFilters"
          />
          <USelect
            v-model="filterTenant"
            :items="[{ label: 'Barcha markazlar', value: 'all' }, ...tenantOptions]"
            value-key="value"
            label-key="label"
            placeholder="Markaz"
            class="w-56"
            @change="applyFilters"
          />
          <UInput
            v-model="filterMonth"
            type="month"
            class="w-44"
            @change="applyFilters"
          />
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-refresh-cw"
            @click="applyFilters"
          />
        </div>

        <!-- Summary cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <UCard>
            <p class="text-xs text-gray-500">Jami to'lovlar</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white mt-1">{{ paymentStore.meta.total }}</p>
          </UCard>
          <UCard>
            <p class="text-xs text-gray-500">Kutilmoqda</p>
            <p class="text-xl font-bold text-yellow-600 mt-1">
              {{ paymentStore.payments.filter(p => p.status === 'pending').length }}
            </p>
          </UCard>
          <UCard>
            <p class="text-xs text-gray-500">Tasdiqlangan (jami)</p>
            <p class="text-xl font-bold text-green-600 mt-1">
              {{ formatMoney(paymentStore.payments.filter(p => p.status === 'confirmed').reduce((s, p) => s + Number(p.amount), 0)) }}
            </p>
          </UCard>
          <UCard>
            <p class="text-xs text-gray-500">Sahifa</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white mt-1">
              {{ paymentStore.meta.current_page }} / {{ paymentStore.meta.last_page }}
            </p>
          </UCard>
        </div>

        <!-- Table -->
        <UCard>
          <div v-if="paymentStore.loading" class="flex justify-center py-16">
            <UIcon name="i-lucide-loader-2" class="animate-spin text-3xl text-primary-500" />
          </div>
          <div v-else-if="!paymentStore.payments.length" class="text-center py-16 text-gray-400">
            <UIcon name="i-lucide-receipt" class="text-5xl mb-3" />
            <p>Hech qanday to'lov topilmadi</p>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-100 dark:border-gray-800 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th class="pb-3 pr-4">Markaz</th>
                  <th class="pb-3 pr-4">Tarif</th>
                  <th class="pb-3 pr-4">Miqdor</th>
                  <th class="pb-3 pr-4">Usul</th>
                  <th class="pb-3 pr-4">Sana</th>
                  <th class="pb-3 pr-4">Status</th>
                  <th class="pb-3 pr-4">Kvitansiya</th>
                  <th class="pb-3">Amallar</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50 dark:divide-gray-800/50">
                <tr v-for="p in paymentStore.payments" :key="p.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td class="py-3 pr-4 font-medium text-gray-900 dark:text-white">{{ p.tenant_name }}</td>
                  <td class="py-3 pr-4 text-gray-600 dark:text-gray-300">{{ p.plan_name }}</td>
                  <td class="py-3 pr-4 font-semibold text-primary-600">{{ formatMoney(p.amount) }}</td>
                  <td class="py-3 pr-4 text-gray-500">{{ methodLabel(p.payment_method) }}</td>
                  <td class="py-3 pr-4 text-gray-500">{{ p.payment_date }}</td>
                  <td class="py-3 pr-4">
                    <UBadge :color="statusColor(p.status)" variant="subtle" size="xs">
                      {{ statusLabel(p.status) }}
                    </UBadge>
                  </td>
                  <td class="py-3 pr-4">
                    <div v-if="p.receipt_url" class="flex items-center gap-1">
                      <UButton
                        size="xs"
                        color="neutral"
                        variant="ghost"
                        icon="i-lucide-eye"
                        @click="openReceipt(p)"
                      />
                      <UButton
                        size="xs"
                        color="neutral"
                        variant="ghost"
                        icon="i-lucide-upload"
                        @click="openUploadReceipt(p)"
                      />
                    </div>
                    <UButton
                      v-else
                      size="xs"
                      color="neutral"
                      variant="ghost"
                      icon="i-lucide-paperclip"
                      @click="openUploadReceipt(p)"
                    >
                      Yuklash
                    </UButton>
                  </td>
                  <td class="py-3">
                    <div class="flex gap-1">
                      <UButton
                        v-if="p.status === 'pending'"
                        size="xs"
                        color="success"
                        variant="ghost"
                        icon="i-lucide-check"
                        title="Tasdiqlash"
                        @click="confirm(p)"
                      />
                      <UButton
                        v-if="p.status === 'pending'"
                        size="xs"
                        color="error"
                        variant="ghost"
                        icon="i-lucide-x"
                        title="Rad etish"
                        @click="openReject(p)"
                      />
                      <UButton
                        size="xs"
                        color="error"
                        variant="ghost"
                        icon="i-lucide-trash-2"
                        @click="remove(p)"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="paymentStore.meta.last_page > 1" class="flex justify-center mt-4 gap-2">
            <UButton
              v-for="page in paymentStore.meta.last_page"
              :key="page"
              size="xs"
              :color="page === paymentStore.meta.current_page ? 'primary' : 'neutral'"
              :variant="page === paymentStore.meta.current_page ? 'solid' : 'ghost'"
              @click="goToPage(page)"
            >
              {{ page }}
            </UButton>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Add Payment Modal -->
  <UModal v-model:open="addModalOpen">
    <template #content>
      <UCard>
        <template #header>
          <h3 class="font-semibold text-lg">Yangi Obuna To'lovi</h3>
        </template>
        <form class="space-y-4" @submit.prevent="submitAdd">
          <UFormField label="Markaz" required>
            <USelect
              v-model="form.tenant_id"
              :items="tenantOptions"
              value-key="value"
              label-key="label"
              placeholder="Markazni tanlang"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Tarif Rejasi" required>
            <USelect
              v-model="form.plan_id"
              :items="planOptions"
              value-key="value"
              label-key="label"
              placeholder="Tarifni tanlang"
              class="w-full"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Miqdor (so'm)" required>
              <UInput
                v-model.number="form.amount"
                type="number"
                min="0"
                class="w-full"
              />
            </UFormField>
            <UFormField label="To'lov usuli" required>
              <USelect
                v-model="form.payment_method"
                :items="methodOptions"
                value-key="value"
                label-key="label"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField label="To'lov sanasi" required>
            <UInput v-model="form.payment_date" type="date" class="w-full" />
          </UFormField>

          <UFormField label="Izoh">
            <UTextarea
              v-model="form.notes"
              rows="2"
              class="w-full"
              placeholder="Ixtiyoriy izoh..."
            />
          </UFormField>

          <UFormField label="Kvitansiya (PDF yoki rasm)">
            <div
              class="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center cursor-pointer hover:border-primary-400 transition-colors"
              @click="receiptFileInput?.click()"
            >
              <input
                ref="receiptFileInput"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                class="hidden"
                @change="onFileChange"
              >
              <UIcon name="i-lucide-upload-cloud" class="text-3xl text-gray-400 mb-2" />
              <p v-if="receiptFile" class="text-sm font-medium text-primary-600">{{ receiptFile.name }}</p>
              <p v-else class="text-sm text-gray-400">PDF, JPG, PNG — max 10MB</p>
            </div>
          </UFormField>

          <div class="flex justify-end gap-3 pt-2">
            <UButton color="neutral" variant="ghost" @click="addModalOpen = false">Bekor</UButton>
            <UButton type="submit" :loading="saving">Saqlash</UButton>
          </div>
        </form>
      </UCard>
    </template>
  </UModal>

  <!-- Upload Receipt Modal -->
  <UModal v-model:open="receiptModalOpen">
    <template #content>
      <UCard>
        <template #header>
          <h3 class="font-semibold text-lg">Kvitansiya Yuklash</h3>
          <p class="text-sm text-gray-500 mt-0.5">{{ selectedPayment?.tenant_name }}</p>
        </template>
        <div class="space-y-4">
          <div
            class="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-primary-400 transition-colors"
            @click="receiptFileInput?.click()"
          >
            <input
              ref="receiptFileInput"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              class="hidden"
              @change="onFileChange"
            >
            <UIcon name="i-lucide-upload-cloud" class="text-4xl text-gray-400 mb-2" />
            <p v-if="receiptFile" class="text-sm font-medium text-primary-600">{{ receiptFile.name }}</p>
            <p v-else class="text-sm text-gray-400">PDF, JPG, PNG — max 10MB</p>
          </div>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="ghost" @click="receiptModalOpen = false">Bekor</UButton>
            <UButton :loading="saving" :disabled="!receiptFile" @click="submitUploadReceipt">Yuklash</UButton>
          </div>
        </div>
      </UCard>
    </template>
  </UModal>

  <!-- Reject Modal -->
  <UModal v-model:open="rejectModalOpen">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
              <UIcon name="i-lucide-x-circle" class="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h3 class="font-semibold">To'lovni rad etish</h3>
              <p class="text-xs text-gray-400 mt-0.5">{{ selectedPayment?.tenant_name }} — {{ formatMoney(selectedPayment?.amount ?? 0) }}</p>
            </div>
          </div>
        </template>
        <div class="space-y-4">
          <UFormField label="Rad etish sababi">
            <UTextarea
              v-model="rejectReason"
              rows="3"
              class="w-full"
              placeholder="Masalan: To'lov summasi noto'g'ri, kvitansiya sifatsiz..."
              autofocus
            />
          </UFormField>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="ghost" @click="rejectModalOpen = false">Bekor</UButton>
            <UButton
              color="error"
              :loading="saving"
              icon="i-lucide-x"
              @click="submitReject"
            >
              Rad etish
            </UButton>
          </div>
        </div>
      </UCard>
    </template>
  </UModal>

  <!-- View Receipt Modal -->
  <UModal v-model:open="viewReceiptOpen" :ui="{ width: 'max-w-2xl' }">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-lg">To'lov Kvitansiyasi</h3>
              <p class="text-xs text-gray-400 mt-0.5">{{ selectedPayment?.id }}</p>
            </div>
            <div class="flex gap-2">
              <UButton
                v-if="selectedPayment?.receipt_url"
                :href="selectedPayment.receipt_url"
                target="_blank"
                size="sm"
                color="neutral"
                variant="ghost"
                icon="i-lucide-external-link"
              >
                Ko'rish
              </UButton>
              <a
                v-if="selectedPayment?.receipt_url"
                :href="selectedPayment.receipt_url"
                :download="selectedPayment.receipt_original_name ?? 'kvitansiya'"
              >
                <UButton
                  size="sm"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-download"
                >Yuklash</UButton>
              </a>
            </div>
          </div>
        </template>

        <div class="space-y-5">
          <!-- Payment Info Grid -->
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p class="text-xs text-gray-500 mb-0.5">Markaz</p>
              <p class="font-semibold text-sm text-gray-900 dark:text-white">{{ selectedPayment?.tenant_name }}</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p class="text-xs text-gray-500 mb-0.5">Tarif</p>
              <p class="font-semibold text-sm text-gray-900 dark:text-white">{{ selectedPayment?.plan_name }}</p>
            </div>
            <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <p class="text-xs text-gray-500 mb-0.5">To'lov miqdori</p>
              <p class="font-bold text-lg text-green-600">{{ formatMoney(selectedPayment?.amount ?? 0) }}</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p class="text-xs text-gray-500 mb-0.5">Usul / Sana</p>
              <p class="font-semibold text-sm text-gray-900 dark:text-white">{{ methodLabel(selectedPayment?.payment_method ?? '') }}</p>
              <p class="text-xs text-gray-400">{{ selectedPayment?.payment_date }}</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p class="text-xs text-gray-500 mb-0.5">To'lovchi</p>
              <p class="font-semibold text-sm text-gray-900 dark:text-white">{{ selectedPayment?.owner_name ?? '—' }}</p>
              <p class="text-xs text-gray-400">{{ selectedPayment?.owner_email ?? '' }}</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p class="text-xs text-gray-500 mb-0.5">Status</p>
              <UBadge :color="statusColor(selectedPayment?.status ?? '')" variant="subtle" size="sm">
                {{ statusLabel(selectedPayment?.status ?? '') }}
              </UBadge>
              <p v-if="selectedPayment?.confirmed_by" class="text-xs text-gray-400 mt-1">
                {{ selectedPayment.confirmed_by }}
              </p>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="selectedPayment?.notes" class="bg-yellow-50 dark:bg-yellow-900/10 rounded-lg p-3">
            <p class="text-xs text-gray-500 mb-1">Izoh</p>
            <p class="text-sm text-gray-700 dark:text-gray-300">{{ selectedPayment.notes }}</p>
          </div>

          <!-- Rejection Reason -->
          <div v-if="selectedPayment?.rejection_reason" class="bg-red-50 dark:bg-red-900/10 rounded-lg p-3">
            <p class="text-xs text-red-500 mb-1 flex items-center gap-1">
              <UIcon name="i-lucide-alert-circle" class="w-3 h-3" /> Rad etish sababi
            </p>
            <p class="text-sm text-red-700 dark:text-red-300">{{ selectedPayment.rejection_reason }}</p>
          </div>

          <!-- Receipt File -->
          <div v-if="selectedPayment?.receipt_url">
            <p class="text-xs text-gray-500 mb-2">Kvitansiya fayli</p>
            <img
              v-if="isImage(selectedPayment?.receipt_mime ?? null)"
              :src="selectedPayment.receipt_url"
              class="max-w-full rounded-lg border border-gray-100 dark:border-gray-700"
              alt="Kvitansiya"
            >
            <div v-else class="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <UIcon name="i-lucide-file-text" class="text-3xl text-gray-400 shrink-0" />
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  {{ selectedPayment.receipt_original_name ?? 'fayl.pdf' }}
                </p>
                <a :href="selectedPayment.receipt_url" target="_blank" class="text-xs text-primary-500 hover:underline">
                  PDF ochish
                </a>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-6 text-gray-400">
            <UIcon name="i-lucide-paperclip" class="text-3xl mb-2" />
            <p class="text-sm">Kvitansiya fayli yuklanmagan</p>
          </div>
        </div>
      </UCard>
    </template>
  </UModal>
</template>
