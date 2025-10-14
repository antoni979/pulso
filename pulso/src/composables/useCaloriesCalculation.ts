import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

/**
 * Composable para obtener los cálculos de calorías desde Supabase
 *
 * Usa las funciones SQL del servidor para:
 * - Calcular TMB (Harris-Benedict)
 * - Obtener calorías de pasos, ejercicio y termogénesis
 * - Calcular balance calórico (consumidas - quemadas)
 */

interface CalorieBalance {
  consumed: number
  tmb: number
  steps_calories: number
  workout_calories: number
  thermic_effect: number
  total_burned: number
  balance: number
  deficit_goal: number
}

export function useCaloriesCalculation() {
  const authStore = useAuthStore()

  const calorieData = ref<CalorieBalance>({
    consumed: 0,
    tmb: 0,
    steps_calories: 0,
    workout_calories: 0,
    thermic_effect: 0,
    total_burned: 0,
    balance: 0,
    deficit_goal: -500
  })

  const loading = ref(false)
  const error = ref<string | null>(null)

  // Fetch calorie balance from Supabase function
  const fetchCalorieBalance = async () => {
    if (!authStore.user) return

    loading.value = true
    error.value = null

    try {
      const { data, error: rpcError } = await supabase
        .rpc('get_today_calorie_balance', { p_user_id: authStore.user.id })

      if (rpcError) throw rpcError

      // La función retorna un array con un solo objeto
      if (data && data.length > 0) {
        calorieData.value = data[0]
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error fetching calorie balance'
      console.error('Error fetching calorie balance:', e)
    } finally {
      loading.value = false
    }
  }

  // Load on mount
  onMounted(() => {
    fetchCalorieBalance()
  })

  // Watch for auth changes
  watch(() => authStore.user, () => {
    if (authStore.user) {
      fetchCalorieBalance()
    }
  })

  return {
    // Componentes del gasto calórico (wrapped as computed for reactivity)
    userTMB: computed(() => calorieData.value.tmb),
    caloriesFromSteps: computed(() => calorieData.value.steps_calories),
    caloriesFromWorkouts: computed(() => calorieData.value.workout_calories),
    thermogenicEffect: computed(() => calorieData.value.thermic_effect),

    // Totales
    totalCaloriesBurned: computed(() => calorieData.value.total_burned),
    caloriesConsumed: computed(() => calorieData.value.consumed),
    netCalories: computed(() => calorieData.value.balance),
    deficitGoal: computed(() => calorieData.value.deficit_goal),

    // Estado
    loading,
    error,

    // Métodos
    refresh: fetchCalorieBalance
  }
}
