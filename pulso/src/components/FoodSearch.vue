<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { useFoodsStore } from '@/stores/foods'
import { useMealsStore } from '@/stores/meals'
import type { Food } from '@/lib/supabase'

const emit = defineEmits<{
  close: []
  saved: []
}>()

const foodsStore = useFoodsStore()
const mealsStore = useMealsStore()

// Estado del flujo
const step = ref<'search' | 'configure'>('search')

// Búsqueda
const searchInput = ref('')
const debounceTimeout = ref<number | null>(null)

// Alimento seleccionado
const selectedFood = ref<Food | null>(null)

// Configuración de la comida
const mealConfig = ref({
  meal_type: 'lunch' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
  grams: 100,
  name: '',
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0
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
  foodsStore.clearSearch()
})

// Función para resetear todo
const resetAll = () => {
  step.value = 'search'
  searchInput.value = ''
  selectedFood.value = null
  mealConfig.value = {
    meal_type: 'lunch',
    grams: 100,
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0
  }
  isSaving.value = false
  foodsStore.clearSearch()
  if (debounceTimeout.value) {
    clearTimeout(debounceTimeout.value)
    debounceTimeout.value = null
  }
}

// Watch search input con debounce
watch(searchInput, (newValue) => {
  if (debounceTimeout.value) {
    clearTimeout(debounceTimeout.value)
  }

  if (newValue.length >= 2) {
    debounceTimeout.value = setTimeout(() => {
      foodsStore.searchFoods(newValue)
    }, 300) as unknown as number
  } else {
    foodsStore.clearSearch()
  }
})

// Seleccionar alimento y pasar a configuración
const selectFood = (food: Food) => {
  selectedFood.value = food
  mealConfig.value.name = `${food.name} (${mealConfig.value.grams}g)`
  calculateNutrients()
  step.value = 'configure'
}

// Calcular nutrientes basados en gramos
const calculateNutrients = () => {
  if (!selectedFood.value) return

  const multiplier = mealConfig.value.grams / 100
  mealConfig.value.calories = Math.round(selectedFood.value.calories_per_100g * multiplier)
  mealConfig.value.protein = Math.round(selectedFood.value.protein_per_100g * multiplier)
  mealConfig.value.carbs = Math.round(selectedFood.value.carbs_per_100g * multiplier)
  mealConfig.value.fats = Math.round(selectedFood.value.fats_per_100g * multiplier)
  mealConfig.value.name = `${selectedFood.value.name} (${mealConfig.value.grams}g)`
}

// Watch gramos para recalcular
watch(() => mealConfig.value.grams, calculateNutrients)

// Volver a la búsqueda
const goBackToSearch = () => {
  step.value = 'search'
  selectedFood.value = null
  searchInput.value = ''
  mealConfig.value = {
    meal_type: 'lunch',
    grams: 100,
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0
  }
  foodsStore.clearSearch()
}

// Cerrar modal
const handleClose = () => {
  resetAll()
  emit('close')
}

// Guardar comida
const saveMeal = async () => {
  if (!selectedFood.value || mealConfig.value.grams <= 0) return

  isSaving.value = true
  try {
    await mealsStore.addMeal({
      name: mealConfig.value.name,
      meal_type: mealConfig.value.meal_type,
      calories: mealConfig.value.calories,
      protein: mealConfig.value.protein,
      carbs: mealConfig.value.carbs,
      fats: mealConfig.value.fats,
      eaten_at: new Date().toISOString()
    })
    emit('saved')
    emit('close')
  } catch (error) {
    console.error('Error al guardar comida:', error)
    alert('Error al guardar la comida')
  } finally {
    isSaving.value = false
  }
}

const getMealTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    breakfast: 'Desayuno',
    lunch: 'Almuerzo',
    dinner: 'Cena',
    snack: 'Snack'
  }
  return labels[type] || type
}

const getMealTypeEmoji = (type: string) => {
  const emojis: Record<string, string> = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍪'
  }
  return emojis[type] || '🍽️'
}
</script>

