import { ref, onMounted } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function useInstallPrompt() {
  const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
  const showInstallPrompt = ref(false)
  const isIOS = ref(false)
  const isStandalone = ref(false)
  const canInstall = ref(false)

  const detectPlatform = () => {
    // Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    isIOS.value = /iphone|ipad|ipod/.test(userAgent)

    // Detectar si ya está instalado (modo standalone)
    isStandalone.value =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    // Verificar si ya fue rechazado recientemente
    const lastDismissed = localStorage.getItem('install-prompt-dismissed')
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
    const wasRecentlyDismissed = lastDismissed && parseInt(lastDismissed) > thirtyDaysAgo

    // Mostrar prompt si:
    // - Es iOS y Safari
    // - No está instalado
    // - No fue rechazado recientemente
    if (isIOS.value && !isStandalone.value && !wasRecentlyDismissed) {
      canInstall.value = true

      // Mostrar después de 5 segundos (dar tiempo a que se familiarice)
      setTimeout(() => {
        showInstallPrompt.value = true
      }, 5000)
    }
  }

  const installApp = async () => {
    if (deferredPrompt.value) {
      // Android: usar el prompt nativo
      deferredPrompt.value.prompt()
      const { outcome } = await deferredPrompt.value.userChoice

      if (outcome === 'accepted') {
        console.log('PWA instalada')
      }

      deferredPrompt.value = null
      showInstallPrompt.value = false
    }
  }

  const dismissPrompt = () => {
    showInstallPrompt.value = false
    localStorage.setItem('install-prompt-dismissed', Date.now().toString())
  }

  onMounted(() => {
    detectPlatform()

    // Capturar evento de instalación (Android/Chrome)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt.value = e as BeforeInstallPromptEvent
      canInstall.value = true
      showInstallPrompt.value = true
    })

    // Detectar cuando se instala la app
    window.addEventListener('appinstalled', () => {
      console.log('PWA instalada exitosamente')
      showInstallPrompt.value = false
    })
  })

  return {
    showInstallPrompt,
    isIOS,
    isStandalone,
    canInstall,
    installApp,
    dismissPrompt
  }
}
