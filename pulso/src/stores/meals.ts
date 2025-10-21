import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, type Meal } from '@/lib/supabase'
import { useAuthStore } from './auth'
import { useSelectedDate } from '@/composables/useSelectedDate'

export const useMealsStore = defineStore('meals', () => {
  const meals = ref<Meal[]>([])
  const loading = ref(false)

  // Los meals ya vienen filtrados por fecha desde loadMealsForDate
  // NO necesitamos filtrar en computed, usamos directamente lo que cargamos
  const selectedDateMeals = computed(() => meals.value)

  // Totals for selected date
  const selectedDateTotals = computed(() => {
    return meals.value.reduce(
      (totals, meal) => ({
        calories: totals.calories + meal.calories,
        protein: totals.protein + meal.protein,
        carbs: totals.carbs + meal.carbs,
        fats: totals.fats + meal.fats
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    )
  })

  // Meals by type for selected date
  const mealsByType = computed(() => {
    return {
      breakfast: meals.value.filter(m => m.meal_type === 'breakfast'),
      lunch: meals.value.filter(m => m.meal_type === 'lunch'),
      dinner: meals.value.filter(m => m.meal_type === 'dinner'),
      snack: meals.value.filter(m => m.meal_type === 'snack')
    }
  })

  // Backwards compatibility aliases
  const todayMeals = computed(() => selectedDateMeals.value)
  const todayTotals = computed(() => selectedDateTotals.value)

  // Load meals for selected date
  async function loadMealsForDate(date?: Date) {
    const authStore = useAuthStore()
    if (!authStore.user) return

    const { selectedDate } = useSelectedDate()
    const targetDate = date || selectedDate.value

    loading.value = true
    try {
      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(startOfDay)
      endOfDay.setDate(endOfDay.getDate() + 1)

      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', authStore.user.id)
        .gte('eaten_at', startOfDay.toISOString())
        .lt('eaten_at', endOfDay.toISOString())
        .order('eaten_at', { ascending: false })

      if (error) throw error
      meals.value = data || []
    } catch (error) {
      console.error('Error loading meals:', error)
    } finally {
      loading.value = false
    }
  }

  // Load today's meals (backwards compatibility)
  async function loadTodayMeals() {
    const { selectedDate } = useSelectedDate()
    await loadMealsForDate(selectedDate.value)
  }

  // Add meal
  async function addMeal(meal: Omit<Meal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const authStore = useAuthStore()
    if (!authStore.user) return { error: new Error('No user logged in') }

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('meals')
        .insert({
          ...meal,
          user_id: authStore.user.id
        })
        .select()
        .single()

      if (error) throw error

      meals.value.unshift(data)
      return { data, error: null }
    } catch (error) {
      console.error('Error adding meal:', error)
      return { data: null, error: error as Error }
    } finally {
      loading.value = false
    }
  }

  // Update meal
  async function updateMeal(id: string, updates: Partial<Meal>) {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('meals')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const index = meals.value.findIndex(m => m.id === id)
      if (index !== -1) {
        meals.value[index] = data
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error updating meal:', error)
      return { data: null, error: error as Error }
    } finally {
      loading.value = false
    }
  }

  // Delete meal
  async function deleteMeal(id: string) {
    loading.value = true
    try {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', id)

      if (error) throw error

      meals.value = meals.value.filter(m => m.id !== id)
      return { error: null }
    } catch (error) {
      console.error('Error deleting meal:', error)
      return { error: error as Error }
    } finally {
      loading.value = false
    }
  }

  return {
    meals,
    loading,
    todayMeals,
    todayTotals,
    selectedDateMeals,
    selectedDateTotals,
    mealsByType,
    loadTodayMeals,
    loadMealsForDate,
    addMeal,
    updateMeal,
    deleteMeal
  }
})
