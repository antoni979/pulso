<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const fullName = ref('')
const error = ref('')

const toggleMode = () => {
  isLogin.value = !isLogin.value
  error.value = ''
}

const handleSubmit = async () => {
  error.value = ''

  if (!email.value || !password.value) {
    error.value = 'Por favor completa todos los campos'
    return
  }

  if (!isLogin.value && !fullName.value) {
    error.value = 'Por favor ingresa tu nombre completo'
    return
  }

  try {
    if (isLogin.value) {
      const { error: signInError } = await authStore.signIn(email.value, password.value)
      if (signInError) {
        error.value = signInError.message
      } else {
        router.push('/')
      }
    } else {
      const { error: signUpError } = await authStore.signUp(email.value, password.value, fullName.value)
      if (signUpError) {
        error.value = signUpError.message
      } else {
        error.value = ''
        // Show success message
        alert('¡Cuenta creada! Por favor verifica tu email.')
        isLogin.value = true
      }
    }
  } catch (err) {
    error.value = 'Ocurrió un error inesperado'
    console.error(err)
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 p-4 relative overflow-hidden">
    <!-- Animated background shapes -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-1/2 -left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl"></div>
    </div>

    <div class="w-full max-w-md relative z-10">
      <!-- Logo/Brand -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-24 h-24 bg-white rounded-3xl shadow-2xl mb-6 transform hover:scale-105 transition-transform">
          <span class="text-5xl">🥗</span>
        </div>
        <h1 class="text-5xl font-black text-white mb-3 tracking-tight">Pulso</h1>
        <p class="text-white/90 text-xl font-medium">Nutrición inteligente</p>
      </div>

      <!-- Auth Card -->
      <div class="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-xl border border-primary-100">
        <div class="mb-6">
          <h2 class="text-3xl font-bold text-gray-900 mb-2">
            {{ isLogin ? '¡Bienvenido!' : 'Comienza ahora' }}
          </h2>
          <p class="text-gray-600 text-lg">
            {{ isLogin ? 'Inicia sesión para continuar' : 'Crea tu cuenta gratis' }}
          </p>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <p class="text-red-700 text-sm font-medium">{{ error }}</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- Full Name (Register only) -->
          <div v-if="!isLogin">
            <label for="fullName" class="block text-sm font-semibold text-gray-800 mb-2">
              Nombre completo
            </label>
            <input
              id="fullName"
              v-model="fullName"
              type="text"
              placeholder="Tu nombre"
              class="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition font-medium"
            />
          </div>

          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-semibold text-gray-800 mb-2">
              Email
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="tu@email.com"
              class="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition font-medium"
            />
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-semibold text-gray-800 mb-2">
              Contraseña
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              class="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition font-medium"
            />
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="authStore.loading"
            class="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold text-lg rounded-xl hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-4 focus:ring-primary-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span v-if="authStore.loading">Cargando...</span>
            <span v-else>{{ isLogin ? 'Iniciar sesión' : 'Crear cuenta' }}</span>
          </button>
        </form>

        <!-- Toggle Mode -->
        <div class="mt-6 text-center">
          <button
            @click="toggleMode"
            class="text-primary-700 hover:text-primary-800 font-semibold text-sm transition-colors"
          >
            {{ isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión' }}
          </button>
        </div>
      </div>

      <!-- Footer -->
      <p class="text-center text-white/90 text-base font-medium mt-8 drop-shadow-lg">
        Control total de tu nutrición
      </p>
    </div>
  </div>
</template>
