<script setup lang="ts">
definePageMeta({ layout: false })

const config = useRuntimeConfig()

const form = reactive({
  name: '',
  subdomain: '',
  owner_name: '',
  owner_email: '',
  owner_phone: '',
  password: '',
  password_confirmation: '',
})

const loading = ref(false)
const success = ref(false)
const errors = ref<Record<string, string>>({})
const generalError = ref('')

// Auto-generate subdomain from center name
watch(() => form.name, (val) => {
  if (!form.subdomain || form.subdomain === slugify(form.name.slice(0, -1))) {
    form.subdomain = slugify(val)
  }
})

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 63)
}

async function submit() {
  loading.value = true
  errors.value = {}
  generalError.value = ''
  try {
    await $fetch(`${config.public.apiBase}/api/v1/central/auth/register-tenant`, {
      method: 'POST',
      body: { ...form },
    })
    success.value = true
  } catch (e: any) {
    const data = e?.data
    if (data?.errors) {
      const flat: Record<string, string> = {}
      for (const [key, msgs] of Object.entries(data.errors as Record<string, string[]>)) {
        flat[key] = msgs[0]
      }
      errors.value = flat
    } else {
      generalError.value = data?.message ?? 'Xatolik yuz berdi. Qayta urinib ko\'ring.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UApp>
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div class="w-full max-w-lg">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span class="text-white font-bold text-2xl">E</span>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">EPRO SaaS</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">O'quv markazingizni ro'yxatdan o'tkazing</p>
        </div>

        <!-- Success State -->
        <UCard v-if="success" class="shadow-xl text-center">
          <div class="py-6">
            <UIcon name="i-lucide-check-circle-2" class="text-5xl text-green-500 mb-4" />
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Ariza Qabul Qilindi!</h2>
            <p class="text-gray-500 text-sm">
              Arizangiz ko'rib chiqish uchun yuborildi. Administrator tasdiqlashidan so'ng email orqali xabardor qilamiz.
            </p>
            <UButton class="mt-6" to="/login" variant="soft">Admin paneliga kirish</UButton>
          </div>
        </UCard>

        <!-- Registration Form -->
        <UCard v-else class="shadow-xl">
          <template #header>
            <h3 class="font-semibold text-lg">Yangi Markaz Ariza</h3>
            <p class="text-sm text-gray-500 mt-0.5">Barcha maydonlarni to'ldiring</p>
          </template>

          <form class="space-y-4" @submit.prevent="submit">
            <!-- Center info -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Markaz nomi" required :error="errors.name" class="sm:col-span-2">
                <UInput
                  v-model="form.name"
                  placeholder="Muborak IELTS"
                  required
                  :disabled="loading"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Subdomain" required :error="errors.subdomain">
                <UInput
                  v-model="form.subdomain"
                  placeholder="muborak-ielts"
                  required
                  :disabled="loading"
                  class="w-full"
                />
                <template #hint>
                  <span class="text-xs text-gray-400">{{ form.subdomain || 'sizning-markaz' }}.epro.uz</span>
                </template>
              </UFormField>

              <UFormField label="Telefon" :error="errors.owner_phone">
                <UInput
                  v-model="form.owner_phone"
                  placeholder="+998901234567"
                  :disabled="loading"
                  class="w-full"
                />
              </UFormField>
            </div>

            <UDivider label="Egasi ma'lumotlari" />

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Ism Familya" required :error="errors.owner_name">
                <UInput
                  v-model="form.owner_name"
                  placeholder="Sardor Aliyev"
                  required
                  :disabled="loading"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Email" required :error="errors.owner_email">
                <UInput
                  v-model="form.owner_email"
                  type="email"
                  placeholder="sardor@mail.com"
                  required
                  :disabled="loading"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Parol" required :error="errors.password">
                <UInput
                  v-model="form.password"
                  type="password"
                  placeholder="min 8 belgi"
                  required
                  minlength="8"
                  :disabled="loading"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Parolni tasdiqlash" required :error="errors.password_confirmation">
                <UInput
                  v-model="form.password_confirmation"
                  type="password"
                  placeholder="Parolni qaytaring"
                  required
                  :disabled="loading"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div v-if="generalError" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600">
              {{ generalError }}
            </div>

            <div class="pt-2">
              <UButton type="submit" block size="lg" :loading="loading">
                Ariza Yuborish
              </UButton>
              <p class="text-center text-xs text-gray-400 mt-3">
                Allaqachon markazingiz bormi?
                <NuxtLink to="/login" class="text-primary-600 hover:underline">Kirish</NuxtLink>
              </p>
            </div>
          </form>
        </UCard>

        <p class="text-center text-xs text-gray-400 mt-6">
          EPRO SaaS © {{ new Date().getFullYear() }}
        </p>
      </div>
    </div>
  </UApp>
</template>
