<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMealsStore } from '@/stores/meals'
import { useWorkoutsStore } from '@/stores/workouts'
import { useStepsStore } from '@/stores/steps'
import { useCaloriesCalculation } from '@/composables/useCaloriesCalculation'
import { useWeeklyBalance } from '@/composables/useWeeklyBalance'
import { useRouter } from 'vue-router'
import FoodSearch from '@/components/FoodSearch.vue'
import WorkoutSearch from '@/components/WorkoutSearch.vue'
import StepsInput from '@/components/StepsInput.vue'
import type { Food, Exercise } from '@/lib/supabase'

const authStore = useAuthStore()
const mealsStore = useMealsStore()
const workoutsStore = useWorkoutsStore()
const stepsStore = useStepsStore()
const router = useRouter()

const caloriesCalc = useCaloriesCalculation()
const weeklyBalance = useWeeklyBalance()

const showAddMeal = ref(false)
const showFoodSearch = ref(false)
const showWorkoutSearch = ref(false)
const showStepsInput = ref(false)
const activeTab = ref<'stats' | 'macros' | 'history'>('stats')

const mealForm = ref({
  name: '',
  meal_type: 'lunch' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0,
  eaten_at: new Date().toISOString()
})

const workoutForm = ref({
  exercise_name: '',
  duration_minutes: 0,
  calories_burned: 0,
  workout_date: new Date().toISOString(),
  notes: null as string | null
})

// KPIs computados
const weeklyAverage = computed(() => {
  if (weeklyBalance.weeklyData.value.length === 0) return 0
  const sum = weeklyBalance.weeklyData.value.reduce((acc, day) => acc + day.balance, 0)
  return Math.round(sum / weeklyBalance.weeklyData.value.length)
})

const daysOnTrack = computed(() => {
  return weeklyBalance.weeklyData.value.filter(day => {
    const goal = day.deficit_goal
    if (goal < 0) return day.balance <= goal
    else return day.balance >= goal
  }).length
})

const maxHeight = computed(() => {
  if (weeklyBalance.weeklyData.value.length === 0) return 100
  const balances = weeklyBalance.weeklyData.value.map(d => Math.abs(d.balance))
  return Math.max(...balances, 100)
})

onMounted(async () => {
  await Promise.all([
    mealsStore.loadTodayMeals(),
    workoutsStore.loadTodayWorkouts(),
    stepsStore.loadTodaySteps()
  ])
})

const handleSignOut = async () => {
  await authStore.signOut()
  router.push('/auth')
}

const handleFoodSelected = (food: Food, grams: number) => {
  const multiplier = grams / 100
  mealForm.value.name = `${food.name} (${grams}g)`
  mealForm.value.calories = Math.round(food.calories_per_100g * multiplier)
  mealForm.value.protein = Math.round(food.protein_per_100g * multiplier)
  mealForm.value.carbs = Math.round(food.carbs_per_100g * multiplier)
  mealForm.value.fats = Math.round(food.fats_per_100g * multiplier)
  showFoodSearch.value = false
  showAddMeal.value = true
}

const handleWorkoutSelected = async (exercise: Exercise, duration: number, caloriesBurned: number) => {
  workoutForm.value.exercise_name = exercise.name
  workoutForm.value.duration_minutes = duration
  workoutForm.value.calories_burned = caloriesBurned
  workoutForm.value.workout_date = new Date().toISOString()
  await workoutsStore.addWorkout(workoutForm.value)
  caloriesCalc.refresh()
  weeklyBalance.refresh()
  workoutForm.value = {
    exercise_name: '',
    duration_minutes: 0,
    calories_burned: 0,
    workout_date: new Date().toISOString(),
    notes: null
  }
  showWorkoutSearch.value = false
}

