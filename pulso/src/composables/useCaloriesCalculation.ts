import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMealsStore } from '@/stores/meals'
import { useWorkoutsStore } from '@/stores/workouts'
import { useStepsStore } from '@/stores/steps'

/**
 * Composable para calcular el balance calórico usando datos de los stores
 *
 * Calcula en tiempo real basándose en:
 * - Comidas consumidas (del store de meals)
 * - Ejercicios realizados (del store de workouts)
 * - Pasos caminados (del store de steps)
 * - TMB y objetivo de déficit (del perfil del usuario)
 */

export function useCaloriesCalculation() {
  const authStore = useAuthStore()
  const mealsStore = useMealsStore()
  const workoutsStore = useWorkoutsStore()
  const stepsStore = useStepsStore()

  // Calcular TMB usando Harris-Benedict
  const userTMB = computed(() => {
    const profile = authStore.profile
    if (!profile || !profile.current_weight || !profile.height || !profile.birth_date) {
      return 1800 // Valor por defecto
    }

    const weight = Number(profile.current_weight)
    const height = profile.height
    const birthDate = new Date(profile.birth_date)
    const age = new Date().getFullYear() - birthDate.getFullYear()

    // Fórmula Harris-Benedict
    let tmb = 0
    if (profile.sex === 'male') {
      tmb = 10 * weight + 6.25 * height - 5 * age + 5
    } else if (profile.sex === 'female') {
      tmb = 10 * weight + 6.25 * height - 5 * age - 161
    } else {
      tmb = 10 * weight + 6.25 * height - 5 * age - 78 // Promedio
    }

    // Aplicar factor de actividad
    const activityFactors: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    }
    const factor = activityFactors[profile.activity_level || 'moderate'] || 1.55

    return Math.round(tmb * factor)
  })

  // Calorías de pasos
  const caloriesFromSteps = computed(() => stepsStore.selectedDateStepsCalories)

  // Calorías de ejercicio
  const caloriesFromWorkouts = computed(() => workoutsStore.selectedDateTotalCaloriesBurned)

  // Efecto termogénico (10% de calorías consumidas)
  const thermogenicEffect = computed(() => {
    return Math.round(mealsStore.selectedDateTotals.calories * 0.1)
  })

  // Total de calorías quemadas
  const totalCaloriesBurned = computed(() => {
    return userTMB.value + caloriesFromSteps.value + caloriesFromWorkouts.value + thermogenicEffect.value
  })

  // Calorías consumidas
  const caloriesConsumed = computed(() => mealsStore.selectedDateTotals.calories)

  // Balance neto (positivo = superávit, negativo = déficit)
  const netCalories = computed(() => caloriesConsumed.value - totalCaloriesBurned.value)

  // Objetivo de déficit
  const deficitGoal = computed(() => authStore.profile?.caloric_deficit_goal || -500)

  // Función dummy para compatibilidad
  const refresh = () => {
    // No hace nada, los computed son reactivos automáticamente
  }

  return {
    // Componentes del gasto calórico
    userTMB,
    caloriesFromSteps,
    caloriesFromWorkouts,
    thermogenicEffect,

    // Totales
    totalCaloriesBurned,
    caloriesConsumed,
    netCalories,
    deficitGoal,

    // Métodos
    refresh
  }
}
