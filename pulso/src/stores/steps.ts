import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, type DailySteps } from '@/lib/supabase'
import { useAuthStore } from './auth'

const CALORIES_PER_1000_STEPS = 60

export const useStepsStore = defineStore('steps', () => {
  const authStore = useAuthStore()
  const todaySteps = ref<DailySteps | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed: calorías quemadas por pasos hoy
  const todayStepsCalories = computed(() => todaySteps.value?.calories_burned || 0)

  // Calcular calorías quemadas por pasos
  function calculateStepsCalories(steps: number): number {
    return Math.round((steps / 1000) * CALORIES_PER_1000_STEPS)
  }

  // Cargar pasos de hoy
  async function loadTodaySteps() {
    if (!authStore.user) return

    loading.value = true
    error.value = null

    try {
      const today = new Date().toISOString().split('T')[0]

      const { data, error: fetchError } = await supabase
        .from('daily_steps')
        .select('*')
        .eq('user_id', authStore.user.id)
        .eq('step_date', today)
        .maybeSingle()

      if (fetchError) throw fetchError

      todaySteps.value = data
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error loading steps'
      console.error('Error loading today steps:', e)
    } finally {
      loading.value = false
    }
  }

  // Actualizar o crear pasos de hoy
  async function updateTodaySteps(steps: number) {
    console.log('[DEBUG] updateTodaySteps called with steps:', steps)
    console.log('[DEBUG] authStore.user:', authStore.user?.id)

    if (!authStore.user) {
      console.log('[DEBUG] No user, returning early')
      return
    }

    loading.value = true
    error.value = null
    console.log('[DEBUG] Loading set to true')

    try {
      const today = new Date().toISOString().split('T')[0]
      const caloriesBurned = calculateStepsCalories(steps)
      console.log('[DEBUG] Today:', today, 'Calories:', caloriesBurned)
      console.log('[DEBUG] todaySteps.value exists:', !!todaySteps.value)

      // Si ya existe un registro de hoy, actualizarlo
      if (todaySteps.value) {
        console.log('[DEBUG] Updating existing record, id:', todaySteps.value.id)

        const { data, error: updateError } = await supabase
          .from('daily_steps')
          .update({
            steps_count: steps,
            calories_burned: caloriesBurned
          })
          .eq('id', todaySteps.value.id)
          .select()
          .single()

        console.log('[DEBUG] Update response - data:', data, 'error:', updateError)

        if (updateError) throw updateError
        todaySteps.value = data
        console.log('[DEBUG] Successfully updated')
      } else {
        console.log('[DEBUG] Inserting new record')

        const { data, error: insertError } = await supabase
          .from('daily_steps')
          .insert({
            user_id: authStore.user.id,
            steps_count: steps,
            calories_burned: caloriesBurned,
            step_date: today
          })
          .select()
          .single()

        console.log('[DEBUG] Insert response - data:', data, 'error:', insertError)

        if (insertError) throw insertError
        todaySteps.value = data
        console.log('[DEBUG] Successfully inserted')
      }
      console.log('[DEBUG] updateTodaySteps completed successfully')
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error updating steps'
      console.error('[ERROR] Error updating steps:', e)
      throw e
    } finally {
      console.log('[DEBUG] Setting loading to false')
      loading.value = false
    }
  }

  // Resetear el store
  function $reset() {
    todaySteps.value = null
    loading.value = false
    error.value = null
  }

  return {
    // State
    todaySteps,
    loading,
    error,

    // Computed
    todayStepsCalories,

    // Actions
    loadTodaySteps,
    updateTodaySteps,
    calculateStepsCalories,
    $reset
  }
})
