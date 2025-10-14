import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

export interface DailyBalance {
  date: string
  consumed: number
  burned: number
  balance: number
  deficit_goal: number
}

export function useWeeklyBalance() {
  const authStore = useAuthStore()

  const weeklyData = ref<DailyBalance[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Fetch weekly balance from Supabase function
  const fetchWeeklyBalance = async () => {
    if (!authStore.user) return

    loading.value = true
    error.value = null

    try {
      const { data, error: rpcError } = await supabase
        .rpc('get_weekly_calorie_balance', { p_user_id: authStore.user.id })

      if (rpcError) throw rpcError

      if (data) {
        // Reverse the array so it's in chronological order (oldest to newest)
        weeklyData.value = data.reverse()
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error fetching weekly balance'
      console.error('Error fetching weekly balance:', e)
    } finally {
      loading.value = false
    }
  }

  // Load on mount
  onMounted(() => {
    fetchWeeklyBalance()
  })

  // Watch for auth changes
  watch(() => authStore.user, () => {
    if (authStore.user) {
      fetchWeeklyBalance()
    }
  })

  return {
    weeklyData,
    loading,
    error,
    refresh: fetchWeeklyBalance
  }
}
