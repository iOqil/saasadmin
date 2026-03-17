<script setup lang="ts">
import type { Tenant } from '~/stores/tenant'

definePageMeta({ layout: 'dashboard', middleware: ['auth'] })

const tenantStore = useTenantStore()
const toast = useToast()

const page = ref(1)
const search = ref('')
const statusFilter = ref('all')
const createModalOpen = ref(false)
const editModalOpen = ref(false)
const deleteModalOpen = ref(false)
const selectedTenant = ref<Tenant | null>(null)
const saving = ref(false)

const planStore = usePlanStore()

const form = reactive({
  name: '',
  subdomain: '',
  custom_domain: '',
  admin_name: '',
  admin_email: '',
  admin_password: '',
  owner_phone: '',
  plan_id: null as number | null,
})

async function load() {
  const params: Record<string, string> = {}
  if (search.value) params.search = search.value
  if (statusFilter.value && statusFilter.value !== 'all') params.status = statusFilter.value
  await tenantStore.fetchTenants(params, page.value)
}

onMounted(() => {
  load()
  planStore.fetchPlans()
})
watch([page, search, statusFilter], load)

function openCreate() {
  Object.assign(form, { name: '', subdomain: '', custom_domain: '', admin_name: '', admin_email: '', admin_password: '', owner_phone: '', plan_id: planStore.plans[0]?.id ?? null })
  createModalOpen.value = true
}

function openEdit(tenant: Tenant) {
  selectedTenant.value = tenant
  Object.assign(form, {
    name: tenant.name,
    subdomain: tenant.subdomain,
    custom_domain: tenant.primary_domain ?? '',
    admin_name: tenant.owner_name,
    admin_email: tenant.owner_email,
    admin_password: '',
    owner_phone: tenant.owner_phone ?? '',
    plan_id: null,
  })
  editModalOpen.value = true
}

function openDelete(tenant: Tenant) {
  selectedTenant.value = tenant
  deleteModalOpen.value = true
}

async function submitCreate() {
  saving.value = true
  try {
    await tenantStore.createTenant({ ...form })
    toast.add({ title: 'Markaz yaratildi', color: 'success' })
    createModalOpen.value = false
    await load()
  }
  catch (e: any) {
    const errors = e?.data?.errors
    const firstError = errors ? Object.values(errors as Record<string, string[]>).flat()[0] : null
    toast.add({ title: firstError ?? e?.data?.message ?? 'Xatolik', color: 'error' })
  }
  finally { saving.value = false }
}

async function submitEdit() {
  if (!selectedTenant.value) return
  saving.value = true
  try {
    const payload: Record<string, any> = {
      name: form.name,
      owner_name: form.admin_name,
      owner_email: form.admin_email,
      owner_phone: form.owner_phone,
    }
    if (form.plan_id !== null) payload.plan_id = form.plan_id
    await tenantStore.updateTenant(selectedTenant.value.id, payload)
    toast.add({ title: 'Markaz yangilandi', color: 'success' })
    editModalOpen.value = false
    await load()
  }
  catch (e: any) {
    const errors = e?.data?.errors
    const firstError = errors ? Object.values(errors as Record<string, string[]>).flat()[0] : null
    toast.add({ title: firstError ?? e?.data?.message ?? 'Xatolik', color: 'error' })
  }
  finally { saving.value = false }
}

async function confirmDelete() {
  if (!selectedTenant.value) return
  saving.value = true
  try {
    await tenantStore.deleteTenant(selectedTenant.value.id)
    toast.add({ title: "Markaz o'chirildi", color: 'success' })
    deleteModalOpen.value = false
  }
  catch (e: any) {
    toast.add({ title: e?.data?.message ?? 'Xatolik', color: 'error' })
  }
  finally { saving.value = false }
}

async function toggleStatus(tenant: Tenant) {
  try {
    if (tenant.status === 'active') {
      await tenantStore.suspendTenant(tenant.id)
      toast.add({ title: "Markaz to'xtatildi", color: 'warning' })
    }
    else {
      await tenantStore.activateTenant(tenant.id)
      toast.add({ title: 'Markaz faollashtirildi', color: 'success' })
    }
  }
  catch (e: any) {
    toast.add({ title: e?.data?.message ?? 'Xatolik', color: 'error' })
  }
}

type BadgeColor = 'error' | 'success' | 'warning' | 'neutral' | 'primary' | 'info'
function statusColor(status: string): BadgeColor {
  const m: Record<string, BadgeColor> = { active: 'success', trial: 'warning', suspended: 'error', expired: 'neutral' }
  return m[status] ?? 'neutral'
}
function statusLabel(status: string) {
  const m: Record<string, string> = { active: 'Faol', trial: 'Sinov', suspended: "To'xtatilgan", expired: 'Muddati tugagan' }
  return m[status] ?? status
}

const statusOptions = [
  { label: 'Barchasi', value: 'all' },
  { label: 'Faol', value: 'active' },
  { label: 'Sinov', value: 'trial' },
  { label: "To'xtatilgan", value: 'suspended' },
  { label: 'Muddati tugagan', value: 'expired' },
]

