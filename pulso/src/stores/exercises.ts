import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase, type Exercise } from '@/lib/supabase'

export const useExercisesStore = defineStore('exercises', () => {
  const exercises = ref<Exercise[]>([])
  const loading = ref(false)
  const searchQuery = ref('')

  // Search exercises by name
  async function searchExercises(query: string) {
    if (!query || query.length < 2) {
      exercises.value = []
      return
    }

    loading.value = true
    searchQuery.value = query

    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('name', { ascending: true })
        .limit(20)

      if (error) throw error
      exercises.value = data || []
    } catch (error) {
      console.error('Error searching exercises:', error)
      exercises.value = []
    } finally {
      loading.value = false
    }
  }

  // Get all exercises (for initial load or showing all)
  async function loadAllExercises() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true })
        .limit(50)

      if (error) throw error
      exercises.value = data || []
    } catch (error) {
      console.error('Error loading exercises:', error)
      exercises.value = []
    } finally {
      loading.value = false
    }
  }

  // Clear search results
  function clearSearch() {
    exercises.value = []
    searchQuery.value = ''
  }

  return {
    exercises,
    loading,
    searchQuery,
    searchExercises,
    loadAllExercises,
    clearSearch
  }
})
