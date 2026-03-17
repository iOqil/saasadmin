import { createSharedComposable } from '@vueuse/core'

const _useDashboard = () => {
  const route = useRoute()
  const router = useRouter()
  const isNotificationsSlideoverOpen = ref(false)

  defineShortcuts({
    'g-d': () => router.push('/dashboard'),
    'g-t': () => router.push('/tenants'),
    'g-p': () => router.push('/plans'),
    'n': () => { isNotificationsSlideoverOpen.value = !isNotificationsSlideoverOpen.value },
  })

  watch(() => route.fullPath, () => {
    isNotificationsSlideoverOpen.value = false
  })

  return { isNotificationsSlideoverOpen }
}

export const useDashboard = createSharedComposable(_useDashboard)
