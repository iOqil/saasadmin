<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth'] })

const auth = useAuthStore()
const toast = useToast()

const profileSaving = ref(false)
const passwordSaving = ref(false)

const profileForm = reactive({
  name: auth.user?.name ?? '',
  email: auth.user?.email ?? '',
})

const passwordForm = reactive({
  current_password: '',
  password: '',
  password_confirmation: '',
})

watch(() => auth.user, (u) => {
  if (u) {
    profileForm.name = u.name
    profileForm.email = u.email
  }
}, { immediate: true })

async function submitProfile() {
  if (!profileForm.name || !profileForm.email) {
    toast.add({ title: 'Ism va email kiritilishi shart', color: 'error' })
    return
  }
  profileSaving.value = true
  try {
    await auth.updateProfile({ name: profileForm.name, email: profileForm.email })
    toast.add({ title: 'Profil yangilandi', color: 'success' })
  }
  catch (e: any) {
    const errors = e?.data?.errors
    const first = errors ? Object.values(errors as Record<string, string[]>).flat()[0] : null
    toast.add({ title: first ?? e?.data?.message ?? 'Xatolik yuz berdi', color: 'error' })
  }
  finally {
    profileSaving.value = false
  }
}

async function submitPassword() {
  if (passwordForm.password !== passwordForm.password_confirmation) {
    toast.add({ title: 'Yangi parollar mos kelmaydi', color: 'error' })
    return
  }
  if (passwordForm.password.length < 8) {
    toast.add({ title: 'Parol kamida 8 belgi bo\'lishi kerak', color: 'error' })
    return
  }
  passwordSaving.value = true
  try {
    await auth.changePassword({
      current_password: passwordForm.current_password,
      password: passwordForm.password,
      password_confirmation: passwordForm.password_confirmation,
    })
    toast.add({ title: 'Parol muvaffaqiyatli o\'zgartirildi', color: 'success' })
    Object.assign(passwordForm, { current_password: '', password: '', password_confirmation: '' })
  }
  catch (e: any) {
    const errors = e?.data?.errors
    const first = errors ? Object.values(errors as Record<string, string[]>).flat()[0] : null
    toast.add({ title: first ?? e?.data?.message ?? 'Xatolik yuz berdi', color: 'error' })
  }
  finally {
    passwordSaving.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="settings">
    <template #header>
      <UDashboardNavbar title="Sozlamalar">
        <template #leading><UDashboardSidebarCollapse /></template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 max-w-2xl space-y-6">

        <!-- Profile Card -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <UAvatar :alt="auth.user?.name" size="lg" />
              <div>
                <h3 class="font-semibold">Admin profili</h3>
                <UBadge color="primary" variant="soft" size="xs" class="mt-1">{{ auth.user?.role }}</UBadge>
              </div>
            </div>
          </template>

          <form class="space-y-4" @submit.prevent="submitProfile">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Ism" required>
                <UInput v-model="profileForm.name" placeholder="To'liq ism" class="w-full" />
              </UFormField>
              <UFormField label="Email" required>
                <UInput v-model="profileForm.email" type="email" placeholder="admin@epro.uz" class="w-full" />
              </UFormField>
            </div>
            <div class="flex justify-end">
              <UButton type="submit" :loading="profileSaving" icon="i-lucide-save">
                Saqlash
              </UButton>
            </div>
          </form>
        </UCard>

        <!-- Change Password Card -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-lock" class="w-5 h-5 text-gray-500" />
              <h3 class="font-semibold">Parolni o'zgartirish</h3>
            </div>
          </template>

          <form class="space-y-4" @submit.prevent="submitPassword">
            <UFormField label="Joriy parol" required>
              <UInput
                v-model="passwordForm.current_password"
                type="password"
                placeholder="Joriy parolingiz"
                autocomplete="current-password"
                class="w-full"
              />
            </UFormField>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Yangi parol" required>
                <UInput
                  v-model="passwordForm.password"
                  type="password"
                  placeholder="Kamida 8 belgi"
                  autocomplete="new-password"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Yangi parolni takrorlang" required>
                <UInput
                  v-model="passwordForm.password_confirmation"
                  type="password"
                  placeholder="Parolni tasdiqlang"
                  autocomplete="new-password"
                  class="w-full"
                />
              </UFormField>
            </div>
            <div class="flex justify-end">
              <UButton
                type="submit"
                :loading="passwordSaving"
                color="warning"
                icon="i-lucide-key"
              >
                Parolni o'zgartirish
              </UButton>
            </div>
          </form>
        </UCard>

        <!-- Danger Zone -->
        <UCard>
          <template #header>
            <h3 class="font-semibold text-red-500">Xavfli zona</h3>
          </template>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium">Tizimdan chiqish</p>
              <p class="text-xs text-gray-400 mt-0.5">Sessiyani tugatadi va login sahifasiga qaytaradi</p>
            </div>
            <UButton color="error" variant="soft" icon="i-lucide-log-out" @click="auth.logout()">
              Chiqish
            </UButton>
          </div>
        </UCard>

      </div>
    </template>
  </UDashboardPanel>
</template>
