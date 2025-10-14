<script setup lang="ts">
import { ref, watch } from 'vue'
import { useFoodsStore } from '@/stores/foods'
import type { Food } from '@/lib/supabase'

const emit = defineEmits<{
  selectFood: [food: Food, grams: number]
  close: []
}>()

const foodsStore = useFoodsStore()
const searchInput = ref('')
const selectedFood = ref<Food | null>(null)
const grams = ref(100)
const debounceTimeout = ref<number | null>(null)

// Watch search input with debounce
watch(searchInput, (newValue) => {
  if (debounceTimeout.value) {
    clearTimeout(debounceTimeout.value)
  }

  debounceTimeout.value = setTimeout(() => {
    if (newValue.length >= 2) {
      foodsStore.searchFoods(newValue)
    } else {
      foodsStore.clearSearch()
    }
  }, 300) as unknown as number
})

const selectFood = (food: Food) => {
  selectedFood.value = food
  searchInput.value = food.name
  foodsStore.clearSearch()
}

const calculateNutrients = (food: Food, grams: number) => {
  const multiplier = grams / 100
  return {
    calories: Math.round(food.calories_per_100g * multiplier),
    protein: Math.round(food.protein_per_100g * multiplier),
    carbs: Math.round(food.carbs_per_100g * multiplier),
    fats: Math.round(food.fats_per_100g * multiplier)
  }
}

const handleAddFood = () => {
  if (selectedFood.value && grams.value > 0) {
    emit('selectFood', selectedFood.value, grams.value)
    // Reset
    selectedFood.value = null
    searchInput.value = ''
    grams.value = 100
  }
}

const nutrients = ref({ calories: 0, protein: 0, carbs: 0, fats: 0 })

watch([selectedFood, grams], () => {
  if (selectedFood.value) {
    nutrients.value = calculateNutrients(selectedFood.value, grams.value)
  }
})
</script>

<template>
  <div class="bg-white rounded-2xl shadow-xl p-6 border-2 border-primary-100">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-2xl font-bold text-gray-900">Buscar alimento</h3>
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
        placeholder="Busca un alimento (ej: pollo, arroz, plátano...)"
        class="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition font-medium text-lg"
        @focus="() => { if (searchInput.length >= 2) foodsStore.searchFoods(searchInput) }"
      />
    </div>

    <!-- Loading State -->
    <div v-if="foodsStore.loading" class="text-center py-8">
      <div class="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-gray-600 mt-2">Buscando...</p>
    </div>

    <!-- Search Results -->
    <div v-else-if="foodsStore.foods.length > 0 && !selectedFood" class="max-h-64 overflow-y-auto space-y-2 mb-4">
      <button
        v-for="food in foodsStore.foods"
        :key="food.id"
        @click="selectFood(food)"
        class="w-full text-left p-4 bg-gray-50 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 rounded-xl transition-all group"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="font-semibold text-gray-900 group-hover:text-primary-700">{{ food.name }}</p>
            <p class="text-sm text-gray-600 mt-1">
              {{ food.calories_per_100g }} kcal •
              P: {{ food.protein_per_100g }}g •
              C: {{ food.carbs_per_100g }}g •
              G: {{ food.fats_per_100g }}g
              <span class="text-gray-400">(por 100g)</span>
            </p>
          </div>
          <svg class="w-5 h-5 text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
    </div>

    <!-- No Results -->
    <div v-else-if="searchInput.length >= 2 && foodsStore.foods.length === 0 && !foodsStore.loading && !selectedFood" class="text-center py-8">
      <span class="text-5xl mb-3 block">🔍</span>
      <p class="text-gray-600">No se encontraron alimentos</p>
      <p class="text-sm text-gray-500 mt-1">Intenta con otro término de búsqueda</p>
    </div>

    <!-- Selected Food - Configure Quantity -->
    <div v-if="selectedFood" class="space-y-6">
      <!-- Selected Food Info -->
      <div class="bg-primary-50 border-2 border-primary-200 rounded-xl p-4">
        <div class="flex items-start justify-between mb-3">
          <div>
            <p class="font-bold text-lg text-gray-900">{{ selectedFood.name }}</p>
            <p class="text-sm text-gray-600">Por 100g: {{ selectedFood.calories_per_100g }} kcal</p>
          </div>
          <button
            @click="() => { selectedFood = null; searchInput = '' }"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Quantity Input -->
      <div>
        <label class="block text-sm font-semibold text-gray-800 mb-3">
          Cantidad (gramos)
        </label>
        <input
          v-model.number="grams"
          type="number"
          min="1"
          step="1"
          class="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition font-bold text-2xl text-center"
        />
      </div>

      <!-- Calculated Nutrients -->
      <div class="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-5 border-2 border-primary-200">
        <p class="text-sm font-semibold text-primary-800 mb-3">Información nutricional para {{ grams }}g:</p>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-white rounded-lg p-3 text-center">
            <p class="text-sm text-gray-600">Calorías</p>
            <p class="text-2xl font-bold text-primary-600">{{ nutrients.calories }}</p>
          </div>
          <div class="bg-white rounded-lg p-3 text-center">
            <p class="text-sm text-gray-600">Proteína</p>
            <p class="text-2xl font-bold text-blue-600">{{ nutrients.protein }}g</p>
          </div>
          <div class="bg-white rounded-lg p-3 text-center">
            <p class="text-sm text-gray-600">Carbohidratos</p>
            <p class="text-2xl font-bold text-orange-600">{{ nutrients.carbs }}g</p>
          </div>
          <div class="bg-white rounded-lg p-3 text-center">
            <p class="text-sm text-gray-600">Grasas</p>
            <p class="text-2xl font-bold text-yellow-600">{{ nutrients.fats }}g</p>
          </div>
        </div>
      </div>

      <!-- Add Button -->
      <button
        @click="handleAddFood"
        class="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold text-lg rounded-xl hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-4 focus:ring-primary-300 transition-all shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
      >
        Agregar alimento
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="!selectedFood && searchInput.length < 2" class="text-center py-8">
      <span class="text-6xl mb-4 block">🥗</span>
      <p class="text-gray-600 font-medium">Escribe para buscar alimentos</p>
      <p class="text-sm text-gray-500 mt-2">Mínimo 2 caracteres</p>
    </div>
  </div>
</template>
