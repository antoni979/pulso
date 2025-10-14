import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase, type Food } from '@/lib/supabase'

export const useFoodsStore = defineStore('foods', () => {
  const foods = ref<Food[]>([])
  const loading = ref(false)
  const searchQuery = ref('')

  // Search foods by name
  async function searchFoods(query: string) {
    if (!query || query.length < 2) {
      foods.value = []
      return
    }

    loading.value = true
    searchQuery.value = query

    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('name', { ascending: true })
        .limit(20)

      if (error) throw error
      foods.value = data || []
    } catch (error) {
      console.error('Error searching foods:', error)
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
  }

  return {
    foods,
    loading,
    searchQuery,
    searchFoods,
    loadAllFoods,
    clearSearch
  }
})
