import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, type DailySteps } from '@/lib/supabase'
import { useAuthStore } from './auth'
import { useSelectedDate } from '@/composables/useSelectedDate'

const CALORIES_PER_1000_STEPS = 60

export const useStepsStore = defineStore('steps', () => {
  const authStore = useAuthStore()

  const selectedDateSteps = ref<DailySteps | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Backwards compatibility alias
  const todaySteps = computed(() => selectedDateSteps.value)

  // Computed: calorías quemadas por pasos en fecha seleccionada
  const selectedDateStepsCalories = computed(() => selectedDateSteps.value?.calories_burned || 0)
  const todayStepsCalories = computed(() => selectedDateStepsCalories.value)

  // Calcular calorías quemadas por pasos
  function calculateStepsCalories(steps: number): number {
    return Math.round((steps / 1000) * CALORIES_PER_1000_STEPS)
  }

  // Cargar pasos de fecha específica
  async function loadStepsForDate(date?: Date) {
    if (!authStore.user) return

    const { selectedDate } = useSelectedDate()
    const targetDate = date || selectedDate.value

    loading.value = true
    error.value = null

    try {
      // Formato seguro de fecha: YYYY-MM-DD en zona horaria local (sin conversión UTC)
      const year = targetDate.getFullYear()
      const month = String(targetDate.getMonth() + 1).padStart(2, '0')
      const day = String(targetDate.getDate()).padStart(2, '0')
      const dateString = `${year}-${month}-${day}`

      console.log('[DEBUG] Loading steps for date:', dateString, 'user:', authStore.user.id)

      const { data, error: fetchError } = await supabase
        .from('daily_steps')
        .select('*')
        .eq('user_id', authStore.user.id)
        .eq('step_date', dateString)
        .maybeSingle()

      console.log('[DEBUG] Steps query result - data:', data, 'error:', fetchError)

      if (fetchError) throw fetchError

      selectedDateSteps.value = data
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error loading steps'
      console.error('Error loading steps:', e)
    } finally {
      loading.value = false
    }
  }

  // Cargar pasos de hoy (backwards compatibility)
  async function loadTodaySteps() {
    const { selectedDate } = useSelectedDate()
    await loadStepsForDate(selectedDate.value)
  }

  // Actualizar o crear pasos de la fecha seleccionada
  async function updateStepsForDate(steps: number, date?: Date) {
    console.log('[DEBUG] updateStepsForDate called with steps:', steps)
    console.log('[DEBUG] authStore.user:', authStore.user?.id)

    if (!authStore.user) {
      console.log('[DEBUG] No user, returning early')
      return
    }

    const { selectedDate } = useSelectedDate()
    const targetDate = date || selectedDate.value

    loading.value = true
    error.value = null
    console.log('[DEBUG] Loading set to true')

    try {
      // Formato seguro de fecha: YYYY-MM-DD en zona horaria local
      const year = targetDate.getFullYear()
      const month = String(targetDate.getMonth() + 1).padStart(2, '0')
      const day = String(targetDate.getDate()).padStart(2, '0')
      const dateString = `${year}-${month}-${day}`

      const caloriesBurned = calculateStepsCalories(steps)
      console.log('[DEBUG] Date:', dateString, 'Calories:', caloriesBurned)
      console.log('[DEBUG] selectedDateSteps.value exists:', !!selectedDateSteps.value)

      // Si ya existe un registro para esta fecha, actualizarlo
      if (selectedDateSteps.value) {
        console.log('[DEBUG] Updating existing record, id:', selectedDateSteps.value.id)

        const { data, error: updateError } = await supabase
          .from('daily_steps')
          .update({
            steps_count: steps,
            calories_burned: caloriesBurned
          })
          .eq('id', selectedDateSteps.value.id)
          .select()
          .single()

        console.log('[DEBUG] Update response - data:', data, 'error:', updateError)

        if (updateError) throw updateError
        selectedDateSteps.value = data
        console.log('[DEBUG] Successfully updated')
      } else {
        console.log('[DEBUG] Inserting new record')

        const { data, error: insertError } = await supabase
          .from('daily_steps')
          .insert({
            user_id: authStore.user.id,
            steps_count: steps,
            calories_burned: caloriesBurned,
            step_date: dateString
          })
          .select()
          .single()

        console.log('[DEBUG] Insert response - data:', data, 'error:', insertError)

        if (insertError) throw insertError
        selectedDateSteps.value = data
        console.log('[DEBUG] Successfully inserted')
      }
      console.log('[DEBUG] updateStepsForDate completed successfully')
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error updating steps'
      console.error('[ERROR] Error updating steps:', e)
      throw e
    } finally {
      console.log('[DEBUG] Setting loading to false')
      loading.value = false
    }
  }

  // Backwards compatibility
  async function updateTodaySteps(steps: number) {
    const { selectedDate } = useSelectedDate()
    await updateStepsForDate(steps, selectedDate.value)
  }

  // Resetear el store
  function $reset() {
    selectedDateSteps.value = null
    loading.value = false
    error.value = null
  }

  return {
    // State
    todaySteps,
    selectedDateSteps,
    loading,
    error,

    // Computed
    todayStepsCalories,
    selectedDateStepsCalories,

    // Actions
    loadTodaySteps,
    loadStepsForDate,
    updateTodaySteps,
    updateStepsForDate,
    calculateStepsCalories,
    $reset
  }
})
