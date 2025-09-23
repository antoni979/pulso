<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const fullName = ref('') // No cambia el nombre de la variable local
const isRegistering = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

const handleAuth = async () => {
  if (isLoading.value) return;
  
  isLoading.value = true;
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (isRegistering.value) {
      // CORREGIDO: Enviamos 'nombre_completo' para que coincida con el trigger SQL
      await authStore.signUp(email.value, password.value, { 
        nombre_completo: fullName.value 
      })
      successMessage.value = '¡Registro exitoso! Ya puedes iniciar sesión.'
    } else {
      await authStore.signIn(email.value, password.value)
    }
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isLoading.value = false;
  }
}

const toggleMode = () => {
  isRegistering.value = !isRegistering.value
  errorMessage.value = ''
  successMessage.value = ''
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 p-4">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6">
      <div class="text-center">
        <h1 class="text-6xl font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent animate-fade-in-up">
          NutriApp
        </h1>
        <h2 class="mt-2 text-2xl font-bold tracking-tight text-gray-900">
          {{ isRegistering ? 'Crea tu cuenta' : 'Bienvenido de vuelta' }}
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          {{ isRegistering ? 'Rellena los datos para empezar.' : 'Introduce tus credenciales para acceder.' }}
        </p>
      </div>

      <form class="space-y-6" @submit.prevent="handleAuth">
        <div v-if="isRegistering">
          <label for="fullName" class="block text-sm font-medium text-gray-700">Nombre Completo</label>
          <div class="mt-1">
            <input
              v-model="fullName"
              type="text"
              id="fullName"
              placeholder="Tu nombre y apellidos"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
              required
            />
          </div>
        </div>
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
          <div class="mt-1">
            <input
              v-model="email"
              type="email"
              id="email"
              autocomplete="email"
              placeholder="tu@email.com"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
              required
            />
          </div>
        </div>
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">Contraseña</label>
          <div class="mt-1">
            <input
              v-model="password"
              type="password"
              id="password"
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
              required
            />
          </div>
        </div>
        <div>
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:bg-emerald-400"
          >
            <span v-if="!isLoading">{{ isRegistering ? 'Crear cuenta' : 'Iniciar Sesión' }}</span>
            <span v-else>Procesando...</span>
          </button>
        </div>
      </form>

      <div v-if="errorMessage" class="mt-4 p-3 bg-red-100 text-red-800 rounded-lg text-sm text-center">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="mt-4 p-3 bg-green-100 text-green-800 rounded-lg text-sm text-center">
        {{ successMessage }}
      </div>

      <p class="text-center text-sm text-gray-600">
        {{ isRegistering ? '¿Ya tienes una cuenta?' : '¿Aún no tienes una cuenta?' }}
        <button @click="toggleMode" class="font-medium text-emerald-600 hover:text-emerald-500 hover:underline">
          {{ isRegistering ? 'Inicia sesión' : 'Regístrate aquí' }}
        </button>
      </p>
    </div>
  </div>
</template>