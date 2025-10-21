<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const successMessage = ref('')
const errorMessage = ref('')
const isSaving = ref(false)
const showCalculatorResult = ref(false)
const isCalculating = ref(false)

const profileForm = ref({
  full_name: '',
  sex: null as 'male' | 'female' | 'other' | null,
  birth_date: '',
  height: null as number | null,
  current_weight: null as number | null,
  caloric_deficit_goal: -500
})

const calculatedTMB = ref<number | null>(null)

onMounted(() => {
  if (authStore.profile) {
    profileForm.value = {
      full_name: authStore.profile.full_name || '',
      sex: authStore.profile.sex,
      birth_date: authStore.profile.birth_date || '',
      height: authStore.profile.height,
      current_weight: authStore.profile.current_weight || null,
      caloric_deficit_goal: authStore.profile.caloric_deficit_goal || -500
    }
  }
})

// Calculate age from birth date
const calculateAge = (birthDate: string): number | null => {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// Calculate TMB (Tasa Metabólica Basal) using Harris-Benedict formula
const calculateTMB = (weight: number, height: number, age: number, sex: string): number => {
  if (sex === 'male') {
    return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
  } else {
    return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
  }
}

// Check if required fields for TMB calculation are filled
const canCalculate = computed(() => {
  return !!(
    profileForm.value.current_weight &&
    profileForm.value.height &&
    profileForm.value.birth_date &&
    profileForm.value.sex &&
    profileForm.value.sex !== 'other'
  )
})

// Calculate TMB
const calculateCalories = () => {
  if (!canCalculate.value) {
    errorMessage.value = 'Por favor completa todos los campos requeridos (peso, altura, fecha de nacimiento y sexo)'
    setTimeout(() => { errorMessage.value = '' }, 5000)
    return
  }

  isCalculating.value = true

  setTimeout(() => {
    const age = calculateAge(profileForm.value.birth_date)
    if (!age || age < 15 || age > 100) {
      errorMessage.value = 'La edad calculada no es válida'
      setTimeout(() => { errorMessage.value = '' }, 5000)
      isCalculating.value = false
      return
    }

    const tmb = calculateTMB(
      profileForm.value.current_weight!,
      profileForm.value.height!,
      age,
      profileForm.value.sex!
    )

    calculatedTMB.value = Math.round(tmb)
    showCalculatorResult.value = true
    isCalculating.value = false

    successMessage.value = 'TMB calculado correctamente'
    setTimeout(() => { successMessage.value = '' }, 3000)
  }, 500)
}

// Validate deficit/surplus
const deficitWarning = computed(() => {
  const deficit = profileForm.value.caloric_deficit_goal

  if (deficit < -1000) {
    return 'Un déficit mayor a 1000 kcal diarias no es recomendable para la salud'
  } else if (deficit > 500) {
    return 'Un superávit mayor a 500 kcal puede generar ganancia excesiva de grasa'
  }

  return ''
})

const handleSave = async () => {
  isSaving.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const { error } = await authStore.updateProfile(profileForm.value)

    if (error) {
      errorMessage.value = 'Error al guardar el perfil. Intenta nuevamente.'
      setTimeout(() => {
        errorMessage.value = ''
      }, 5000)
    } else {
      successMessage.value = 'Perfil actualizado correctamente'
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    }
  } catch (err) {
    errorMessage.value = 'Error inesperado al guardar el perfil'
    setTimeout(() => {
      errorMessage.value = ''
    }, 5000)
  } finally {
    isSaving.value = false
  }
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/30 to-white pb-20">
    <!-- Header -->
    <header class="bg-white/95 backdrop-blur-xl border-b-2 border-primary-100 sticky top-0 z-50 shadow-sm safe-top">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <button
              @click="goBack"
              class="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all"
            >
              <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span class="text-2xl">👤</span>
            </div>
            <div>
              <h1 class="text-2xl font-black text-gray-900 tracking-tight">Mi Perfil</h1>
              <p class="text-sm text-gray-600 font-medium">Configuración personal</p>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Success/Error Messages -->
      <transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0 transform -translate-y-2"
        enter-to-class="opacity-100 transform translate-y-0"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100 transform translate-y-0"
        leave-to-class="opacity-0 transform -translate-y-2"
      >
        <div v-if="successMessage" class="mb-6 bg-primary-50 border-2 border-primary-500 rounded-xl p-4">
          <div class="flex items-center space-x-3">
            <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-primary-800 font-semibold">{{ successMessage }}</p>
          </div>
        </div>
      </transition>

      <transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0 transform -translate-y-2"
        enter-to-class="opacity-100 transform translate-y-0"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100 transform translate-y-0"
        leave-to-class="opacity-0 transform -translate-y-2"
      >
        <div v-if="errorMessage" class="mb-6 bg-red-50 border-2 border-red-500 rounded-xl p-4">
          <div class="flex items-center space-x-3">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-red-800 font-semibold">{{ errorMessage }}</p>
          </div>
        </div>
      </transition>

      <!-- Profile Form -->
      <form @submit.prevent="handleSave" class="space-y-6">
        <!-- Personal Information Card -->
        <div class="bg-white rounded-2xl shadow-xl p-8 border-2 border-primary-100">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Información Personal</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Full Name -->
            <div class="md:col-span-2">
              <label class="block text-sm font-bold text-gray-800 mb-2">Nombre Completo</label>
              <input
                v-model="profileForm.full_name"
                type="text"
                placeholder="Tu nombre completo"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium transition-all"
                required
              />
            </div>

            <!-- Sex -->
            <div>
              <label class="block text-sm font-bold text-gray-800 mb-2">Sexo</label>
              <select
                v-model="profileForm.sex"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium transition-all"
                required
              >
                <option :value="null">Seleccionar...</option>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <!-- Birth Date -->
            <div>
              <label class="block text-sm font-bold text-gray-800 mb-2">Fecha de Nacimiento</label>
              <input
                v-model="profileForm.birth_date"
                type="date"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium transition-all"
                required
              />
            </div>

            <!-- Height -->
            <div>
              <label class="block text-sm font-bold text-gray-800 mb-2">
                <span class="flex items-center space-x-2">
                  <span>Altura (cm)</span>
                  <span class="text-xl">📏</span>
                </span>
              </label>
              <input
                v-model.number="profileForm.height"
                type="number"
                min="0"
                step="0.1"
                placeholder="170"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium transition-all"
                required
              />
            </div>

            <!-- Current Weight -->
            <div>
              <label class="block text-sm font-bold text-gray-800 mb-2">
                <span class="flex items-center space-x-2">
                  <span>Peso Actual (kg)</span>
                  <span class="text-xl">⚖️</span>
                </span>
              </label>
              <input
                v-model.number="profileForm.current_weight"
                type="number"
                min="0"
                step="0.1"
                placeholder="70"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium transition-all"
                required
              />
            </div>
          </div>
        </div>


        <!-- TMB Calculator Card -->
        <div class="bg-white rounded-2xl shadow-xl p-8 border-2 border-primary-100">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">
            <span class="flex items-center space-x-2">
              <span>Calculadora TMB</span>
              <span class="text-2xl">🧮</span>
            </span>
          </h2>

          <p class="text-gray-600 mb-4">
            El TMB (Tasa Metabólica Basal) es la cantidad de calorías que tu cuerpo necesita en reposo.
          </p>

          <!-- Calculate Button -->
          <div class="mb-6">
            <button
              type="button"
              @click="calculateCalories"
              :disabled="!canCalculate || isCalculating"
              class="w-full px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold text-lg rounded-xl hover:from-primary-700 hover:to-primary-600 shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span v-if="!isCalculating">Calcular mi TMB</span>
              <span v-else class="flex items-center justify-center space-x-2">
                <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Calculando...</span>
              </span>
            </button>
            <p v-if="!canCalculate" class="mt-2 text-sm text-gray-500 text-center">
              Completa todos los campos para calcular tu TMB
            </p>
          </div>

          <!-- TMB Result -->
          <transition
            enter-active-class="transition ease-out duration-300"
            enter-from-class="opacity-0 transform -translate-y-4"
            enter-to-class="opacity-100 transform translate-y-0"
            leave-active-class="transition ease-in duration-200"
            leave-from-class="opacity-100 transform translate-y-0"
            leave-to-class="opacity-0 transform -translate-y-4"
          >
            <div v-if="showCalculatorResult && calculatedTMB" class="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-6">
              <div class="text-center">
                <div class="text-4xl mb-2">💤</div>
                <h3 class="text-lg font-bold text-gray-700 mb-2">Tu TMB es:</h3>
                <p class="text-5xl font-black text-blue-700 mb-2">{{ calculatedTMB }}</p>
                <p class="text-sm text-gray-600">kcal/día en reposo</p>
              </div>
            </div>
          </transition>
        </div>

        <!-- Deficit Goal Card -->
        <div class="bg-white rounded-2xl shadow-xl p-8 border-2 border-primary-100">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">
            <span class="flex items-center space-x-2">
              <span>Objetivo de Déficit/Superávit Calórico</span>
              <span class="text-2xl">🎯</span>
            </span>
          </h2>

          <p class="text-gray-600 mb-6">
            Define tu objetivo diario de déficit o superávit calórico. Los valores negativos indican déficit (pérdida de peso),
            los positivos indican superávit (ganancia de masa).
          </p>

          <div>
            <label class="block text-sm font-bold text-gray-800 mb-3">
              Déficit/Superávit Diario (kcal)
            </label>

            <div class="flex items-center space-x-4 mb-4">
              <input
                v-model.number="profileForm.caloric_deficit_goal"
                type="number"
                step="50"
                placeholder="-500"
                class="flex-1 px-4 py-4 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-bold text-2xl text-center transition-all"
                required
              />
              <div class="text-center">
                <span class="text-4xl">{{ profileForm.caloric_deficit_goal < 0 ? '🔥' : '💪' }}</span>
              </div>
            </div>

            <!-- Examples -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <button
                type="button"
                @click="profileForm.caloric_deficit_goal = -750"
                class="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition-all text-sm"
              >
                -750 kcal
              </button>
              <button
                type="button"
                @click="profileForm.caloric_deficit_goal = -500"
                class="px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 font-semibold rounded-lg transition-all text-sm"
              >
                -500 kcal
              </button>
              <button
                type="button"
                @click="profileForm.caloric_deficit_goal = 0"
                class="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold rounded-lg transition-all text-sm"
              >
                Mantenimiento
              </button>
              <button
                type="button"
                @click="profileForm.caloric_deficit_goal = 300"
                class="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 font-semibold rounded-lg transition-all text-sm"
              >
                +300 kcal
              </button>
            </div>

            <!-- Info Box -->
            <div class="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <h4 class="font-bold text-blue-900 mb-2">ℹ️ Información:</h4>
              <ul class="text-sm text-blue-800 space-y-1">
                <li><strong>-500 kcal:</strong> Pérdida moderada de peso (~0.5 kg/semana)</li>
                <li><strong>-750 kcal:</strong> Pérdida acelerada de peso (~0.75 kg/semana)</li>
                <li><strong>0 kcal:</strong> Mantenimiento del peso actual</li>
                <li><strong>+300 kcal:</strong> Ganancia de masa muscular limpia</li>
              </ul>
            </div>

            <!-- Deficit Warning -->
            <transition
              enter-active-class="transition ease-out duration-200"
              enter-from-class="opacity-0"
              enter-to-class="opacity-100"
              leave-active-class="transition ease-in duration-150"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <div v-if="deficitWarning" class="mt-4 bg-amber-50 border-2 border-amber-400 rounded-lg p-3">
                <div class="flex items-start space-x-2">
                  <span class="text-xl">⚠️</span>
                  <p class="text-sm font-semibold text-amber-800">{{ deficitWarning }}</p>
                </div>
              </div>
            </transition>
          </div>
        </div>

        <!-- Save Button -->
        <div class="flex space-x-4">
          <button
            type="submit"
            :disabled="isSaving"
            class="flex-1 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold text-lg rounded-xl hover:from-primary-700 hover:to-primary-600 shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span v-if="!isSaving">Guardar Cambios</span>
            <span v-else class="flex items-center justify-center space-x-2">
              <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Guardando...</span>
            </span>
          </button>

          <button
            type="button"
            @click="goBack"
            class="px-8 py-4 bg-gray-200 text-gray-700 font-bold text-lg rounded-xl hover:bg-gray-300 shadow-lg transition-all"
          >
            Cancelar
          </button>
        </div>
      </form>
    </main>
  </div>
</template>
