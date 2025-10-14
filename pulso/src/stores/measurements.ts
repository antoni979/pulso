import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, type Measurement } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useMeasurementsStore = defineStore('measurements', () => {
  const measurements = ref<Measurement[]>([])
  const loading = ref(false)

  // Get all measurements sorted by date
  const sortedMeasurements = computed(() => {
    return [...measurements.value].sort((a, b) =>
      new Date(b.measurement_date).getTime() - new Date(a.measurement_date).getTime()
    )
  })

  // Get latest measurement
  const latestMeasurement = computed(() => {
    return sortedMeasurements.value[0] || null
  })

  // Load all measurements
  async function loadMeasurements() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('measurement_date', { ascending: false })

      if (error) throw error
      measurements.value = data || []
    } catch (error) {
      console.error('Error loading measurements:', error)
    } finally {
      loading.value = false
    }
  }

  // Add measurement
  async function addMeasurement(measurement: Omit<Measurement, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const authStore = useAuthStore()
    if (!authStore.user) return { error: new Error('No user logged in') }

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('measurements')
        .insert({
          ...measurement,
          user_id: authStore.user.id
        })
        .select()
        .single()

      if (error) throw error

      measurements.value.unshift(data)
      return { data, error: null }
    } catch (error) {
      console.error('Error adding measurement:', error)
      return { data: null, error: error as Error }
    } finally {
      loading.value = false
    }
  }

  // Update measurement
  async function updateMeasurement(id: string, updates: Partial<Measurement>) {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('measurements')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const index = measurements.value.findIndex(m => m.id === id)
      if (index !== -1) {
        measurements.value[index] = data
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error updating measurement:', error)
      return { data: null, error: error as Error }
    } finally {
      loading.value = false
    }
  }

  // Delete measurement
  async function deleteMeasurement(id: string) {
    loading.value = true
    try {
      const { error } = await supabase
        .from('measurements')
        .delete()
        .eq('id', id)

      if (error) throw error

      measurements.value = measurements.value.filter(m => m.id !== id)
      return { error: null }
    } catch (error) {
      console.error('Error deleting measurement:', error)
      return { error: error as Error }
    } finally {
      loading.value = false
    }
  }

  return {
    measurements,
    loading,
    sortedMeasurements,
    latestMeasurement,
    loadMeasurements,
    addMeasurement,
    updateMeasurement,
    deleteMeasurement
  }
})
