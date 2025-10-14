<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useExercisesStore } from '@/stores/exercises'
import type { Exercise } from '@/lib/supabase'

const emit = defineEmits<{
  selectExercise: [exercise: Exercise, duration: number, caloriesBurned: number]
  close: []
}>()

const exercisesStore = useExercisesStore()
const searchInput = ref('')
const selectedExercise = ref<Exercise | null>(null)
const durationMinutes = ref(30)
const debounceTimeout = ref<number | null>(null)

// Watch search input with debounce
watch(searchInput, (newValue) => {
  if (debounceTimeout.value) {
    clearTimeout(debounceTimeout.value)
  }

  debounceTimeout.value = setTimeout(() => {
    if (newValue.length >= 2) {
      exercisesStore.searchExercises(newValue)
    } else {
      exercisesStore.clearSearch()
    }
  }, 300) as unknown as number
})

const selectExercise = (exercise: Exercise) => {
  selectedExercise.value = exercise
  searchInput.value = exercise.name
  exercisesStore.clearSearch()
}

const calculateCaloriesBurned = (exercise: Exercise, minutes: number) => {
  return Math.round((exercise.calories_per_hour / 60) * minutes)
}

const caloriesBurned = computed(() => {
  if (selectedExercise.value) {
    return calculateCaloriesBurned(selectedExercise.value, durationMinutes.value)
  }
  return 0
})

const handleAddWorkout = () => {
  if (selectedExercise.value && durationMinutes.value > 0) {
    emit('selectExercise', selectedExercise.value, durationMinutes.value, caloriesBurned.value)
    // Reset
    selectedExercise.value = null
    searchInput.value = ''
    durationMinutes.value = 30
  }
}

const getIntensityColor = (intensity: string | null) => {
  const colors: Record<string, string> = {
    low: 'bg-green-100 text-green-700 border-green-200',
    moderate: 'bg-orange-100 text-orange-700 border-orange-200',
    high: 'bg-red-100 text-red-700 border-red-200'
  }
  return colors[intensity || 'moderate'] || colors.moderate
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
</script>

<template>
  <div class="bg-white rounded-2xl shadow-xl p-6 border-2 border-red-100">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-2xl font-bold text-gray-900">Buscar ejercicio</h3>
      <button
        @click="emit('close')"
        class="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

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
        @focus="() => { if (searchInput.length >= 2) exercisesStore.searchExercises(searchInput) }"
      />
    </div>

    <!-- Loading State -->
    <div v-if="exercisesStore.loading" class="text-center py-8">
      <div class="inline-block w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-gray-600 mt-2">Buscando...</p>
    </div>

    <!-- Search Results -->
    <div v-else-if="exercisesStore.exercises.length > 0 && !selectedExercise" class="max-h-64 overflow-y-auto space-y-2 mb-4">
      <button
        v-for="exercise in exercisesStore.exercises"
        :key="exercise.id"
        @click="selectExercise(exercise)"
        class="w-full text-left p-4 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-300 rounded-xl transition-all group"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-2 mb-2">
              <span class="text-2xl">{{ getCategoryEmoji(exercise.category) }}</span>
              <p class="font-semibold text-gray-900 group-hover:text-red-700">{{ exercise.name }}</p>
            </div>
            <div class="flex items-center space-x-3">
              <span class="text-sm text-gray-600 font-medium">
                {{ exercise.calories_per_hour }} kcal/hora
              </span>
              <span v-if="exercise.intensity" :class="getIntensityColor(exercise.intensity)" class="px-2 py-1 text-xs font-bold rounded-md border">
                {{ exercise.intensity === 'low' ? 'Baja' : exercise.intensity === 'moderate' ? 'Moderada' : 'Alta' }}
              </span>
              <span v-if="exercise.category" class="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md">
                {{ exercise.category }}
              </span>
            </div>
          </div>
          <svg class="w-5 h-5 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
    </div>

    <!-- No Results -->
    <div v-else-if="searchInput.length >= 2 && exercisesStore.exercises.length === 0 && !exercisesStore.loading && !selectedExercise" class="text-center py-8">
      <span class="text-5xl mb-3 block">🔍</span>
      <p class="text-gray-600">No se encontraron ejercicios</p>
      <p class="text-sm text-gray-500 mt-1">Intenta con otro término de búsqueda</p>
    </div>

    <!-- Selected Exercise - Configure Duration -->
    <div v-if="selectedExercise" class="space-y-6">
      <!-- Selected Exercise Info -->
      <div class="bg-red-50 border-2 border-red-200 rounded-xl p-4">
        <div class="flex items-start justify-between mb-3">
          <div>
            <div class="flex items-center space-x-2 mb-2">
              <span class="text-3xl">{{ getCategoryEmoji(selectedExercise.category) }}</span>
              <p class="font-bold text-lg text-gray-900">{{ selectedExercise.name }}</p>
            </div>
            <p class="text-sm text-gray-600">{{ selectedExercise.calories_per_hour }} kcal por hora</p>
            <div class="flex items-center space-x-2 mt-2">
              <span v-if="selectedExercise.intensity" :class="getIntensityColor(selectedExercise.intensity)" class="px-2 py-1 text-xs font-bold rounded-md border">
                {{ selectedExercise.intensity === 'low' ? 'Baja' : selectedExercise.intensity === 'moderate' ? 'Moderada' : 'Alta' }}
              </span>
            </div>
          </div>
          <button
            @click="() => { selectedExercise = null; searchInput = '' }"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Duration Input -->
      <div>
        <label class="block text-sm font-semibold text-gray-800 mb-3">
          Duración (minutos)
        </label>
        <input
          v-model.number="durationMinutes"
          type="number"
          min="1"
          step="1"
          class="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition font-bold text-2xl text-center"
        />
      </div>

      <!-- Calculated Calories Burned -->
      <div class="bg-gradient-to-br from-red-50 to-orange-100 rounded-xl p-5 border-2 border-red-200">
        <p class="text-sm font-semibold text-red-800 mb-3">Calorías estimadas para {{ durationMinutes }} minutos:</p>
        <div class="bg-white rounded-lg p-4 text-center">
          <p class="text-sm text-gray-600 mb-1">Quemarás aproximadamente</p>
          <p class="text-4xl font-black text-red-600">{{ caloriesBurned }}</p>
          <p class="text-sm text-gray-600 mt-1">kcal</p>
        </div>
      </div>

      <!-- Add Button -->
      <button
        @click="handleAddWorkout"
        class="w-full py-4 bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold text-lg rounded-xl hover:from-red-700 hover:to-orange-600 focus:outline-none focus:ring-4 focus:ring-red-300 transition-all shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
      >
        Agregar Entrenamiento
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="!selectedExercise && searchInput.length < 2" class="text-center py-8">
      <span class="text-6xl mb-4 block">🏋️</span>
      <p class="text-gray-600 font-medium">Escribe para buscar ejercicios</p>
      <p class="text-sm text-gray-500 mt-2">Mínimo 2 caracteres</p>
    </div>
  </div>
</template>
