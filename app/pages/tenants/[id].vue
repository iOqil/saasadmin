<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth'] })

const route = useRoute()
const tenantStore = useTenantStore()
const toast = useToast()

const id = route.params.id as string

onMounted(() => tenantStore.fetchTenant(id))

const tenant = computed(() => tenantStore.current)

type BadgeColor = 'error' | 'success' | 'warning' | 'neutral' | 'primary' | 'info'
function statusColor(status: string): BadgeColor {
  const m: Record<string, BadgeColor> = { active: 'success', trial: 'warning', suspended: 'error', expired: 'neutral' }
  return m[status] ?? 'neutral'
}
function statusLabel(status: string) {
  const m: Record<string, string> = { active: 'Faol', trial: 'Sinov', suspended: "To'xtatilgan", expired: 'Muddati tugagan' }
  return m[status] ?? status
}

async function toggleStatus() {
  if (!tenant.value) return
  try {
    if (tenant.value.status === 'active') {
      await tenantStore.suspendTenant(tenant.value.id)
      toast.add({ title: "Markaz to'xtatildi", color: 'warning' })
    } else {
      await tenantStore.activateTenant(tenant.value.id)
      toast.add({ title: 'Markaz faollashtirildi', color: 'success' })
    }
  } catch (e: any) {
    toast.add({ title: e?.data?.message ?? 'Xatolik', color: 'error' })
  }
}

// Suspension URL form
const urlForm = reactive({
  contact_url: '',
  main_site_url: ''
})
const urlSaving = ref(false)

watch(tenant, (t) => {
  if (t) {
    urlForm.contact_url = t.contact_url ?? ''
    urlForm.main_site_url = t.main_site_url ?? ''
  }
}, { immediate: true })

async function saveUrls() {
  if (!tenant.value) return
  urlSaving.value = true
  try {
    await tenantStore.updateTenant(tenant.value.id, {
      contact_url: urlForm.contact_url || null,
      main_site_url: urlForm.main_site_url || null
    })
    toast.add({ title: 'URL-lar saqlandi', color: 'success' })
  } catch (e: any) {
    toast.add({ title: e?.data?.message ?? 'Xatolik', color: 'error' })
  } finally {
    urlSaving.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="tenant-detail">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UButton
            to="/tenants"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            size="sm"
          >
            Orqaga
          </UButton>
        </template>
        <template #title>
          {{ tenant?.name ?? 'Markaz tafsiloti' }}
        </template>
        <template #right>
          <UButton
            v-if="tenant"
            :icon="tenant.status === 'active' ? 'i-lucide-pause' : 'i-lucide-play'"
            :color="tenant.status === 'active' ? 'warning' : 'success'"
            variant="soft"
            @click="toggleStatus"
          >
            {{ tenant.status === 'active' ? "To'xtatish" : 'Faollashtirish' }}
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <div v-if="tenantStore.loading" class="flex justify-center py-20">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-3xl text-primary-500" />
        </div>
        <div v-else-if="!tenant" class="text-center py-20 text-gray-400">
          Markaz topilmadi
        </div>
        <div v-else class="space-y-6">
          <!-- Header card -->
          <UCard>
            <div class="flex flex-col sm:flex-row sm:items-center gap-4">
              <UAvatar :alt="tenant.name" size="xl" />
              <div class="flex-1">
                <div class="flex items-center gap-3 flex-wrap">
                  <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ tenant.name }}</h1>
                  <UBadge :color="statusColor(tenant.status)" variant="subtle">
                    {{ statusLabel(tenant.status) }}
                  </UBadge>
                  <UBadge color="primary" variant="soft">{{ tenant.plan?.name ?? '—' }}</UBadge>
                </div>
                <p class="text-gray-400 mt-1">{{ tenant.primary_domain }}</p>
              </div>
              <div class="flex gap-2">
                <UButton
                  :to="`https://${tenant.primary_domain}`"
                  target="_blank"
                  icon="i-lucide-external-link"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                >
                  Saytga o'tish
                </UButton>
              </div>
            </div>
          </UCard>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Stats -->
            <div class="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <UCard
                v-for="stat in [
                  { label: 'O\'quvchilar', value: tenant.students_count, icon: 'i-lucide-graduation-cap', color: 'text-blue-600' },
                  { label: 'O\'qituvchilar', value: tenant.teachers_count, icon: 'i-lucide-users', color: 'text-purple-600' },
                  { label: 'Sinov tugashi', value: tenant.trial_ends_at?.slice(0, 10) ?? 'Cheksiz', icon: 'i-lucide-calendar', color: 'text-orange-600' }
                ]"
                :key="stat.label"
              >
                <div class="text-center">
                  <UIcon :name="stat.icon" :class="['w-6 h-6 mx-auto mb-1', stat.color]" />
                  <p class="text-lg font-bold">{{ stat.value }}</p>
                  <p class="text-xs text-gray-400">{{ stat.label }}</p>
                </div>
              </UCard>
            </div>

            <!-- Owner info -->
            <UCard>
              <template #header>
                <h3 class="font-semibold text-sm">Egasi ma'lumotlari</h3>
              </template>
              <div class="space-y-3 text-sm">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-user" class="w-4 h-4 text-gray-400" />
                  <span>{{ tenant.owner_name }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-mail" class="w-4 h-4 text-gray-400" />
                  <a :href="`mailto:${tenant.owner_email}`" class="text-primary-500 hover:underline">
                    {{ tenant.owner_email }}
                  </a>
                </div>
                <div v-if="tenant.owner_phone" class="flex items-center gap-2">
                  <UIcon name="i-lucide-phone" class="w-4 h-4 text-gray-400" />
                  <a :href="`tel:${tenant.owner_phone}`" class="text-primary-500 hover:underline">
                    {{ tenant.owner_phone }}
                  </a>
                </div>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-calendar-plus" class="w-4 h-4 text-gray-400" />
                  <span class="text-gray-500">{{ tenant.created_at?.slice(0, 10) }}</span>
                </div>
              </div>
            </UCard>
          </div>

          <!-- Suspension URLs -->
          <UCard>
            <template #header>
              <h3 class="font-semibold text-sm">To'xtatilganda ko'rsatiladigan havolalar</h3>
            </template>
            <div class="space-y-4">
              <UFormField label="Bog'lanish URL (Contact)">
                <UInput
                  v-model="urlForm.contact_url"
                  placeholder="https://t.me/yourcompany"
                  icon="i-lucide-phone"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Asosiy sayt URL">
                <UInput
                  v-model="urlForm.main_site_url"
                  placeholder="https://epro.uz"
                  icon="i-lucide-globe"
                  class="w-full"
                />
              </UFormField>
              <UButton
                :loading="urlSaving"
                icon="i-lucide-save"
                size="sm"
                @click="saveUrls"
              >
                Saqlash
              </UButton>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
