import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, type Workout } from '@/lib/supabase'
import { useAuthStore } from './auth'
import { useSelectedDate } from '@/composables/useSelectedDate'

export const useWorkoutsStore = defineStore('workouts', () => {
  const workouts = ref<Workout[]>([])
  const loading = ref(false)

  // Los workouts ya vienen filtrados por fecha desde loadWorkoutsForDate
  const selectedDateWorkouts = computed(() => workouts.value)

  // Total calories burned for selected date
  const selectedDateTotalCaloriesBurned = computed(() => {
    return workouts.value.reduce(
      (total, workout) => total + workout.calories_burned,
      0
    )
  })

  // Backwards compatibility aliases
  const todayWorkouts = computed(() => selectedDateWorkouts.value)
  const todayTotalCaloriesBurned = computed(() => selectedDateTotalCaloriesBurned.value)

  // Load workouts for specific date
  async function loadWorkoutsForDate(date?: Date) {
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
        .from('workouts')
        .select('*')
        .eq('user_id', authStore.user.id)
        .gte('workout_date', startOfDay.toISOString())
        .lt('workout_date', endOfDay.toISOString())
        .order('workout_date', { ascending: false })

      if (error) throw error
      workouts.value = data || []
    } catch (error) {
      console.error('Error loading workouts:', error)
    } finally {
      loading.value = false
    }
  }

  // Load today's workouts (backwards compatibility)
  async function loadTodayWorkouts() {
    const { selectedDate } = useSelectedDate()
    await loadWorkoutsForDate(selectedDate.value)
  }

  // Add workout
  async function addWorkout(workout: Omit<Workout, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const authStore = useAuthStore()
    if (!authStore.user) return { error: new Error('No user logged in') }

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('workouts')
        .insert({
          ...workout,
          user_id: authStore.user.id
        })
        .select()
        .single()

      if (error) throw error

      workouts.value.unshift(data)
      return { data, error: null }
    } catch (error) {
      console.error('Error adding workout:', error)
      return { data: null, error: error as Error }
    } finally {
      loading.value = false
    }
  }

  // Delete workout
  async function deleteWorkout(id: string) {
    loading.value = true
    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', id)

      if (error) throw error

      workouts.value = workouts.value.filter(w => w.id !== id)
      return { error: null }
    } catch (error) {
      console.error('Error deleting workout:', error)
      return { error: error as Error }
    } finally {
      loading.value = false
    }
  }

  return {
    workouts,
    loading,
    todayWorkouts,
    todayTotalCaloriesBurned,
    selectedDateWorkouts,
    selectedDateTotalCaloriesBurned,
    loadTodayWorkouts,
    loadWorkoutsForDate,
    addWorkout,
    deleteWorkout
  }
})