<template>
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="handleClose">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" @click.stop>
      <!-- Header -->
      <div class="bg-gradient-to-br from-primary-500 to-primary-600 text-white p-6 rounded-t-3xl sticky top-0 z-10">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-black">{{ step === 'search' ? 'Buscar Alimento' : 'Configurar Comida' }}</h2>
            <p class="text-primary-100 text-sm font-medium mt-1">
              {{ step === 'search' ? '¿Qué comiste hoy?' : 'Ajusta la cantidad y tipo de comida' }}
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
              placeholder="Busca un alimento (ej: pollo, arroz, plátano...)"
              class="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition font-medium text-lg"
              autofocus
              @focus="() => { if (searchInput.length >= 2) foodsStore.searchFoods(searchInput) }"
            />
          </div>

          <!-- Loading State -->
          <div v-if="foodsStore.loading" class="text-center py-12">
            <div class="inline-block w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-gray-600 mt-4 font-medium">Buscando alimentos...</p>
          </div>

          <!-- Search Results -->
          <div v-else-if="foodsStore.foods.length > 0" class="space-y-2">
            <p class="text-sm text-gray-600 font-semibold mb-3">{{ foodsStore.foods.length }} resultados encontrados:</p>
            <div class="max-h-96 overflow-y-auto space-y-2">
              <button
                v-for="food in foodsStore.foods"
                :key="food.id"
                @click="selectFood(food)"
                class="w-full text-left p-4 bg-gray-50 hover:bg-primary-50 border-2 border-gray-200 hover:border-primary-300 rounded-xl transition-all group"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <p class="font-bold text-gray-900 group-hover:text-primary-700 mb-1">{{ food.name }}</p>
                    <div class="flex flex-wrap gap-2 text-sm">
                      <span class="px-2 py-1 bg-red-100 text-red-700 rounded-md font-semibold">{{ food.calories_per_100g }} kcal</span>
                      <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-semibold">P: {{ food.protein_per_100g }}g</span>
                      <span class="px-2 py-1 bg-orange-100 text-orange-700 rounded-md font-semibold">C: {{ food.carbs_per_100g }}g</span>
                      <span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md font-semibold">G: {{ food.fats_per_100g }}g</span>
                      <span class="text-gray-400 text-xs self-center">(por 100g)</span>
                    </div>
                  </div>
                  <svg class="w-6 h-6 text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <!-- No Results -->
          <div v-else-if="searchInput.length >= 2 && !foodsStore.loading" class="text-center py-12">
            <span class="text-6xl mb-4 block">🔍</span>
            <p class="text-gray-700 font-bold text-lg">No se encontraron alimentos</p>
            <p class="text-gray-500 mt-2">Intenta con otro término de búsqueda</p>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-12">
            <span class="text-7xl mb-4 block">🥗</span>
            <p class="text-gray-700 font-bold text-lg">Busca un alimento</p>
            <p class="text-gray-500 mt-2">Escribe al menos 2 caracteres para buscar</p>
          </div>
        </div>

        <!-- STEP 2: Configuración -->
        <div v-if="step === 'configure' && selectedFood" class="space-y-6">
          <!-- Alimento seleccionado -->
          <div class="bg-primary-50 border-2 border-primary-200 rounded-xl p-4">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <p class="font-black text-xl text-gray-900 mb-2">{{ selectedFood.name }}</p>
                <div class="flex flex-wrap gap-2 text-sm">
                  <span class="px-2 py-1 bg-white border border-primary-300 text-gray-700 rounded-md font-semibold">
                    {{ selectedFood.calories_per_100g }} kcal/100g
                  </span>
                  <span class="px-2 py-1 bg-white border border-primary-300 text-gray-700 rounded-md font-semibold">
                    P: {{ selectedFood.protein_per_100g }}g
                  </span>
                  <span class="px-2 py-1 bg-white border border-primary-300 text-gray-700 rounded-md font-semibold">
                    C: {{ selectedFood.carbs_per_100g }}g
                  </span>
                  <span class="px-2 py-1 bg-white border border-primary-300 text-gray-700 rounded-md font-semibold">
                    G: {{ selectedFood.fats_per_100g }}g
                  </span>
                </div>
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

          <!-- Tipo de comida -->
          <div>
            <label class="block text-sm font-bold text-gray-800 mb-3">
              <span class="flex items-center space-x-2">
                <span>Tipo de comida</span>
                <span class="text-xl">{{ getMealTypeEmoji(mealConfig.meal_type) }}</span>
              </span>
            </label>
            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="type in ['breakfast', 'lunch', 'dinner', 'snack']"
                :key="type"
                @click="mealConfig.meal_type = type as any"
                :class="mealConfig.meal_type === type
                  ? 'bg-primary-500 text-white border-primary-600'
                  : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'"
                class="p-3 border-2 rounded-xl font-bold transition-all flex items-center justify-center space-x-2"
              >
                <span class="text-2xl">{{ getMealTypeEmoji(type) }}</span>
                <span>{{ getMealTypeLabel(type) }}</span>
              </button>
            </div>
          </div>

          <!-- Cantidad (gramos) -->
          <div>
            <label class="block text-sm font-bold text-gray-800 mb-3">
              Cantidad (gramos)
            </label>
            <input
              v-model.number="mealConfig.grams"
              type="number"
              min="1"
              step="1"
              class="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition font-bold text-3xl text-center"
            />
          </div>

          <!-- Información nutricional calculada -->
          <div class="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-5 border-2 border-primary-200">
            <p class="text-sm font-bold text-primary-800 mb-4 uppercase tracking-wide">
              Información nutricional total ({{ mealConfig.grams }}g):
            </p>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-white rounded-lg p-4 text-center shadow-sm">
                <p class="text-xs text-gray-600 font-semibold mb-1">Calorías</p>
                <p class="text-3xl font-black text-primary-600">{{ mealConfig.calories }}</p>
                <p class="text-xs text-gray-500">kcal</p>
              </div>
              <div class="bg-white rounded-lg p-4 text-center shadow-sm">
                <p class="text-xs text-gray-600 font-semibold mb-1">Proteína</p>
                <p class="text-3xl font-black text-blue-600">{{ mealConfig.protein }}</p>
                <p class="text-xs text-gray-500">gramos</p>
              </div>
              <div class="bg-white rounded-lg p-4 text-center shadow-sm">
                <p class="text-xs text-gray-600 font-semibold mb-1">Carbohidratos</p>
                <p class="text-3xl font-black text-orange-600">{{ mealConfig.carbs }}</p>
                <p class="text-xs text-gray-500">gramos</p>
              </div>
              <div class="bg-white rounded-lg p-4 text-center shadow-sm">
                <p class="text-xs text-gray-600 font-semibold mb-1">Grasas</p>
                <p class="text-3xl font-black text-yellow-600">{{ mealConfig.fats }}</p>
                <p class="text-xs text-gray-500">gramos</p>
              </div>
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
            @click="saveMeal"
            :disabled="isSaving || mealConfig.grams <= 0"
            class="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold rounded-xl hover:from-primary-700 hover:to-primary-600 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!isSaving">Guardar Comida</span>
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
