import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase, type Food } from '@/lib/supabase'

export const useFoodsStore = defineStore('foods', () => {
  const foods = ref<Food[]>([])
  const loading = ref(false)
  const searchQuery = ref('')
  const error = ref<string | null>(null)

  // Search foods by name
  async function searchFoods(query: string) {
    // Limpiar query y validar
    const cleanQuery = query.trim()

    if (!cleanQuery || cleanQuery.length < 2) {
      foods.value = []
      error.value = null
      return
    }

    loading.value = true
    searchQuery.value = cleanQuery
    error.value = null

    try {
      const { data, error: supabaseError } = await supabase
        .from('foods')
        .select('*')
        .ilike('name', `%${cleanQuery}%`)
        .order('name', { ascending: true })
        .limit(20)

      if (supabaseError) {
        console.error('Supabase error:', supabaseError)
        throw supabaseError
      }

      foods.value = data || []

      // Si no hay resultados, no es un error
      if (foods.value.length === 0) {
        error.value = null
      }
    } catch (err) {
      console.error('Error searching foods:', err)
      error.value = 'Error al buscar alimentos'
      foods.value = []
    } finally {
      loading.value = false
    }
  }

  // Get all foods (for initial load or showing all)
  async function loadAllFoods() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .order('name', { ascending: true })
        .limit(50)

      if (error) throw error
      foods.value = data || []
    } catch (error) {
      console.error('Error loading foods:', error)
      foods.value = []
    } finally {
      loading.value = false
    }
  }

  // Clear search results
  function clearSearch() {
    foods.value = []
    searchQuery.value = ''
    error.value = null
    loading.value = false
  }

  return {
    foods,
    loading,
    searchQuery,
    error,
    searchFoods,
    loadAllFoods,
    clearSearch
  }
})
