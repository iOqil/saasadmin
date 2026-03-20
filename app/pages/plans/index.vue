<script setup lang="ts">
import type { Plan } from '~/stores/plan'

definePageMeta({ layout: 'dashboard', middleware: ['auth'] })

const planStore = usePlanStore()
const toast = useToast()

const createModalOpen = ref(false)
const editModalOpen = ref(false)
const deleteModalOpen = ref(false)
const selectedPlan = ref<Plan | null>(null)
const saving = ref(false)

const defaultFeatures = () => ({
  max_students: 100,
  max_teachers: 10,
  max_groups: 10,
  lms_enabled: false,
  chat_enabled: false,
  storage_limit: '2GB',
})

const form = reactive({
  name: '',
  price: 0,
  is_active: true,
  features: defaultFeatures(),
})

const storageLimitOptions = [
  { label: '1 GB', value: '1GB' },
  { label: '2 GB', value: '2GB' },
  { label: '5 GB', value: '5GB' },
  { label: '10 GB', value: '10GB' },
  { label: '20 GB', value: '20GB' },
  { label: '50 GB', value: '50GB' },
]

onMounted(() => planStore.fetchPlans())

function openCreate() {
  Object.assign(form, { name: '', price: 0, is_active: true, features: defaultFeatures() })
  createModalOpen.value = true
}

function openEdit(plan: Plan) {
  selectedPlan.value = plan
  Object.assign(form, {
    name: plan.name,
    price: Number(plan.price),
    is_active: plan.is_active,
    features: { ...defaultFeatures(), ...plan.features },
  })
  editModalOpen.value = true
}

function openDelete(plan: Plan) {
  selectedPlan.value = plan
  deleteModalOpen.value = true
}

async function submitCreate() {
  saving.value = true
  try {
    await planStore.createPlan({ ...form })
    toast.add({ title: 'Tarif yaratildi', color: 'success' })
    createModalOpen.value = false
  } catch (e: any) {
    const errors = e?.data?.errors
    const firstError = errors ? Object.values(errors as Record<string, string[]>).flat()[0] : null
    toast.add({ title: firstError ?? e?.data?.message ?? 'Xatolik', color: 'error' })
  } finally { saving.value = false }
}

async function submitEdit() {
  if (!selectedPlan.value) return
  saving.value = true
  try {
    await planStore.updatePlan(selectedPlan.value.id, { ...form })
    toast.add({ title: 'Tarif yangilandi', color: 'success' })
    editModalOpen.value = false
  } catch (e: any) {
    const errors = e?.data?.errors
    const firstError = errors ? Object.values(errors as Record<string, string[]>).flat()[0] : null
    toast.add({ title: firstError ?? e?.data?.message ?? 'Xatolik', color: 'error' })
  } finally { saving.value = false }
}

async function confirmDelete() {
  if (!selectedPlan.value) return
  saving.value = true
  try {
    await planStore.deletePlan(selectedPlan.value.id)
    toast.add({ title: "Tarif o'chirildi", color: 'success' })
    deleteModalOpen.value = false
  } catch (e: any) {
    toast.add({ title: e?.data?.message ?? 'Xatolik', color: 'error' })
  } finally { saving.value = false }
}

function formatMoney(n: number | string) {
  return new Intl.NumberFormat('uz-UZ').format(Number(n)) + " so'm"
}

function formatLimit(n: number | undefined | null) {
  if (n === undefined || n === null) return '—'
  return n === -1 ? 'Cheksiz' : String(n)
}
</script>

