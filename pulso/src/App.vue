<script setup lang="ts">
import { RouterView } from 'vue-router'
import InstallPromptIOS from './components/InstallPromptIOS.vue'
import { useInstallPrompt } from './composables/useInstallPrompt'

const { showInstallPrompt, isIOS, dismissPrompt } = useInstallPrompt()
</script>

<template>
  <RouterView />
  <InstallPromptIOS
    v-if="showInstallPrompt"
    :is-i-o-s="isIOS"
    @dismiss="dismissPrompt"
  />
</template>

<style>
:root {
  --safe-area-inset-top: env(safe-area-inset-top);
  --safe-area-inset-right: env(safe-area-inset-right);
  --safe-area-inset-bottom: env(safe-area-inset-bottom);
  --safe-area-inset-left: env(safe-area-inset-left);
}

#app {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
  min-height: -webkit-fill-available;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Ajustes para iOS standalone mode */
@media (display-mode: standalone) {
  body {
    padding-top: var(--safe-area-inset-top);
    padding-bottom: var(--safe-area-inset-bottom);
    padding-left: var(--safe-area-inset-left);
    padding-right: var(--safe-area-inset-right);
  }
}

/* Prevenir zoom en inputs en iOS */
@supports (-webkit-touch-callout: none) {
  input,
  textarea,
  select {
    font-size: 16px !important;
  }
}
</style>
