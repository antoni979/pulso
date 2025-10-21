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
    console.log('[STORE DEBUG 1] addMeal iniciado')
    console.log('[STORE DEBUG 2] meal recibido:', JSON.stringify(meal, null, 2))

    const authStore = useAuthStore()
    console.log('[STORE DEBUG 3] authStore.user:', authStore.user?.id || 'No user')

    if (!authStore.user) {
      console.error('[STORE ERROR] No user logged in')
      return { error: new Error('No user logged in') }
    }

    loading.value = true
    console.log('[STORE DEBUG 4] loading = true')

    try {
      // Redondear valores nutricionales a enteros antes de guardar
      // Esto previene errores cuando vienen decimales desde audio/foto/edición manual
      const mealToSave = {
        ...meal,
        calories: Math.round(meal.calories),
        protein: Math.round(meal.protein),
        carbs: Math.round(meal.carbs),
        fats: Math.round(meal.fats),
        user_id: authStore.user.id
      }

      console.log('[STORE DEBUG 5] mealToSave:', JSON.stringify(mealToSave, null, 2))
      console.log('[STORE DEBUG 6] Insertando en Supabase...')

      const { data, error } = await supabase
        .from('meals')
        .insert(mealToSave)
        .select()
        .single()

      console.log('[STORE DEBUG 7] Respuesta de Supabase - data:', data)
      console.log('[STORE DEBUG 8] Respuesta de Supabase - error:', error)

      if (error) {
        console.error('[STORE ERROR] Supabase retornó error:', error)
        throw error
      }

      console.log('[STORE DEBUG 9] Añadiendo a meals.value')
      meals.value.unshift(data)
      console.log('[STORE DEBUG 10] Retornando success')
      return { data, error: null }
    } catch (error) {
      console.error('[STORE ERROR] Excepción:', error)
      return { data: null, error: error as Error }
    } finally {
      console.log('[STORE DEBUG 11] loading = false')
      loading.value = false
    }
  }

  // Update meal
  async function updateMeal(id: string, updates: Partial<Meal>) {
    loading.value = true
    try {
      // Redondear valores nutricionales si están presentes
      const updatesToSave = { ...updates, updated_at: new Date().toISOString() }
      if (updatesToSave.calories !== undefined) updatesToSave.calories = Math.round(updatesToSave.calories)
      if (updatesToSave.protein !== undefined) updatesToSave.protein = Math.round(updatesToSave.protein)
      if (updatesToSave.carbs !== undefined) updatesToSave.carbs = Math.round(updatesToSave.carbs)
      if (updatesToSave.fats !== undefined) updatesToSave.fats = Math.round(updatesToSave.fats)

      const { data, error } = await supabase
        .from('meals')
        .update(updatesToSave)
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
