import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, type Meal } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useMealsStore = defineStore('meals', () => {
  const meals = ref<Meal[]>([])
  const loading = ref(false)

  // Get today's meals
  const todayMeals = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return meals.value.filter(meal => {
      const mealDate = new Date(meal.eaten_at)
      mealDate.setHours(0, 0, 0, 0)
      return mealDate.getTime() === today.getTime()
    })
  })

  // Today's totals
  const todayTotals = computed(() => {
    return todayMeals.value.reduce(
      (totals, meal) => ({
        calories: totals.calories + meal.calories,
        protein: totals.protein + meal.protein,
        carbs: totals.carbs + meal.carbs,
        fats: totals.fats + meal.fats
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    )
  })

  // Meals by type for today
  const mealsByType = computed(() => {
    return {
      breakfast: todayMeals.value.filter(m => m.meal_type === 'breakfast'),
      lunch: todayMeals.value.filter(m => m.meal_type === 'lunch'),
      dinner: todayMeals.value.filter(m => m.meal_type === 'dinner'),
      snack: todayMeals.value.filter(m => m.meal_type === 'snack')
    }
  })

  // Load today's meals
  async function loadTodayMeals() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    loading.value = true
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', authStore.user.id)
        .gte('eaten_at', today.toISOString())
        .lt('eaten_at', tomorrow.toISOString())
        .order('eaten_at', { ascending: false })

      if (error) throw error
      meals.value = data || []
    } catch (error) {
      console.error('Error loading meals:', error)
    } finally {
      loading.value = false
    }
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
    mealsByType,
    loadTodayMeals,
    addMeal,
    updateMeal,
    deleteMeal
  }
})
