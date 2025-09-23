<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/authStore'
import Login from './components/Login.vue'

const authStore = useAuthStore()

// Al cargar la app, inicializamos la sesión y obtenemos el perfil del usuario.
onMounted(() => {
  authStore.initialize()
})

const handleLogout = async () => {
  await authStore.signOut()
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <!-- Usamos el getter isAuthenticated para más claridad -->
    <div v-if="authStore.isAuthenticated" class="container mx-auto p-4">
      <header class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-2xl">
            <!-- Ahora podemos usar el nombre del perfil -->
            Bienvenido, <span class="font-bold">{{ authStore.user.full_name || authStore.user.email }}</span>
          </h1>
          <p class="text-sm text-gray-400">Tu rol: <span class="font-semibold capitalize">{{ authStore.user.role }}</span></p>
        </div>
        <button
          @click="handleLogout"
          class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
        >
          Cerrar Sesión
        </button>
      </header>
      
      <main>
        <!-- AQUÍ IRÁ EL RESTO DE TU APLICACIÓN -->
        <div v-if="authStore.userRole === 'nutricionista'">
          <p class="p-4 bg-green-800 rounded-lg">Panel de Nutricionista: ¡Tienes permisos especiales!</p>
        </div>
        <div v-if="authStore.userRole === 'cliente'">
          <p class="p-4 bg-blue-800 rounded-lg">Panel de Cliente: ¡Bienvenido a tu espacio personal!</p>
        </div>
      </main>
    </div>

    <!-- Si no hay usuario, muestra el componente de Login -->
    <div v-else>
      <Login />
    </div>
  </div>
</template>