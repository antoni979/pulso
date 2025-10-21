import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

interface DayBalance {
  date: string
  dateLabel: string
  consumed: number
  burned: number
  balance: number
  tmb: number
  stepsCalories: number
  workoutCalories: number
  hasData: boolean
}

export function useWeeklyBalance() {
  const authStore = useAuthStore()
  const weeklyData = ref<DayBalance[]>([])
  const loading = ref(false)

  // Calcular TMB BASAL usando Harris-Benedict (sin factor de actividad)
  // El factor de actividad NO se usa porque ya contamos pasos y ejercicios específicamente
  const calculateTMB = (): number => {
    const profile = authStore.profile
    if (!profile || !profile.current_weight || !profile.height || !profile.birth_date) {
      return 1800
    }

    const weight = Number(profile.current_weight)
    const height = profile.height
    const birthDate = new Date(profile.birth_date)
    const age = new Date().getFullYear() - birthDate.getFullYear()

    // Fórmula Harris-Benedict (TMB basal)
    let tmb = 0
    if (profile.sex === 'male') {
      tmb = 10 * weight + 6.25 * height - 5 * age + 5
    } else if (profile.sex === 'female') {
      tmb = 10 * weight + 6.25 * height - 5 * age - 161
    } else {
      tmb = 10 * weight + 6.25 * height - 5 * age - 78
    }

    // NO aplicamos el factor de actividad para evitar doble contabilización
    // Ya sumamos pasos y ejercicios específicamente
    return Math.round(tmb)
  }

  const loadWeeklyBalance = async () => {
    if (!authStore.user) return

    loading.value = true
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const days: DayBalance[] = []

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)

        const nextDay = new Date(date)
        nextDay.setDate(nextDay.getDate() + 1)

        const dateStart = date.toISOString()
        const dateEnd = nextDay.toISOString()

        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const dateString = `${year}-${month}-${day}`

        const [mealsResult, workoutsResult, stepsResult] = await Promise.all([
          supabase
            .from('meals')
            .select('calories')
            .eq('user_id', authStore.user.id)
            .gte('eaten_at', dateStart)
            .lt('eaten_at', dateEnd),
          supabase
            .from('workouts')
            .select('calories_burned')
            .eq('user_id', authStore.user.id)
            .gte('workout_date', dateStart)
            .lt('workout_date', dateEnd),
          supabase
            .from('daily_steps')
            .select('calories_burned')
            .eq('user_id', authStore.user.id)
            .eq('step_date', dateString)
            .maybeSingle()
        ])

        const consumed = mealsResult.data?.reduce((sum, m) => sum + m.calories, 0) || 0
        const workoutCalories = workoutsResult.data?.reduce((sum, w) => sum + w.calories_burned, 0) || 0
        const stepsCalories = stepsResult.data?.calories_burned || 0
        const tmb = calculateTMB()
        const thermogenic = Math.round(consumed * 0.1)

        const burned = tmb + workoutCalories + stepsCalories + thermogenic
        const balance = consumed - burned

        const hasData = (mealsResult.data && mealsResult.data.length > 0) ||
                        (workoutsResult.data && workoutsResult.data.length > 0) ||
                        (stepsResult.data !== null)

        const isToday = i === 0
        const isYesterday = i === 1
        let dateLabel = ''
        if (isToday) {
          dateLabel = 'Hoy'
        } else if (isYesterday) {
          dateLabel = 'Ayer'
        } else {
          const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
          dateLabel = days[date.getDay()] || ''
        }

        days.push({
          date: dateString,
          dateLabel,
          consumed,
          burned,
          balance,
          tmb,
          stepsCalories,
          workoutCalories,
          hasData
        })
      }

      weeklyData.value = days
    } catch (error) {
      console.error('Error loading weekly balance:', error)
    } finally {
      loading.value = false
    }
  }

  const averageBalance = computed(() => {
    const daysWithData = weeklyData.value.filter(d => d.hasData)
    if (daysWithData.length === 0) return 0
    const total = daysWithData.reduce((sum, d) => sum + d.balance, 0)
    return Math.round(total / daysWithData.length)
  })

  const totalDeficit = computed(() => {
    const daysWithData = weeklyData.value.filter(d => d.hasData)
    return daysWithData.reduce((sum, d) => sum + d.balance, 0)
  })

  return {
    weeklyData,
    loading,
    averageBalance,
    totalDeficit,
    loadWeeklyBalance,
    refresh: loadWeeklyBalance
  }
}