<template>
  <UDashboardPanel id="plans">
    <template #header>
      <UDashboardNavbar title="Tarif Rejalari" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton icon="i-lucide-plus" @click="openCreate">
            Yangi Tarif
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <div v-if="planStore.loading" class="flex justify-center py-20">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-3xl text-primary-500" />
        </div>
        <div v-else-if="!planStore.plans.length" class="text-center py-20">
          <UIcon name="i-lucide-badge-dollar-sign" class="text-5xl text-gray-300 mb-3" />
          <p class="text-gray-500">Hech qanday tarif topilmadi</p>
          <UButton class="mt-4" @click="openCreate">Yangi tarif qo'shish</UButton>
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <UCard
            v-for="plan in planStore.plans"
            :key="plan.id"
            :class="['relative', !plan.is_active && 'opacity-60']"
          >
            <div v-if="!plan.is_active" class="absolute top-3 right-3">
              <UBadge color="neutral" variant="subtle" size="xs">Nofaol</UBadge>
            </div>

            <!-- Header -->
            <div class="text-center mb-4">
              <div class="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <UIcon name="i-lucide-badge-dollar-sign" class="w-6 h-6 text-primary-600" />
              </div>
              <h3 class="font-bold text-lg text-gray-900 dark:text-white">{{ plan.name }}</h3>
            </div>

            <!-- Price -->
            <div class="text-center mb-4">
              <p class="text-2xl font-bold text-primary-600">{{ formatMoney(plan.price) }}</p>
              <p class="text-xs text-gray-400">oyiga</p>
            </div>

            <!-- Features -->
            <div class="space-y-1.5 mb-4">
              <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <UIcon name="i-lucide-graduation-cap" class="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span>{{ formatLimit(plan.features?.max_students) == "Cheksiz" ? "" : "Max" }} {{ formatLimit(plan.features?.max_students) }} o'quvchi</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <UIcon name="i-lucide-users" class="w-4 h-4 text-purple-500 flex-shrink-0" />
                <span>{{ formatLimit(plan.features?.max_teachers) == "Cheksiz" ? "" : "Max" }} {{ formatLimit(plan.features?.max_teachers) }} o'qituvchi</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <UIcon name="i-lucide-layout-grid" class="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span>{{ formatLimit(plan.features?.max_groups) == "Cheksiz" ? "" : "Max" }} {{ formatLimit(plan.features?.max_groups) }} guruh</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <UIcon name="i-lucide-hard-drive" class="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{{ plan.features?.storage_limit ?? '—' }} xotira</span>
              </div>
              <div v-if="plan.features?.lms_enabled" class="flex items-center gap-2 text-sm text-green-600">
                <UIcon name="i-lucide-check" class="w-4 h-4 flex-shrink-0" />
                <span>LMS moduli</span>
              </div>
              <div v-if="plan.features?.chat_enabled" class="flex items-center gap-2 text-sm text-green-600">
                <UIcon name="i-lucide-check" class="w-4 h-4 flex-shrink-0" />
                <span>Chat moduli</span>
              </div>
            </div>

            <!-- Footer -->
            <div class="pt-3 border-t border-gray-100 dark:border-gray-800">
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-400">{{ plan.tenants_count ?? 0 }} ta markaz</span>
                <div class="flex gap-1">
                  <UButton
                    icon="i-lucide-pencil"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    @click="openEdit(plan)"
                  />
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="xs"
                    @click="openDelete(plan)"
                  />
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Create Modal -->
  <UModal v-model:open="createModalOpen">
    <template #content>
      <UCard>
        <template #header>
          <h3 class="font-semibold text-lg">Yangi Tarif Rejasi</h3>
        </template>
        <form class="space-y-4" @submit.prevent="submitCreate">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Nomi" required class="sm:col-span-2">
              <UInput
                v-model="form.name"
                placeholder="Basic, Pro, Premium..."
                required
                class="w-full"
              />
            </UFormField>
            <UFormField label="Narxi (so'm/oy)" required class="sm:col-span-2">
              <UInput
                v-model.number="form.price"
                type="number"
                min="0"
                required
                class="w-full"
              />
            </UFormField>

            <div class="sm:col-span-2">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Limitlar</p>
              <div class="grid grid-cols-3 gap-3">
                <UFormField label="O'quvchilar" required>
                  <UInput
                    v-model.number="form.features.max_students"
                    type="number"
                    min="-1"
                    required
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="O'qituvchilar" required>
                  <UInput
                    v-model.number="form.features.max_teachers"
                    type="number"
                    min="-1"
                    required
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Guruhlar" required>
                  <UInput
                    v-model.number="form.features.max_groups"
                    type="number"
                    min="-1"
                    required
                    class="w-full"
                  />
                </UFormField>
              </div>
              <p class="text-xs text-gray-400 mt-1">-1 = cheksiz</p>
            </div>

            <UFormField label="Xotira hajmi" required>
              <USelect
                v-model="form.features.storage_limit"
                :items="storageLimitOptions"
                value-key="value"
                label-key="label"
                class="w-full"
              />
            </UFormField>

            <div class="flex flex-col gap-2 justify-end pb-1">
              <UCheckbox v-model="form.features.lms_enabled" label="LMS moduli" />
              <UCheckbox v-model="form.features.chat_enabled" label="Chat moduli" />
            </div>
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
          <h3 class="font-semibold text-lg">Tarifni tahrirlash</h3>
          <p class="text-sm text-gray-500 mt-1">{{ selectedPlan?.name }}</p>
        </template>
        <form class="space-y-4" @submit.prevent="submitEdit">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Nomi" required class="sm:col-span-2">
              <UInput v-model="form.name" required class="w-full" />
            </UFormField>
            <UFormField label="Narxi (so'm/oy)" required class="sm:col-span-2">
              <UInput
                v-model.number="form.price"
                type="number"
                min="0"
                required
                class="w-full"
              />
            </UFormField>

            <div class="sm:col-span-2">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Limitlar</p>
              <div class="grid grid-cols-3 gap-3">
                <UFormField label="O'quvchilar" required>
                  <UInput
                    v-model.number="form.features.max_students"
                    type="number"
                    min="-1"
                    required
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="O'qituvchilar" required>
                  <UInput
                    v-model.number="form.features.max_teachers"
                    type="number"
                    min="-1"
                    required
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Guruhlar" required>
                  <UInput
                    v-model.number="form.features.max_groups"
                    type="number"
                    min="-1"
                    required
                    class="w-full"
                  />
                </UFormField>
              </div>
              <p class="text-xs text-gray-400 mt-1">-1 = cheksiz</p>
            </div>

            <UFormField label="Xotira hajmi" required>
              <USelect
                v-model="form.features.storage_limit"
                :items="storageLimitOptions"
                value-key="value"
                label-key="label"
                class="w-full"
              />
            </UFormField>

            <div class="flex flex-col gap-2 justify-end pb-1">
              <UCheckbox v-model="form.features.lms_enabled" label="LMS moduli" />
              <UCheckbox v-model="form.features.chat_enabled" label="Chat moduli" />
            </div>
          </div>
          <div class="flex items-center justify-between pt-2">
            <UCheckbox v-model="form.is_active" label="Faol" />
            <div class="flex gap-3">
              <UButton color="neutral" variant="ghost" @click="editModalOpen = false">Bekor</UButton>
              <UButton type="submit" :loading="saving">Saqlash</UButton>
            </div>
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
          <h3 class="font-semibold text-lg text-red-600">Tarifni o'chirish</h3>
        </template>
        <div class="space-y-3">
          <p class="text-sm text-gray-600 dark:text-gray-300">
            <strong>{{ selectedPlan?.name }}</strong> tarifini o'chirmoqchimisiz?
          </p>
          <div v-if="selectedPlan && (selectedPlan.tenants_count ?? 0) > 0" class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-700 dark:text-amber-400">
            Bu tarifda {{ selectedPlan.tenants_count }} ta markaz bor. O'chirish mumkin emas.
          </div>
          <div v-else class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-600">
            Bu amal qaytarib bo'lmaydi!
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="ghost" @click="deleteModalOpen = false">Bekor</UButton>
            <UButton
              color="error"
              :loading="saving"
              :disabled="(selectedPlan?.tenants_count ?? 0) > 0"
              @click="confirmDelete"
            >
              O'chirish
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
