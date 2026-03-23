<script setup lang="ts">
import type { TenantRegistration } from '~/stores/registration'

definePageMeta({ layout: 'dashboard', middleware: ['auth'] })

const registrationStore = useRegistrationStore()
const planStore = usePlanStore()
const toast = useToast()

const statusFilter = ref('pending')
const page = ref(1)
const approveModalOpen = ref(false)
const rejectModalOpen = ref(false)
const selectedReg = ref<TenantRegistration | null>(null)
const selectedPlanId = ref<number | null>(null)
const rejectReason = ref('')
const saving = ref(false)

async function load() {
  await registrationStore.fetchRegistrations(statusFilter.value, page.value)
}

onMounted(() => {
  load()
  planStore.fetchPlans()
})
watch([statusFilter, page], load)

function openApprove(reg: TenantRegistration) {
  selectedReg.value = reg
  selectedPlanId.value = planStore.plans[0]?.id ?? null
  approveModalOpen.value = true
}

function openReject(reg: TenantRegistration) {
  selectedReg.value = reg
  rejectReason.value = ''
  rejectModalOpen.value = true
}

async function submitApprove() {
  if (!selectedReg.value || !selectedPlanId.value) return
  saving.value = true
  try {
    await registrationStore.approve(selectedReg.value.id, selectedPlanId.value)
    toast.add({ title: 'Ariza tasdiqlandi, markaz yaratildi', color: 'success' })
    approveModalOpen.value = false
  } catch (e: any) {
    const msg = e?.data?.message ?? 'Xatolik yuz berdi'
    toast.add({ title: msg, color: 'error' })
  } finally {
    saving.value = false
  }
}

async function submitReject() {
  if (!selectedReg.value) return
  saving.value = true
  try {
    await registrationStore.reject(selectedReg.value.id, rejectReason.value || undefined)
    toast.add({ title: 'Ariza rad etildi', color: 'warning' })
    rejectModalOpen.value = false
  } catch (e: any) {
    toast.add({ title: e?.data?.message ?? 'Xatolik', color: 'error' })
  } finally {
    saving.value = false
  }
}

const statusOptions = [
  { label: 'Kutayotgan', value: 'pending' },
  { label: 'Tasdiqlangan', value: 'approved' },
  { label: 'Rad etilgan', value: 'rejected' },
]

const planOptions = computed(() => planStore.plans.map(p => ({ label: p.name, value: p.id })))

type BadgeColor = 'warning' | 'success' | 'error' | 'neutral'
function statusColor(s: string): BadgeColor {
  const m: Record<string, BadgeColor> = { pending: 'warning', approved: 'success', rejected: 'error' }
  return m[s] ?? 'neutral'
}
function statusLabel(s: string) {
  const m: Record<string, string> = { pending: 'Kutmoqda', approved: 'Tasdiqlangan', rejected: 'Rad etilgan' }
  return m[s] ?? s
}
</script>

