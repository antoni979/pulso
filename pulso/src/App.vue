<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/authStore'
import Login from './components/Login.vue'
// Cambiamos la importación a la nueva vista
import NutritionistDashboardView from './views/NutritionistDashboardView.vue' 
import ClientDashboard from './components/ClientDashboard.vue'

const authStore = useAuthStore()

onMounted(() => {
  authStore.initialize()
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-gray-800">
    <div v-if="authStore.isAuthenticated">
      <!-- Y la usamos aquí -->
      <NutritionistDashboardView v-if="authStore.userRole === 'nutricionista'" />
      <ClientDashboard v-else-if="authStore.userRole === 'cliente'" />
      <div v-else>
        <!-- Mensaje de error si no hay rol -->
      </div>
    </div>
    <div v-else>
      <Login />
    </div>
  </div>
</template>