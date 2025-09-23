<script setup>
// En un futuro, aquí iría la lógica para que el cliente vea su dieta.
// Por ahora, es un placeholder.
import { useAuthStore } from '../stores/authStore'
const authStore = useAuthStore()
</script>

<template>
  <div class="p-8">
    <header class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Mi Plan Semanal</h1>
        <p class="text-gray-600">Aquí puedes ver la dieta que te ha asignado tu nutricionista.</p>
      </div>
      <button @click="authStore.signOut()" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">Cerrar Sesión</button>
    </header>

    <div class="bg-white p-10 rounded-xl shadow text-center">
      <p>Vista del cliente en construcción.</p>
      <p class="mt-2 text-sm text-gray-500">Próximamente verás tu dieta detallada aquí.</p>
    </div>
  </div>
</template>