<template>
  <UDashboardPanel id="registrations">
    <template #header>
      <UDashboardNavbar title="Ariza va So'rovlar" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
      <UDashboardToolbar>
        <template #left>
          <USelect
            v-model="statusFilter"
            :items="statusOptions"
            value-key="value"
            label-key="label"
            class="w-44"
          />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            :loading="registrationStore.loading"
            @click="load"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="p-6">
        <div v-if="registrationStore.loading && !registrationStore.registrations.length" class="flex justify-center py-20">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-3xl text-primary-500" />
        </div>
        <div v-else-if="!registrationStore.registrations.length" class="text-center py-20">
          <UIcon name="i-lucide-inbox" class="text-5xl text-gray-300 mb-3" />
          <p class="text-gray-500">Hech qanday ariza topilmadi</p>
        </div>
        <div v-else>
          <UCard :ui="{ body: 'p-0' }">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700 text-gray-500 text-left">
                  <th class="px-4 py-3 font-medium">Markaz / Subdomain</th>
                  <th class="px-4 py-3 font-medium">Egasi</th>
                  <th class="px-4 py-3 font-medium">Holat</th>
                  <th class="px-4 py-3 font-medium">Sana</th>
                  <th class="px-4 py-3 font-medium text-right">Amallar</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                <tr
                  v-for="reg in registrationStore.registrations"
                  :key="reg.id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td class="px-4 py-3">
                    <p class="font-medium">{{ reg.name }}</p>
                    <p class="text-xs text-gray-400">{{ reg.subdomain }}.epro.uz</p>
                  </td>
                  <td class="px-4 py-3">
                    <p>{{ reg.owner_name }}</p>
                    <p class="text-xs text-gray-400">{{ reg.owner_email }}</p>
                    <p v-if="reg.owner_phone" class="text-xs text-gray-400">{{ reg.owner_phone }}</p>
                  </td>
                  <td class="px-4 py-3">
                    <div>
                      <UBadge :color="statusColor(reg.status)" variant="subtle" size="sm">
                        {{ statusLabel(reg.status) }}
                      </UBadge>
                      <p v-if="reg.rejection_reason" class="text-xs text-gray-400 mt-1">
                        {{ reg.rejection_reason }}
                      </p>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-xs text-gray-400">{{ reg.created_at?.slice(0, 10) }}</td>
                  <td class="px-4 py-3">
                    <div v-if="reg.status === 'pending'" class="flex items-center justify-end gap-2">
                      <UButton
                        icon="i-lucide-check"
                        color="success"
                        variant="soft"
                        size="xs"
                        @click="openApprove(reg)"
                      >
                        Tasdiqlash
                      </UButton>
                      <UButton
                        icon="i-lucide-x"
                        color="error"
                        variant="soft"
                        size="xs"
                        @click="openReject(reg)"
                      >
                        Rad etish
                      </UButton>
                    </div>
                    <div v-else class="text-right">
                      <span v-if="reg.tenant_id" class="text-xs text-gray-400">
                        Tenant: {{ reg.tenant_id.slice(0, 8) }}...
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </UCard>

          <div v-if="registrationStore.pagination && registrationStore.pagination.last_page > 1" class="flex justify-center pt-4">
            <UPagination
              v-model:page="page"
              :total="registrationStore.pagination.total"
              :items-per-page="registrationStore.pagination.per_page"
            />
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Approve Modal -->
  <UModal v-model:open="approveModalOpen">
    <template #content>
      <UCard>
        <template #header>
          <h3 class="font-semibold text-lg">Arizani Tasdiqlash</h3>
          <p class="text-sm text-gray-500 mt-1">{{ selectedReg?.name }} — {{ selectedReg?.subdomain }}.epro.uz</p>
        </template>
        <div class="space-y-4">
          <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
            Ariza tasdiqlanса, tenant DB yaratiladi va markaz admin panelga kirish imkoniga ega bo'ladi.
          </div>
          <UFormField label="Tarif (Plan)" required>
            <USelect
              v-model="selectedPlanId"
              :items="planOptions"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>
        </div>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="ghost" @click="approveModalOpen = false">Bekor</UButton>
            <UButton color="success" :loading="saving" @click="submitApprove">Tasdiqlash</UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>

  <!-- Reject Modal -->
  <UModal v-model:open="rejectModalOpen">
    <template #content>
      <UCard>
        <template #header>
          <h3 class="font-semibold text-lg text-red-600">Arizani Rad Etish</h3>
          <p class="text-sm text-gray-500 mt-1">{{ selectedReg?.name }}</p>
        </template>
        <div class="space-y-4">
          <UFormField label="Rad etish sababi (ixtiyoriy)">
            <UTextarea
              v-model="rejectReason"
              placeholder="Masalan: Subdomain noto'g'ri formatda yoki markaz ma'lumotlari to'liq emas"
              :rows="3"
              class="w-full"
            />
          </UFormField>
        </div>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="ghost" @click="rejectModalOpen = false">Bekor</UButton>
            <UButton color="error" :loading="saving" @click="submitReject">Rad Etish</UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
