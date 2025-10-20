import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase, type Food } from '@/lib/supabase'

export const useFoodsStore = defineStore('foods', () => {
  const foods = ref<Food[]>([])
  const loading = ref(false)
  const searchQuery = ref('')
  const error = ref<string | null>(null)

  // Función helper para normalizar texto (quitar tildes)
  function normalizeText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  }

  // Search foods by name (sin tildes) - Versión mejorada y robusta
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
      // Estrategia: Buscar MÁS resultados del servidor (más permisivo)
      // y filtrar inteligentemente en el cliente

      // Extraer primera palabra para búsqueda más amplia
      const firstWord = cleanQuery.split(' ')[0]

      const { data, error: supabaseError } = await supabase
        .from('foods')
        .select('*')
        .ilike('name', `%${firstWord}%`)
        .order('name', { ascending: true })
        .limit(50) // Más resultados para filtrar en cliente

      if (supabaseError) {
        console.error('Supabase error:', supabaseError)
        throw supabaseError
      }

      // Filtrado inteligente en cliente (sin tildes)
      const allResults = data || []
      const normalizedQuery = normalizeText(cleanQuery)

      foods.value = allResults
        .filter(food => {
          const normalizedFoodName = normalizeText(food.name)

          // Match exacto sin tildes
          if (normalizedFoodName.includes(normalizedQuery)) {
            return true
          }

          // Match por palabras individuales
          const queryWords = normalizedQuery.split(' ').filter(w => w.length > 0)
          const nameWords = normalizedFoodName.split(' ')

          return queryWords.every(queryWord =>
            nameWords.some(nameWord => nameWord.includes(queryWord))
          )
        })
        .slice(0, 20) // Limitar a 20 resultados finales

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

  // Clear search results - VERSIÓN ROBUSTA
  function clearSearch() {
    // Orden importa: primero detener loading
    loading.value = false
    // Luego limpiar error
    error.value = null
    // Finalmente limpiar datos
    foods.value = []
    searchQuery.value = ''
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