const handleAddMeal = async () => {
  if (!mealForm.value.name || mealForm.value.calories <= 0) {
    alert('Por favor completa los campos requeridos')
    return
  }
  await mealsStore.addMeal(mealForm.value)
  caloriesCalc.refresh()
  weeklyBalance.refresh()
  mealForm.value = {
    name: '',
    meal_type: 'lunch',
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    eaten_at: new Date().toISOString()
  }
  showAddMeal.value = false
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

const getMealTypeName = (type: string) => {
  const names: Record<string, string> = {
    breakfast: 'Desayuno',
    lunch: 'Almuerzo',
    dinner: 'Cena',
    snack: 'Snack'
  }
  return names[type] || type
}

const openFoodSearch = () => {
  showAddMeal.value = false
  showAddWorkout.value = false
  showWorkoutSearch.value = false
  showStepsInput.value = false
  showFoodSearch.value = true
}

const openWorkoutSearch = () => {
  showAddMeal.value = false
  showFoodSearch.value = false
  showAddWorkout.value = false
  showStepsInput.value = false
  showWorkoutSearch.value = true
}

const openStepsInput = () => {
  showAddMeal.value = false
  showFoodSearch.value = false
  showAddWorkout.value = false
  showWorkoutSearch.value = false
  showStepsInput.value = true
}

const handleStepsSaved = () => {
  caloriesCalc.refresh()
  weeklyBalance.refresh()
  showStepsInput.value = false
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/30 to-white">
    <!-- Header -->
    <header class="bg-white/90 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-20 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow">
              <span class="text-xl">🥗</span>
            </div>
            <div>
              <h1 class="text-xl font-black text-gray-900">Pulso</h1>
              <p class="text-xs text-gray-600">{{ authStore.profile?.full_name || 'Usuario' }}</p>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <button @click="router.push('/profile')" class="p-2 text-gray-700 hover:bg-primary-50 rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            <button @click="handleSignOut" class="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-4 pb-24">
      <!-- Action Buttons (Lo primero!) -->
      <div class="mb-6">
        <h2 class="text-lg font-bold text-gray-900 mb-3">Registrar</h2>
        <div class="grid grid-cols-3 gap-3">
          <button @click="openFoodSearch" class="bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all active:scale-95">
            <div class="text-3xl mb-1">🍽️</div>
            <div class="text-xs font-bold">Comida</div>
          </button>
          <button @click="openWorkoutSearch" class="bg-gradient-to-br from-red-500 to-orange-600 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all active:scale-95">
            <div class="text-3xl mb-1">🏋️</div>
            <div class="text-xs font-bold">Ejercicio</div>
          </button>
          <button @click="openStepsInput" class="bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all active:scale-95">
            <div class="text-3xl mb-1">👟</div>
            <div class="text-xs font-bold">Pasos</div>
            <div class="text-xs mt-1">{{stepsStore.todaySteps?.steps_count || 0}}</div>
          </button>
        </div>
      </div>

      <!-- Balance del Día (Resumen compacto) -->
      <div class="bg-white rounded-xl shadow-lg p-4 mb-6 border border-gray-200">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-bold text-gray-700 uppercase">Balance de Hoy</h3>
          <span class="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-bold">
            Obj: {{ caloriesCalc.deficitGoal }} kcal
          </span>
        </div>
        <div class="grid grid-cols-3 gap-2 text-center">
          <div>
            <p class="text-xs text-gray-600 mb-1">Consumidas</p>
            <p class="text-2xl font-black text-primary-700">{{ caloriesCalc.caloriesConsumed }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-600 mb-1">Quemadas</p>
            <p class="text-2xl font-black text-red-700">{{ caloriesCalc.totalCaloriesBurned }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-600 mb-1">Balance</p>
            <p :class="caloriesCalc.netCalories < 0 ? 'text-green-700' : 'text-orange-700'" class="text-2xl font-black">
              {{ caloriesCalc.netCalories }}
            </p>
          </div>
        </div>
      </div>

      <!-- Tabs para las secciones -->
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
        <!-- Tab Headers -->
        <div class="flex border-b border-gray-200">
          <button
            @click="activeTab = 'stats'"
            :class="activeTab === 'stats' ? 'border-b-2 border-primary-600 text-primary-700' : 'text-gray-600'"
            class="flex-1 px-4 py-3 text-sm font-bold transition-colors"
          >
            📊 Estadísticas
          </button>
          <button
            @click="activeTab = 'macros'"
            :class="activeTab === 'macros' ? 'border-b-2 border-primary-600 text-primary-700' : 'text-gray-600'"
            class="flex-1 px-4 py-3 text-sm font-bold transition-colors"
          >
            💪 Macros
          </button>
          <button
            @click="activeTab = 'history'"
            :class="activeTab === 'history' ? 'border-b-2 border-primary-600 text-primary-700' : 'text-gray-600'"
            class="flex-1 px-4 py-3 text-sm font-bold transition-colors"
          >
            📋 Historial
          </button>
        </div>

        <!-- Tab Content -->
        <div class="p-4">
          <!-- Estadísticas Tab -->
          <div v-if="activeTab === 'stats'" class="space-y-4">
            <!-- KPIs -->
            <div class="grid grid-cols-3 gap-2">
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <p class="text-xs text-gray-700 mb-1 font-semibold">Promedio</p>
                <p :class="weeklyAverage < 0 ? 'text-green-700' : 'text-orange-700'" class="text-2xl font-black">{{ weeklyAverage }}</p>
              </div>
              <div class="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <p class="text-xs text-gray-700 mb-1 font-semibold">En Meta</p>
                <p class="text-2xl font-black text-green-700">{{ daysOnTrack }}/7</p>
              </div>
              <div class="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                <p class="text-xs text-gray-700 mb-1 font-semibold">Tendencia</p>
                <p :class="weeklyAverage < 0 ? 'text-green-700' : 'text-orange-700'" class="text-2xl font-black">
                  {{ weeklyAverage < 0 ? '↓' : '↑' }}
                </p>
              </div>
            </div>

            <!-- Gráfica -->
            <div class="bg-gray-50 rounded-lg p-3">
              <h4 class="text-xs font-bold text-gray-700 uppercase mb-3">Últimos 7 días</h4>
              <div v-if="weeklyBalance.loading.value" class="flex justify-center py-8">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>
              <div v-else-if="weeklyBalance.weeklyData.value.length === 0" class="text-center py-8 text-gray-500 text-sm">
                No hay datos
              </div>
              <div v-else class="space-y-2">
                <div v-for="day in weeklyBalance.weeklyData.value" :key="day.date" class="flex items-center space-x-2">
                  <div class="w-12 text-xs font-bold text-gray-600">
                    {{ new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short' }) }}
                  </div>
                  <div class="flex-1 relative h-6 bg-gray-200 rounded overflow-hidden">
                    <div class="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-400 z-10"></div>
                    <div
                      :class="day.balance < 0 ? 'bg-green-500' : 'bg-orange-500'"
                      :style="{
                        width: Math.min((Math.abs(day.balance) / maxHeight) * 50, 50) + '%',
                        marginLeft: day.balance < 0 ? (50 - Math.min((Math.abs(day.balance) / maxHeight) * 50, 50)) + '%' : '50%'
                      }"
                      class="h-full flex items-center justify-center"
                    >
                      <span class="text-xs font-bold text-white">{{ day.balance }}</span>
                    </div>
                  </div>
                  <div class="w-6 text-xs font-semibold text-right" :class="
                    (day.deficit_goal < 0 && day.balance <= day.deficit_goal) ||
                    (day.deficit_goal >= 0 && day.balance >= day.deficit_goal) ? 'text-green-600' : 'text-gray-400'
                  ">
                    {{ (day.deficit_goal < 0 && day.balance <= day.deficit_goal) ||
                       (day.deficit_goal >= 0 && day.balance >= day.deficit_goal) ? '✓' : '○' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Macros Tab -->
          <div v-if="activeTab === 'macros'" class="space-y-3">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-bold text-gray-700">Proteína 💪</span>
                <span class="text-lg font-black text-blue-700">{{ mealsStore.todayTotals.protein }}g</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-blue-600 h-2 rounded-full" :style="{ width: Math.min((mealsStore.todayTotals.protein / (authStore.profile?.protein_goal || 150)) * 100, 100) + '%' }"></div>
              </div>
            </div>
            <div class="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-bold text-gray-700">Carbohidratos 🍞</span>
                <span class="text-lg font-black text-orange-700">{{ mealsStore.todayTotals.carbs }}g</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-orange-600 h-2 rounded-full" :style="{ width: Math.min((mealsStore.todayTotals.carbs / (authStore.profile?.carbs_goal || 200)) * 100, 100) + '%' }"></div>
              </div>
            </div>
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-bold text-gray-700">Grasas 🥑</span>
                <span class="text-lg font-black text-yellow-700">{{ mealsStore.todayTotals.fats }}g</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-yellow-600 h-2 rounded-full" :style="{ width: Math.min((mealsStore.todayTotals.fats / (authStore.profile?.fats_goal || 65)) * 100, 100) + '%' }"></div>
              </div>
            </div>
          </div>

          <!-- Historial Tab -->
          <div v-if="activeTab === 'history'" class="space-y-4">
            <!-- Comidas -->
            <div>
              <h4 class="text-sm font-bold text-gray-700 mb-2">Comidas de hoy</h4>
              <div v-if="mealsStore.todayMeals.length === 0" class="text-center py-8 text-gray-500 text-sm">
                No hay comidas registradas
              </div>
              <div v-else class="space-y-2">
                <div v-for="meal in mealsStore.todayMeals" :key="meal.id" class="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <span class="text-2xl">{{ getMealTypeEmoji(meal.meal_type) }}</span>
                    <div>
                      <p class="font-bold text-sm text-gray-900">{{ meal.name }}</p>
                      <p class="text-xs text-gray-600">{{ meal.calories }} kcal • {{ meal.protein }}g P • {{ meal.carbs }}g C • {{ meal.fats }}g G</p>
                    </div>
                  </div>
                  <button @click="mealsStore.deleteMeal(meal.id)" class="text-red-500 text-sm font-bold">×</button>
                </div>
              </div>
            </div>

            <!-- Ejercicios -->
            <div>
              <h4 class="text-sm font-bold text-gray-700 mb-2">Entrenamientos de hoy</h4>
              <div v-if="workoutsStore.todayWorkouts.length === 0" class="text-center py-8 text-gray-500 text-sm">
                No hay entrenamientos registrados
              </div>
              <div v-else class="space-y-2">
                <div v-for="workout in workoutsStore.todayWorkouts" :key="workout.id" class="bg-red-50 rounded-lg p-3 flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <span class="text-2xl">🔥</span>
                    <div>
                      <p class="font-bold text-sm text-gray-900">{{ workout.exercise_name }}</p>
                      <p class="text-xs text-gray-600">{{ workout.duration_minutes }} min • {{ workout.calories_burned }} kcal</p>
                    </div>
                  </div>
                  <button @click="workoutsStore.deleteWorkout(workout.id)" class="text-red-500 text-sm font-bold">×</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modals -->
    <FoodSearch v-if="showFoodSearch" @select-food="handleFoodSelected" @close="showFoodSearch = false" />
    <WorkoutSearch v-if="showWorkoutSearch" @select-exercise="handleWorkoutSelected" @close="showWorkoutSearch = false" />
    <StepsInput v-if="showStepsInput" @saved="handleStepsSaved" @close="showStepsInput = false" />

    <!-- Add Meal Form (Manual) -->
    <div v-if="showAddMeal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Nueva comida</h3>
        <form @submit.prevent="handleAddMeal" class="space-y-4">
          <div>
            <label class="block text-sm font-bold text-gray-800 mb-1">Nombre</label>
            <input v-model="mealForm.name" type="text" class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg" required />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-bold text-gray-800 mb-1">Tipo</label>
              <select v-model="mealForm.meal_type" class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg">
                <option value="breakfast">Desayuno</option>
                <option value="lunch">Almuerzo</option>
                <option value="dinner">Cena</option>
                <option value="snack">Snack</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-800 mb-1">Calorías</label>
              <input v-model.number="mealForm.calories" type="number" min="0" class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg" required />
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-xs font-bold text-gray-800 mb-1">Proteína (g)</label>
              <input v-model.number="mealForm.protein" type="number" min="0" class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg" />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-800 mb-1">Carbs (g)</label>
              <input v-model.number="mealForm.carbs" type="number" min="0" class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg" />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-800 mb-1">Grasas (g)</label>
              <input v-model.number="mealForm.fats" type="number" min="0" class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg" />
            </div>
          </div>
          <div class="flex space-x-3">
            <button type="submit" class="flex-1 px-4 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700">Guardar</button>
            <button type="button" @click="showAddMeal = false" class="px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