const planOptions = computed(() =>
  planStore.plans.map(p => ({ label: p.name, value: p.id }))
)
</script>

<template>
  <UDashboardPanel id="tenants">
    <template #header>
      <UDashboardNavbar title="O'quv Markazlar" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton icon="i-lucide-plus" @click="openCreate">
            Yangi Markaz
          </UButton>
        </template>
      </UDashboardNavbar>
      <UDashboardToolbar>
        <template #left>
          <UInput v-model="search" placeholder="Qidirish..." icon="i-lucide-search" class="w-48 lg:w-72" />
          <USelect v-model="statusFilter" :items="statusOptions" value-key="value" label-key="label" class="w-40" />
        </template>
        <template #right>
          <UButton icon="i-lucide-refresh-cw" color="neutral" variant="ghost" :loading="tenantStore.loading" @click="load" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="p-6">
        <div v-if="tenantStore.loading && !tenantStore.tenants.length" class="flex justify-center py-20">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-3xl text-primary-500" />
        </div>
        <div v-else-if="!tenantStore.tenants.length" class="text-center py-20">
          <UIcon name="i-lucide-building-2" class="text-5xl text-gray-300 mb-3" />
          <p class="text-gray-500">Hech qanday markaz topilmadi</p>
          <UButton class="mt-4" @click="openCreate">Yangi markaz qo'shish</UButton>
        </div>
        <div v-else class="space-y-4">
          <!-- Desktop table -->
          <div class="hidden md:block">
            <UCard :ui="{ body: 'p-0' }">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-700 text-gray-500 text-left">
                    <th class="px-4 py-3 font-medium">Markaz</th>
                    <th class="px-4 py-3 font-medium">Egasi</th>
                    <th class="px-4 py-3 font-medium">Tarif</th>
                    <th class="px-4 py-3 font-medium text-center">O'quvchi / O'qituvchi</th>
                    <th class="px-4 py-3 font-medium">Holat</th>
                    <th class="px-4 py-3 font-medium">Qo'shilgan</th>
                    <th class="px-4 py-3 font-medium text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                  <tr
                    v-for="tenant in tenantStore.tenants"
                    :key="tenant.id"
                    class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        <UAvatar :alt="tenant.name" size="sm" />
                        <div>
                          <p class="font-medium text-gray-900 dark:text-white">{{ tenant.name }}</p>
                          <p class="text-xs text-gray-400">{{ tenant.primary_domain }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <p class="text-sm">{{ tenant.owner_name }}</p>
                      <p class="text-xs text-gray-400">{{ tenant.owner_email }}</p>
                    </td>
                    <td class="px-4 py-3">
                      <UBadge color="primary" variant="soft" size="sm">{{ tenant.plan?.name ?? '—' }}</UBadge>
                    </td>
                    <td class="px-4 py-3 text-center text-sm">
                      {{ tenant.students_count }} / {{ tenant.teachers_count }}
                    </td>
                    <td class="px-4 py-3">
                      <UBadge :color="statusColor(tenant.status)" variant="subtle" size="sm">
                        {{ statusLabel(tenant.status) }}
                      </UBadge>
                    </td>
                    <td class="px-4 py-3 text-xs text-gray-400">{{ tenant.created_at?.slice(0, 10) }}</td>
                    <td class="px-4 py-3">
                      <div class="flex items-center justify-end gap-1">
                        <UTooltip :text="tenant.status === 'active' ? 'Muzlatish' : 'Faollashtirish'">
                          <UButton
                            :icon="tenant.status === 'active' ? 'i-lucide-pause' : 'i-lucide-play'"
                            :color="tenant.status === 'active' ? 'warning' : 'success'"
                            variant="ghost"
                            size="xs"
                            @click="toggleStatus(tenant)"
                          />
                        </UTooltip>
                        <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="xs" @click="openEdit(tenant)" />
                        <UButton :to="`/tenants/${tenant.id}`" icon="i-lucide-eye" color="neutral" variant="ghost" size="xs" />
                        <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" @click="openDelete(tenant)" />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </UCard>
          </div>

          <!-- Mobile cards -->
          <div class="md:hidden space-y-3">
            <UCard v-for="tenant in tenantStore.tenants" :key="tenant.id">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2">
                  <UAvatar :alt="tenant.name" size="md" />
                  <div>
                    <p class="font-semibold">{{ tenant.name }}</p>
                    <p class="text-xs text-gray-400">{{ tenant.primary_domain }}</p>
                  </div>
                </div>
                <UBadge :color="statusColor(tenant.status)" variant="subtle" size="sm">
                  {{ statusLabel(tenant.status) }}
                </UBadge>
              </div>
              <div class="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                  <p class="text-lg font-bold">{{ tenant.students_count }}</p>
                  <p class="text-gray-400">O'quvchi</p>
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                  <p class="text-lg font-bold">{{ tenant.teachers_count }}</p>
                  <p class="text-gray-400">O'qituvchi</p>
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                  <UBadge color="primary" variant="soft" size="xs">{{ tenant.plan?.name ?? '—' }}</UBadge>
                  <p class="text-gray-400 mt-1">Tarif</p>
                </div>
              </div>
              <div class="mt-3 flex items-center justify-between">
                <p class="text-xs text-gray-400">{{ tenant.owner_name }}</p>
                <div class="flex gap-1">
                  <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="xs" @click="openEdit(tenant)" />
                  <UButton :to="`/tenants/${tenant.id}`" icon="i-lucide-eye" color="neutral" variant="ghost" size="xs" />
                  <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" @click="openDelete(tenant)" />
                </div>
              </div>
            </UCard>
          </div>

          <div v-if="tenantStore.pagination && tenantStore.pagination.last_page > 1" class="flex justify-center pt-2">
            <UPagination
              v-model:page="page"
              :total="tenantStore.pagination.total"
              :items-per-page="tenantStore.pagination.per_page"
            />
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Create Modal -->
  <UModal v-model:open="createModalOpen">
    <template #content>
      <UCard>
        <template #header>
          <h3 class="font-semibold text-lg">Yangi O'quv Markaz</h3>
        </template>
        <form @submit.prevent="submitCreate" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Markaz nomi" required class="sm:col-span-2">
              <UInput v-model="form.name" placeholder="Muborak IELTS" required class="w-full" />
            </UFormField>
            <UFormField label="Subdomain" required>
              <UInput v-model="form.subdomain" placeholder="muborak-ielts" required class="w-full" />
              <template #hint><span class="text-xs text-gray-400">muborak-ielts.epro.uz</span></template>
            </UFormField>
            <UFormField label="Custom domain">
              <UInput v-model="form.custom_domain" placeholder="muborak.uz" class="w-full" />
            </UFormField>
            <UFormField label="Admin ismi" required>
              <UInput v-model="form.admin_name" placeholder="Sardor Aliyev" required class="w-full" />
            </UFormField>
            <UFormField label="Admin email" required>
              <UInput v-model="form.admin_email" type="email" placeholder="sardor@mail.com" required class="w-full" />
            </UFormField>
            <UFormField label="Admin paroli" required>
              <UInput v-model="form.admin_password" type="password" placeholder="min 8 belgi" required minlength="8" class="w-full" />
            </UFormField>
            <UFormField label="Telefon">
              <UInput v-model="form.owner_phone" placeholder="+998901234567" class="w-full" />
            </UFormField>
            <UFormField label="Tarif" required>
              <USelect v-model="form.plan_id" :items="planOptions" value-key="value" label-key="label" class="w-full" />
            </UFormField>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <UButton color="neutral" variant="ghost" @click="createModalOpen = false">Bekor</UButton>
            <UButton type="submit" :loading="saving">Yaratish</UButton>
          </div>
        </form>
      </UCard>
    </template>
  </UModal>

  <!-- Edit Modal -->
  <UModal v-model:open="editModalOpen">
    <template #content>
      <UCard>
        <template #header>
          <h3 class="font-semibold text-lg">Markazni tahrirlash</h3>
          <p class="text-sm text-gray-500 mt-1">{{ selectedTenant?.name }}</p>
        </template>
        <form @submit.prevent="submitEdit" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Markaz nomi" required class="sm:col-span-2">
              <UInput v-model="form.name" required class="w-full" />
            </UFormField>
            <UFormField label="Custom domain">
              <UInput v-model="form.custom_domain" class="w-full" />
            </UFormField>
            <UFormField label="Tarif">
              <USelect v-model="form.plan_id" :items="planOptions" value-key="value" label-key="label" class="w-full" />
            </UFormField>
            <UFormField label="Admin ismi">
              <UInput v-model="form.admin_name" class="w-full" />
            </UFormField>
            <UFormField label="Admin email">
              <UInput v-model="form.admin_email" type="email" class="w-full" />
            </UFormField>
            <UFormField label="Telefon">
              <UInput v-model="form.owner_phone" class="w-full" />
            </UFormField>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <UButton color="neutral" variant="ghost" @click="editModalOpen = false">Bekor</UButton>
            <UButton type="submit" :loading="saving">Saqlash</UButton>
          </div>
        </form>
      </UCard>
    </template>
  </UModal>

  <!-- Delete Confirm -->
  <UModal v-model:open="deleteModalOpen">
    <template #content>
      <UCard>
        <template #header>
          <h3 class="font-semibold text-lg text-red-600">Markazni o'chirish</h3>
        </template>
        <div class="space-y-3">
          <p class="text-sm text-gray-600 dark:text-gray-300">
            <strong>{{ selectedTenant?.name }}</strong> markazini o'chirmoqchimisiz?
          </p>
          <div class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-600">
            Bu amal qaytarib bo'lmaydi! Markazning barcha ma'lumotlari o'chib ketadi.
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="ghost" @click="deleteModalOpen = false">Bekor</UButton>
            <UButton color="error" :loading="saving" @click="confirmDelete">O'chirish</UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
