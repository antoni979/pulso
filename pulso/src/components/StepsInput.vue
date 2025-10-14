<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStepsStore } from '@/stores/steps'

const emit = defineEmits<{
  close: []
  saved: []
}>()

const stepsStore = useStepsStore()

const stepsInput = ref(stepsStore.todaySteps?.steps_count || 0)
const isSaving = ref(false)
const errorMessage = ref('')

// Calcular calorías en tiempo real
const calculatedCalories = computed(() => {
  return stepsStore.calculateStepsCalories(stepsInput.value)
})

const handleSave = async () => {
  if (stepsInput.value < 0) {
    errorMessage.value = 'Los pasos no pueden ser negativos'
    return
  }

  isSaving.value = true
  errorMessage.value = ''

  try {
    await stepsStore.updateTodaySteps(stepsInput.value)
    emit('saved')
    emit('close')
  } catch (error) {
    errorMessage.value = 'Error al guardar los pasos. Intenta nuevamente.'
  } finally {
    isSaving.value = false
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="handleClose">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" @click.stop>
      <!-- Header -->
      <div class="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-6 rounded-t-3xl">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-black">Registrar Pasos</h2>
            <p class="text-purple-100 text-sm font-medium mt-1">¿Cuántos pasos diste hoy?</p>
          </div>
          <button
            @click="handleClose"
            class="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-6">
        <!-- Error Message -->
        <transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 transform -translate-y-2"
          enter-to-class="opacity-100 transform translate-y-0"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 transform translate-y-0"
          leave-to-class="opacity-0 transform -translate-y-2"
        >
          <div v-if="errorMessage" class="bg-red-50 border-2 border-red-200 rounded-xl p-3">
            <div class="flex items-center space-x-2">
              <span class="text-xl">⚠️</span>
              <p class="text-sm font-semibold text-red-800">{{ errorMessage }}</p>
            </div>
          </div>
        </transition>

        <!-- Steps Icon -->
        <div class="flex justify-center">
          <div class="w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-3xl flex items-center justify-center shadow-lg">
            <span class="text-5xl">👟</span>
          </div>
        </div>

        <!-- Steps Input -->
        <div>
          <label class="block text-sm font-bold text-gray-800 mb-2">
            <span class="flex items-center space-x-2">
              <span>Número de Pasos</span>
              <span class="text-xl">🚶</span>
            </span>
          </label>
          <input
            v-model.number="stepsInput"
            type="number"
            min="0"
            step="1"
            placeholder="10000"
            class="w-full px-4 py-4 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-bold text-2xl text-center transition-all"
            autofocus
          />
        </div>

        <!-- Calories Preview -->
        <div class="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-5">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <span class="text-2xl">🔥</span>
              </div>
              <div>
                <p class="text-xs font-bold text-gray-600 uppercase tracking-wide">Calorías Quemadas</p>
                <p class="text-3xl font-black text-purple-700">{{ calculatedCalories }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-xs text-gray-500 font-semibold">60 kcal por</p>
              <p class="text-xs text-gray-500 font-semibold">cada 1000 pasos</p>
            </div>
          </div>
        </div>

        <!-- Info -->
        <div class="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <div class="flex items-start space-x-2">
            <span class="text-xl">💡</span>
            <div class="text-sm text-blue-800">
              <p class="font-bold mb-1">¿Cómo contar tus pasos?</p>
              <p class="font-medium">Usa tu smartwatch, banda de actividad o la app de salud de tu móvil para conocer tu conteo diario de pasos.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 bg-gray-50 rounded-b-3xl flex space-x-3">
        <button
          @click="handleClose"
          class="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all"
          :disabled="isSaving"
        >
          Cancelar
        </button>
        <button
          @click="handleSave"
          :disabled="isSaving || stepsInput < 0"
          class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-indigo-700 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="!isSaving">Guardar</span>
          <span v-else class="flex items-center justify-center space-x-2">
            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Guardando...</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
