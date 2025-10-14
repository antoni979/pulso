import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, type Workout } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useWorkoutsStore = defineStore('workouts', () => {
  const workouts = ref<Workout[]>([])
  const loading = ref(false)

  // Get today's workouts
  const todayWorkouts = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return workouts.value.filter(workout => {
      const workoutDate = new Date(workout.workout_date)
      workoutDate.setHours(0, 0, 0, 0)
      return workoutDate.getTime() === today.getTime()
    })
  })

  // Today's total calories burned
  const todayTotalCaloriesBurned = computed(() => {
    return todayWorkouts.value.reduce(
      (total, workout) => total + workout.calories_burned,
      0
    )
  })

  // Load today's workouts
  async function loadTodayWorkouts() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    loading.value = true
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', authStore.user.id)
        .gte('workout_date', today.toISOString())
        .lt('workout_date', tomorrow.toISOString())
        .order('workout_date', { ascending: false })

      if (error) throw error
      workouts.value = data || []
    } catch (error) {
      console.error('Error loading workouts:', error)
    } finally {
      loading.value = false
    }
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
    loadTodayWorkouts,
    addWorkout,
    deleteWorkout
  }
})
