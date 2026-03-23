<script setup lang="ts">
definePageMeta({ layout: false })

const auth = useAuthStore()

const form = reactive({ email: '', password: '' })
const loading = ref(false)
const errorMsg = ref('')

if (auth.isAuthenticated) {
  await navigateTo('/dashboard', { replace: true })
}

async function submit() {
  loading.value = true
  errorMsg.value = ''
  try {
    await auth.login(form.email, form.password)
    await navigateTo('/dashboard', { replace: true })
  } catch (e: any) {
    console.error('Login error:', e)
    const status = e?.status ?? e?.statusCode
    const data = e?.data

    if (!status) {
      errorMsg.value = `Server bilan aloqa yo'q. API: ${useRuntimeConfig().public.apiBase}`
    } else if (status === 422) {
      const firstError = data?.errors ? Object.values(data.errors as Record<string, string[]>).flat()[0] : null
      errorMsg.value = firstError ?? data?.message ?? 'Email yoki parol noto\'g\'ri'
    } else if (status === 403) {
      errorMsg.value = data?.message ?? 'Akkaunt faol emas'
    } else if (status === 404) {
      errorMsg.value = `Endpoint topilmadi (404). URL tekshiring.`
    } else {
      errorMsg.value = `Xatolik ${status}: ${data?.message ?? e?.message ?? 'Noma\'lum xato'}`
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UApp>
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div class="w-full max-w-sm">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span class="text-white font-bold text-2xl">E</span>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">EPRO Admin</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">SaaS boshqaruv paneli</p>
        </div>

        <UCard class="shadow-xl">
          <form class="space-y-5" @submit.prevent="submit">
            <UFormField label="Email" required>
              <UInput
                v-model="form.email"
                type="email"
                placeholder="admin@epro.uz"
                autocomplete="email"
                :disabled="loading"
                class="w-full"
                size="lg"
              />
            </UFormField>

            <UFormField label="Parol" required>
              <UInput
                v-model="form.password"
                type="password"
                placeholder="••••••••"
                autocomplete="current-password"
                :disabled="loading"
                class="w-full"
                size="lg"
              />
            </UFormField>

            <div v-if="errorMsg" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {{ errorMsg }}
            </div>

            <UButton
              type="submit"
              block
              size="lg"
              :loading="loading"
              class="mt-2"
            >
              Kirish
            </UButton>
          </form>
        </UCard>

        <p class="text-center text-sm text-gray-500 mt-4">
          Markazingiz yo'qmi?
          <NuxtLink to="/register" class="text-primary-600 hover:underline font-medium">Ro'yxatdan o'tish</NuxtLink>
        </p>

        <p class="text-center text-xs text-gray-400 mt-4">
          EPRO SaaS Admin Panel © {{ new Date().getFullYear() }}
        </p>
      </div>
    </div>
  </UApp>
</template>
