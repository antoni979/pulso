import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase, type Exercise } from '@/lib/supabase'

export const useExercisesStore = defineStore('exercises', () => {
  const exercises = ref<Exercise[]>([])
  const loading = ref(false)
  const searchQuery = ref('')
  const error = ref<string | null>(null)

  // Search exercises by name
  async function searchExercises(query: string) {
    // Limpiar query y validar
    const cleanQuery = query.trim()

    if (!cleanQuery || cleanQuery.length < 2) {
      exercises.value = []
      error.value = null
      return
    }

    loading.value = true
    searchQuery.value = cleanQuery
    error.value = null

    try {
      const { data, error: supabaseError } = await supabase
        .from('exercises')
        .select('*')
        .ilike('name', `%${cleanQuery}%`)
        .order('name', { ascending: true })
        .limit(20)

      if (supabaseError) {
        console.error('Supabase error:', supabaseError)
        throw supabaseError
      }

      exercises.value = data || []

      // Si no hay resultados, no es un error
      if (exercises.value.length === 0) {
        error.value = null
      }
    } catch (err) {
      console.error('Error searching exercises:', err)
      error.value = 'Error al buscar ejercicios'
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
    error.value = null
    loading.value = false
  }

  return {
    exercises,
    loading,
    searchQuery,
    error,
    searchExercises,
    loadAllExercises,
    clearSearch
  }
})
