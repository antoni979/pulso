<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { useExercisesStore } from '@/stores/exercises'
import { useWorkoutsStore } from '@/stores/workouts'
import type { Exercise } from '@/lib/supabase'

const emit = defineEmits<{
  close: []
  saved: []
}>()

const exercisesStore = useExercisesStore()
const workoutsStore = useWorkoutsStore()

// Estado del flujo
const step = ref<'search' | 'configure'>('search')

// Búsqueda
const searchInput = ref('')
const debounceTimeout = ref<number | null>(null)

// Ejercicio seleccionado
const selectedExercise = ref<Exercise | null>(null)

// Configuración del entrenamiento
const workoutConfig = ref({
  duration_minutes: 30,
  calories_burned: 0
})

const isSaving = ref(false)

// Limpiar todo al montar el componente
onMounted(() => {
  resetAll()
})

// Limpiar al desmontar
onUnmounted(() => {
  if (debounceTimeout.value) {
    clearTimeout(debounceTimeout.value)
  }
  exercisesStore.clearSearch()
})

// Función para resetear todo
const resetAll = () => {
  step.value = 'search'
  searchInput.value = ''
  selectedExercise.value = null
  workoutConfig.value = {
    duration_minutes: 30,
    calories_burned: 0
  }
  isSaving.value = false
  exercisesStore.clearSearch()
  if (debounceTimeout.value) {
    clearTimeout(debounceTimeout.value)
    debounceTimeout.value = null
  }
}

// Watch search input con debounce mejorado
watch(searchInput, (newValue) => {
  // Limpiar timeout anterior
  if (debounceTimeout.value) {
    clearTimeout(debounceTimeout.value)
    debounceTimeout.value = null
  }

  // Limpiar y validar
  const cleanValue = newValue.trim()

  if (cleanValue.length >= 2) {
    // Crear nuevo timeout
    debounceTimeout.value = setTimeout(async () => {
      try {
        await exercisesStore.searchExercises(cleanValue)
      } catch (error) {
        console.error('Error en búsqueda:', error)
      }
    }, 400) as unknown as number
  } else {
    // Si el input es muy corto, limpiar inmediatamente
    exercisesStore.clearSearch()
  }
})

// Seleccionar ejercicio y pasar a configuración
const selectExercise = (exercise: Exercise) => {
  selectedExercise.value = exercise
  calculateCaloriesBurned()
  step.value = 'configure'
}

// Calcular calorías quemadas basado en duración
const calculateCaloriesBurned = () => {
  if (!selectedExercise.value) return
  workoutConfig.value.calories_burned = Math.round(
    (selectedExercise.value.calories_per_hour / 60) * workoutConfig.value.duration_minutes
  )
}

// Watch duración para recalcular calorías
watch(() => workoutConfig.value.duration_minutes, calculateCaloriesBurned)

// Volver a la búsqueda
const goBackToSearch = () => {
  step.value = 'search'
  selectedExercise.value = null
  searchInput.value = ''
  workoutConfig.value = {
    duration_minutes: 30,
    calories_burned: 0
  }
  exercisesStore.clearSearch()
}

// Cerrar modal
const handleClose = () => {
  resetAll()
  emit('close')
}

// Guardar entrenamiento
const saveWorkout = async () => {
  if (!selectedExercise.value || workoutConfig.value.duration_minutes <= 0) return

  isSaving.value = true
  try {
    await workoutsStore.addWorkout({
      exercise_name: selectedExercise.value.name,
      duration_minutes: workoutConfig.value.duration_minutes,
      calories_burned: workoutConfig.value.calories_burned,
      workout_date: new Date().toISOString(),
      notes: null
    })
    emit('saved')
    emit('close')
  } catch (error) {
    console.error('Error al guardar entrenamiento:', error)
    alert('Error al guardar el entrenamiento')
  } finally {
    isSaving.value = false
  }
}

const getIntensityColor = (intensity: string | null) => {
  const colors: Record<string, string> = {
    low: 'bg-green-100 text-green-700 border-green-300',
    moderate: 'bg-orange-100 text-orange-700 border-orange-300',
    high: 'bg-red-100 text-red-700 border-red-300'
  }
  return colors[intensity || 'moderate'] || colors.moderate
}

