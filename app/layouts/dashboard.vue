<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const open = ref(false)
const { isNotificationsSlideoverOpen } = useDashboard()

const links: NavigationMenuItem[][] = [[
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/dashboard',
    onSelect: () => { open.value = false },
  },
  {
    label: "O'quv Markazlar",
    icon: 'i-lucide-building-2',
    to: '/tenants',
    onSelect: () => { open.value = false },
  },
  {
    label: 'Tarif Rejalari',
    icon: 'i-lucide-badge-dollar-sign',
    to: '/plans',
    onSelect: () => { open.value = false },
  },
  {
    label: "Obuna To'lovlari",
    icon: 'i-lucide-receipt',
    to: '/payments',
    onSelect: () => { open.value = false },
  },
  {
    label: 'Hisobotlar',
    icon: 'i-lucide-bar-chart-3',
    to: '/reports',
    onSelect: () => { open.value = false },
  },
  {
    label: 'Xabarlar',
    icon: 'i-lucide-bell',
    to: '/announcements',
    onSelect: () => { open.value = false },
  },
  {
    label: 'Arizalar',
    icon: 'i-lucide-inbox',
    to: '/registrations',
    onSelect: () => { open.value = false },
  },
], [
  {
    label: 'Sozlamalar',
    icon: 'i-lucide-settings',
    to: '/settings',
  },
  {
    label: "Qo'llanma",
    icon: 'i-lucide-book-open',
    to: 'https://docs.epro.uz',
    target: '_blank',
  },
]]

const groups = computed(() => [{
  id: 'links',
  label: "Sahifalarga o'tish",
  items: links.flat(),
}])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <!-- Logo -->
        <div :class="['flex items-center gap-3 px-2 py-1 transition-all', collapsed ? 'justify-center' : '']">
          <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span class="text-white font-bold text-sm">E</span>
          </div>
          <Transition name="fade">
            <div v-if="!collapsed">
              <p class="font-bold text-sm leading-tight text-highlighted">EPRO</p>
              <p class="text-xs text-dimmed leading-tight">Admin Panel</p>
            </div>
          </Transition>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <!-- User menu -->
        <UDropdownMenu
          :items="[[
            { type: 'label', label: auth.user?.name ?? 'Admin', avatar: { alt: auth.user?.name } }
          ], [
            { label: 'Profil', icon: 'i-lucide-user', to: '/settings' }
          ], [
            { label: 'Chiqish', icon: 'i-lucide-log-out', onSelect: auth.logout }
          ]]"
          :content="{ align: 'center', collisionPadding: 12 }"
          :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
        >
          <UButton
            :label="collapsed ? undefined : (auth.user?.name ?? 'Admin')"
            :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
            color="neutral"
            variant="ghost"
            block
            :square="collapsed"
            class="data-[state=open]:bg-elevated"
            :ui="{ trailingIcon: 'text-dimmed' }"
          >
            <template #leading>
              <UAvatar :alt="auth.user?.name" size="xs" />
            </template>
          </UButton>
        </UDropdownMenu>
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />
  </UDashboardGroup>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