const getIntensityLabel = (intensity: string | null) => {
  const labels: Record<string, string> = {
    low: 'Baja',
    moderate: 'Moderada',
    high: 'Alta'
  }
  return labels[intensity || 'moderate'] || 'Moderada'
}

const getCategoryEmoji = (category: string | null) => {
  const emojis: Record<string, string> = {
    cardio: '🏃',
    strength: '💪',
    sports: '⚽',
    flexibility: '🧘',
    other: '🏋️'
  }
  return emojis[category || 'other'] || emojis.other
}

const getCategoryLabel = (category: string | null) => {
  const labels: Record<string, string> = {
    cardio: 'Cardio',
    strength: 'Fuerza',
    sports: 'Deportes',
    flexibility: 'Flexibilidad',
    other: 'Otro'
  }
  return labels[category || 'other'] || 'Otro'
}
</script>

<template>
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="handleClose">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" @click.stop>
      <!-- Header -->
      <div class="bg-gradient-to-br from-red-500 to-orange-600 text-white p-6 rounded-t-3xl sticky top-0 z-10">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-black">{{ step === 'search' ? 'Buscar Ejercicio' : 'Configurar Entreno' }}</h2>
            <p class="text-red-100 text-sm font-medium mt-1">
              {{ step === 'search' ? '¿Qué entrenaste hoy?' : 'Ajusta la duración del ejercicio' }}
            </p>
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
      <div class="p-6">
        <!-- STEP 1: Búsqueda -->
        <div v-if="step === 'search'">
          <!-- Search Input -->
          <div class="relative mb-4">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              v-model="searchInput"
              type="text"
              placeholder="Busca un ejercicio (ej: correr, nadar, pesas...)"
              class="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition font-medium text-lg"
              autofocus
              @focus="() => { if (searchInput.length >= 2) exercisesStore.searchExercises(searchInput) }"
            />
          </div>

          <!-- Loading State -->
          <div v-if="exercisesStore.loading" class="text-center py-12">
            <div class="inline-block w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-gray-600 mt-4 font-medium">Buscando ejercicios...</p>
          </div>

          <!-- Search Results -->
          <div v-else-if="exercisesStore.exercises.length > 0" class="space-y-2">
            <p class="text-sm text-gray-600 font-semibold mb-3">{{ exercisesStore.exercises.length }} ejercicios encontrados:</p>
            <div class="max-h-96 overflow-y-auto space-y-2">
              <button
                v-for="exercise in exercisesStore.exercises"
                :key="exercise.id"
                @click="selectExercise(exercise)"
                class="w-full text-left p-4 bg-gray-50 hover:bg-red-50 border-2 border-gray-200 hover:border-red-300 rounded-xl transition-all group"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center space-x-2 mb-2">
                      <span class="text-2xl">{{ getCategoryEmoji(exercise.category) }}</span>
                      <p class="font-bold text-gray-900 group-hover:text-red-700">{{ exercise.name }}</p>
                    </div>
                    <div class="flex flex-wrap gap-2 text-sm">
                      <span class="px-2 py-1 bg-red-100 text-red-700 rounded-md font-semibold">
                        {{ exercise.calories_per_hour }} kcal/h
                      </span>
                      <span v-if="exercise.intensity" :class="getIntensityColor(exercise.intensity)" class="px-2 py-1 text-xs font-bold rounded-md border">
                        {{ getIntensityLabel(exercise.intensity) }}
                      </span>
                      <span v-if="exercise.category" class="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md">
                        {{ getCategoryLabel(exercise.category) }}
                      </span>
                    </div>
                  </div>
                  <svg class="w-6 h-6 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <!-- No Results -->
          <div v-else-if="searchInput.length >= 2 && !exercisesStore.loading" class="text-center py-12">
            <span class="text-6xl mb-4 block">🔍</span>
            <p class="text-gray-700 font-bold text-lg">No se encontraron ejercicios</p>
            <p class="text-gray-500 mt-2">Intenta con otro término de búsqueda</p>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-12">
            <span class="text-7xl mb-4 block">🏋️</span>
            <p class="text-gray-700 font-bold text-lg">Busca un ejercicio</p>
            <p class="text-gray-500 mt-2">Escribe al menos 2 caracteres para buscar</p>
          </div>
        </div>

        <!-- STEP 2: Configuración -->
        <div v-if="step === 'configure' && selectedExercise" class="space-y-6">
          <!-- Ejercicio seleccionado -->
          <div class="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-2">
                  <span class="text-3xl">{{ getCategoryEmoji(selectedExercise.category) }}</span>
                  <p class="font-black text-xl text-gray-900">{{ selectedExercise.name }}</p>
                </div>
                <div class="flex flex-wrap gap-2 text-sm mb-2">
                  <span class="px-2 py-1 bg-white border border-red-300 text-gray-700 rounded-md font-semibold">
                    {{ selectedExercise.calories_per_hour }} kcal por hora
                  </span>
                  <span v-if="selectedExercise.intensity" :class="getIntensityColor(selectedExercise.intensity)" class="px-2 py-1 text-xs font-bold rounded-md border">
                    Intensidad: {{ getIntensityLabel(selectedExercise.intensity) }}
                  </span>
                </div>
                <p v-if="selectedExercise.description" class="text-sm text-gray-600 mt-2">
                  {{ selectedExercise.description }}
                </p>
              </div>
              <button
                @click="goBackToSearch"
                class="text-gray-400 hover:text-gray-600 transition-colors ml-3"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Duración (minutos) -->
          <div>
            <label class="block text-sm font-bold text-gray-800 mb-3">
              <span class="flex items-center space-x-2">
                <span>Duración del ejercicio</span>
                <span class="text-xl">⏱️</span>
              </span>
            </label>
            <input
              v-model.number="workoutConfig.duration_minutes"
              type="number"
              min="1"
              step="1"
              class="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition font-bold text-3xl text-center"
            />
            <p class="text-center text-sm text-gray-600 mt-2 font-semibold">minutos</p>
          </div>

          <!-- Calorías quemadas calculadas -->
          <div class="bg-gradient-to-br from-red-50 to-orange-100 rounded-xl p-6 border-2 border-red-200">
            <div class="flex items-center justify-between mb-4">
              <p class="text-sm font-bold text-red-800 uppercase tracking-wide">
                Calorías estimadas:
              </p>
              <span class="text-xs text-gray-600 font-semibold">{{ workoutConfig.duration_minutes }} minutos</span>
            </div>
            <div class="bg-white rounded-xl p-6 text-center shadow-md">
              <div class="flex items-center justify-center space-x-3 mb-2">
                <span class="text-5xl">🔥</span>
                <div>
                  <p class="text-sm text-gray-600 font-semibold">Quemarás aproximadamente</p>
                  <p class="text-5xl font-black text-red-600">{{ workoutConfig.calories_burned }}</p>
                  <p class="text-sm text-gray-600 mt-1 font-semibold">kilocalorías</p>
                </div>
              </div>
            </div>
            <div class="mt-4 bg-red-100 border border-red-200 rounded-lg p-3">
              <p class="text-xs text-red-800 font-semibold">
                💡 Esta es una estimación basada en el tipo de ejercicio y su intensidad. El gasto calórico real puede variar según tu peso, metabolismo y esfuerzo.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 bg-gray-50 rounded-b-3xl">
        <div v-if="step === 'search'" class="flex justify-center">
          <button
            @click="handleClose"
            class="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all"
          >
            Cancelar
          </button>
        </div>
        <div v-if="step === 'configure'" class="flex space-x-3">
          <button
            @click="goBackToSearch"
            class="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all"
            :disabled="isSaving"
          >
            ← Volver
          </button>
          <button
            @click="saveWorkout"
            :disabled="isSaving || workoutConfig.duration_minutes <= 0"
            class="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold rounded-xl hover:from-red-700 hover:to-orange-600 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!isSaving">Guardar Entreno</span>
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
  </div>
</template>
