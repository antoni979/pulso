<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useFoodsStore } from '@/stores/foods'
import { useMealsStore } from '@/stores/meals'
import { useAudioRecorder } from '@/composables/useAudioRecorder'
import { useImageCapture } from '@/composables/useImageCapture'
import { useGeminiNutrition } from '@/composables/useGeminiNutrition'
import { useSelectedDate } from '@/composables/useSelectedDate'
import type { Food } from '@/lib/supabase'

const emit = defineEmits<{
  close: []
  saved: []
}>()

const foodsStore = useFoodsStore()
const mealsStore = useMealsStore()
const audioRecorder = useAudioRecorder()
const imageCapture = useImageCapture()
const geminiNutrition = useGeminiNutrition()
const { selectedDate } = useSelectedDate()

// Estado del flujo
const step = ref<'search' | 'configure' | 'audio' | 'image' | 'text'>('search')

// Búsqueda
const searchInput = ref('')
const debounceTimeout = ref<number | null>(null)

// Alimento seleccionado
const selectedFood = ref<Food | null>(null)

// Configuración de la comida
const mealConfig = ref({
  meal_type: 'lunch' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
  grams: 100,
  name: '',
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0
})

// Unidad de medida seleccionada
const selectedUnit = ref<'grams' | 'serving'>('grams')
const servingQuantity = ref(1)

// Items individuales del plato (solo para análisis de audio)
const foodItems = ref<Array<{
  name: string
  grams: number
  calories: number
  protein: number
  carbs: number
  fats: number
}>>([])

const isSaving = ref(false)

// Descripción de texto
const textDescription = ref('')

// Función para crear timestamp con la fecha seleccionada y hora actual
const getEatenAtTimestamp = () => {
  const now = new Date()
  const selected = new Date(selectedDate.value)

  // Combinar fecha seleccionada con hora actual
  selected.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds())

  return selected.toISOString()
}

// Limpiar todo al montar el componente
onMounted(() => {
  resetAll()
})

// Limpiar al desmontar
onUnmounted(() => {
  if (debounceTimeout.value) {
    clearTimeout(debounceTimeout.value)
  }
  foodsStore.clearSearch()
})

// Función para resetear todo - VERSIÓN ROBUSTA
const resetAll = () => {
  // Paso 1: Limpiar timers pendientes
  if (debounceTimeout.value) {
    clearTimeout(debounceTimeout.value)
    debounceTimeout.value = null
  }

  // Paso 2: Limpiar store (esto detiene loading)
  foodsStore.clearSearch()

  // Paso 3: Resetear estado del componente
  step.value = 'search'
  searchInput.value = ''
  selectedFood.value = null
  selectedUnit.value = 'grams'
  servingQuantity.value = 1
  foodItems.value = []
  mealConfig.value = {
    meal_type: 'lunch',
    grams: 100,
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0
  }
  isSaving.value = false

  // Paso 4: Limpiar recursos multimedia
  if (audioRecorder.isRecording.value) {
    audioRecorder.cancelRecording()
  }
  imageCapture.clearImage()
}

// Watch search input con debounce SUPER ROBUSTO
watch(searchInput, (newValue, oldValue) => {
  // Limpiar timeout anterior SIEMPRE
  if (debounceTimeout.value) {
    clearTimeout(debounceTimeout.value)
    debounceTimeout.value = null
  }

  // Validar
  const cleanValue = newValue.trim()

  // Si está vacío o muy corto, limpiar inmediatamente
  if (cleanValue.length < 2) {
    foodsStore.clearSearch()
    return
  }

  // Si es igual al anterior, no buscar de nuevo
  if (cleanValue === oldValue?.trim()) {
    return
  }

  // Crear nuevo timeout solo si hay valor válido
  debounceTimeout.value = setTimeout(async () => {
    try {
      // Double-check que el input no cambió mientras esperábamos
      if (searchInput.value.trim() === cleanValue) {
        await foodsStore.searchFoods(cleanValue)
      }
    } catch (error) {
      console.error('Error en búsqueda:', error)
      foodsStore.clearSearch()
    } finally {
      debounceTimeout.value = null
    }
  }, 300) as unknown as number // 300ms es más rápido y responsive
})

// Seleccionar alimento y pasar a configuración
const selectFood = (food: Food) => {
  selectedFood.value = food

  // Si tiene unidad de serving, usarla por defecto
  if (food.serving_unit && food.serving_size_grams) {
    selectedUnit.value = 'serving'
    servingQuantity.value = 1
    mealConfig.value.grams = food.serving_size_grams
  } else {
    selectedUnit.value = 'grams'
    mealConfig.value.grams = 100
  }

  calculateNutrients()
  step.value = 'configure'
}

// Calcular nutrientes basados en gramos o unidades
const calculateNutrients = () => {
  if (!selectedFood.value) return

  // Calcular gramos según la unidad seleccionada
  let totalGrams = mealConfig.value.grams

  if (selectedUnit.value === 'serving' && selectedFood.value.serving_size_grams) {
    totalGrams = servingQuantity.value * selectedFood.value.serving_size_grams
    mealConfig.value.grams = totalGrams
  }

  const multiplier = totalGrams / 100
  mealConfig.value.calories = Math.round(selectedFood.value.calories_per_100g * multiplier)
  mealConfig.value.protein = Math.round(selectedFood.value.protein_per_100g * multiplier)
  mealConfig.value.carbs = Math.round(selectedFood.value.carbs_per_100g * multiplier)
  mealConfig.value.fats = Math.round(selectedFood.value.fats_per_100g * multiplier)

  // Nombre con la unidad apropiada
  if (selectedUnit.value === 'serving' && selectedFood.value.serving_unit) {
    mealConfig.value.name = `${selectedFood.value.name} (${servingQuantity.value} ${selectedFood.value.serving_unit}${servingQuantity.value > 1 ? 's' : ''})`
  } else {
    mealConfig.value.name = `${selectedFood.value.name} (${totalGrams}g)`
  }
}

// Watch gramos y cantidad de serving para recalcular
watch(() => mealConfig.value.grams, calculateNutrients)
watch(servingQuantity, calculateNutrients)
watch(selectedUnit, () => {
  if (selectedUnit.value === 'grams') {
    // Al cambiar a gramos, mantener el valor actual
    mealConfig.value.grams = mealConfig.value.grams || 100
  } else if (selectedFood.value?.serving_size_grams) {
    // Al cambiar a serving, poner 1 unidad
    servingQuantity.value = servingQuantity.value || 1
  }
  calculateNutrients()
})

// Volver a la búsqueda
const goBackToSearch = () => {
  step.value = 'search'
  selectedFood.value = null
  searchInput.value = ''
  mealConfig.value = {
    meal_type: 'lunch',
    grams: 100,
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0
  }
  foodsStore.clearSearch()
}

// Cerrar modal
const handleClose = () => {
  resetAll()
  emit('close')
}

// Guardar comida
const saveMeal = async () => {
  if (!selectedFood.value || mealConfig.value.grams <= 0) {
    console.error('Validación falló - selectedFood:', !!selectedFood.value, 'grams:', mealConfig.value.grams)
    return
  }

  console.log('[DEBUG] Guardando comida desde búsqueda manual:', mealConfig.value)

  isSaving.value = true
  try {
    // Redondear valores antes de guardar (doble seguridad)
    const result = await mealsStore.addMeal({
      name: mealConfig.value.name,
      meal_type: mealConfig.value.meal_type,
      calories: Math.round(mealConfig.value.calories),
      protein: Math.round(mealConfig.value.protein),
      carbs: Math.round(mealConfig.value.carbs),
      fats: Math.round(mealConfig.value.fats),
      eaten_at: getEatenAtTimestamp()
    })

    console.log('[DEBUG] Resultado de addMeal:', result)

    if (result?.error) {
      throw result.error
    }

    console.log('[DEBUG] Comida guardada exitosamente')
    emit('saved')
    emit('close')
  } catch (error) {
    console.error('[ERROR] Error al guardar comida:', error)
    alert(`Error al guardar la comida: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  } finally {
    isSaving.value = false
  }
}

const getMealTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    breakfast: 'Desayuno',
    lunch: 'Almuerzo',
    dinner: 'Cena',
    snack: 'Snack'
  }
  return labels[type] || type
}

const getMealTypeEmoji = (type: string) => {
  const emojis: Record<string, string> = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍪'
  }
  return emojis[type] || '🍽️'
}

// ========== FUNCIONALIDAD DE AUDIO ==========

// Iniciar grabación de audio
const startAudioRecording = async () => {
  try {
    step.value = 'audio'
    await audioRecorder.startRecording()
  } catch (error) {
    console.error('Error al iniciar grabación:', error)
    step.value = 'search'
  }
}

// Detener grabación y procesar
const stopAndProcessAudio = async () => {
  try {
    audioRecorder.isProcessing.value = true
    const audioBlob = await audioRecorder.stopRecording()

    // Analizar con Gemini
    const nutritionData = await geminiNutrition.analyzeAudioNutrition(audioBlob)

    // Guardar items individuales
    foodItems.value = nutritionData.items || []

    // Configurar la comida con los datos analizados (redondeando valores)
    mealConfig.value = {
      meal_type: nutritionData.meal_type,
      grams: Math.round(nutritionData.grams),
      name: nutritionData.name,
      calories: Math.round(nutritionData.calories),
      protein: Math.round(nutritionData.protein),
      carbs: Math.round(nutritionData.carbs),
      fats: Math.round(nutritionData.fats)
    }

    // Ir a configuración (sin selectedFood porque vino de audio)
    selectedFood.value = null
    step.value = 'configure'
  } catch (error) {
    console.error('Error al procesar audio:', error)
    alert('Error al procesar el audio. Por favor, inténtalo de nuevo.')
    step.value = 'search'
  } finally {
    audioRecorder.isProcessing.value = false
  }
}

// Cancelar grabación
const cancelAudioRecording = () => {
  audioRecorder.cancelRecording()
  step.value = 'search'
}

// Guardar comida desde audio/texto/imagen (sin validación de selectedFood)
const saveMealFromAudio = async () => {
  console.log('[DEBUG 1] saveMealFromAudio iniciado')
  console.log('[DEBUG 2] mealConfig:', JSON.stringify(mealConfig.value, null, 2))

  if (mealConfig.value.grams <= 0 || mealConfig.value.calories <= 0) {
    console.error('[ERROR] Validación falló - grams:', mealConfig.value.grams, 'calories:', mealConfig.value.calories)
    alert('Validación falló: gramos o calorías inválidos')
    return
  }

  console.log('[DEBUG 3] Validación pasada')

  isSaving.value = true
  console.log('[DEBUG 4] isSaving = true')

  try {
    // Redondear valores antes de guardar (doble seguridad)
    const mealData = {
      name: mealConfig.value.name,
      meal_type: mealConfig.value.meal_type,
      calories: Math.round(mealConfig.value.calories),
      protein: Math.round(mealConfig.value.protein),
      carbs: Math.round(mealConfig.value.carbs),
      fats: Math.round(mealConfig.value.fats),
      eaten_at: getEatenAtTimestamp()
    }

    console.log('[DEBUG 5] Datos a guardar:', JSON.stringify(mealData, null, 2))
    console.log('[DEBUG 6] Llamando a mealsStore.addMeal...')

    const result = await mealsStore.addMeal(mealData)

    console.log('[DEBUG 7] Resultado de addMeal:', JSON.stringify(result, null, 2))

    if (result?.error) {
      console.error('[ERROR] addMeal retornó error:', result.error)
      throw result.error
    }

    console.log('[DEBUG 8] Comida guardada exitosamente, emitiendo eventos...')
    emit('saved')
    console.log('[DEBUG 9] Evento saved emitido')
    emit('close')
    console.log('[DEBUG 10] Evento close emitido')
  } catch (error) {
    console.error('[ERROR] Excepción capturada:', error)
    console.error('[ERROR] Stack:', error instanceof Error ? error.stack : 'No stack')
    alert(`Error al guardar la comida: ${error instanceof Error ? error.message : JSON.stringify(error)}`)
  } finally {
    console.log('[DEBUG 11] Finally block - isSaving = false')
    isSaving.value = false
  }

  console.log('[DEBUG 12] saveMealFromAudio finalizado')
}

// Recalcular totales cuando se elimina un alimento
const recalculateTotals = () => {
  if (foodItems.value.length === 0) {
    mealConfig.value.grams = 0
    mealConfig.value.calories = 0
    mealConfig.value.protein = 0
    mealConfig.value.carbs = 0
    mealConfig.value.fats = 0
    return
  }

  // Redondear siempre los totales
  mealConfig.value.grams = Math.round(foodItems.value.reduce((sum, item) => sum + item.grams, 0))
  mealConfig.value.calories = Math.round(foodItems.value.reduce((sum, item) => sum + item.calories, 0))
  mealConfig.value.protein = Math.round(foodItems.value.reduce((sum, item) => sum + item.protein, 0))
  mealConfig.value.carbs = Math.round(foodItems.value.reduce((sum, item) => sum + item.carbs, 0))
  mealConfig.value.fats = Math.round(foodItems.value.reduce((sum, item) => sum + item.fats, 0))
}

// ========== FUNCIONALIDAD DE IMAGEN ==========

// Capturar imagen desde cámara
const captureFromCamera = async () => {
  try {
    step.value = 'image'
    const imageBase64 = await imageCapture.captureImage(true) // true = usar cámara
    await processImage(imageBase64)
  } catch (error) {
    console.error('Error al capturar imagen:', error)
    step.value = 'search'
  }
}


// Procesar imagen con Gemini Vision
const processImage = async (imageBase64: string) => {
  try {
    // Analizar con Gemini Vision
    const nutritionData = await geminiNutrition.analyzeImageNutrition(imageBase64)

    // Guardar items individuales
    foodItems.value = nutritionData.items || []

    // Configurar la comida con los datos analizados (redondeando valores)
    mealConfig.value = {
      meal_type: nutritionData.meal_type,
      grams: Math.round(nutritionData.grams),
      name: nutritionData.name,
      calories: Math.round(nutritionData.calories),
      protein: Math.round(nutritionData.protein),
      carbs: Math.round(nutritionData.carbs),
      fats: Math.round(nutritionData.fats)
    }

    // Ir a configuración (sin selectedFood porque vino de imagen)
    selectedFood.value = null
    step.value = 'configure'
  } catch (error) {
    console.error('Error al procesar imagen:', error)
    alert('Error al analizar la imagen. Por favor, inténtalo de nuevo.')
    step.value = 'search'
  } finally {
    imageCapture.clearImage()
  }
}

// ========== FUNCIONALIDAD DE TEXTO ==========

// Iniciar entrada de texto
const startTextInput = () => {
  step.value = 'text'
  textDescription.value = ''
}

// Analizar texto con Gemini
const analyzeText = async () => {
  if (!textDescription.value.trim()) {
    alert('Por favor, escribe una descripción de tu comida')
    return
  }

  try {
    // Analizar con Gemini
    const nutritionData = await geminiNutrition.analyzeTextNutrition(textDescription.value)

    // Guardar items individuales
    foodItems.value = nutritionData.items || []

    // Configurar la comida con los datos analizados (redondeando valores)
    mealConfig.value = {
      meal_type: nutritionData.meal_type,
      grams: Math.round(nutritionData.grams),
      name: nutritionData.name,
      calories: Math.round(nutritionData.calories),
      protein: Math.round(nutritionData.protein),
      carbs: Math.round(nutritionData.carbs),
      fats: Math.round(nutritionData.fats)
    }

    // Ir a configuración (sin selectedFood porque vino de texto)
    selectedFood.value = null
    step.value = 'configure'
  } catch (error) {
    console.error('Error al procesar texto:', error)
    alert('Error al analizar la descripción. Por favor, inténtalo de nuevo.')
  }
}

// Cancelar entrada de texto
const cancelTextInput = () => {
  textDescription.value = ''
  step.value = 'search'
}
</script>

<template>
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="handleClose">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" @click.stop>
      <!-- Header -->
      <div class="bg-gradient-to-br from-primary-500 to-primary-600 text-white p-6 rounded-t-3xl sticky top-0 z-10">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-black">
              {{ step === 'search' ? 'Registrar Comida' : step === 'audio' ? 'Grabando Audio' : step === 'image' ? 'Analizando Imagen' : step === 'text' ? 'Descripción de Texto' : 'Configurar Comida' }}
            </h2>
            <p class="text-primary-100 text-sm font-medium mt-1">
              {{ step === 'search' ? 'Busca un alimento, foto, audio o texto' : step === 'audio' ? 'Describe lo que comiste' : step === 'image' ? 'Procesando tu foto...' : step === 'text' ? 'Escribe lo que comiste' : 'Ajusta la cantidad y tipo de comida' }}
            </p>
          </div>
          <button
            @click="handleClose"
            class="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="p-6">
        <!-- STEP 1: Búsqueda -->
        <div v-if="step === 'search'">
          <!-- Botones de captura rápida (Foto, Audio y Texto) -->
          <div class="mb-6 grid grid-cols-3 gap-3">
            <!-- Botón de Foto -->
            <button
              @click="captureFromCamera"
              class="bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <div class="text-3xl mb-1">📸</div>
              <div class="text-xs font-black">Foto</div>
              <div class="text-[10px] text-white/80 mt-1">Escanear</div>
            </button>

            <!-- Botón de Audio -->
            <button
              @click="startAudioRecording"
              class="bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <div class="text-3xl mb-1">🎤</div>
              <div class="text-xs font-black">Audio</div>
              <div class="text-[10px] text-white/80 mt-1">Por voz</div>
            </button>

            <!-- Botón de Texto -->
            <button
              @click="startTextInput"
              class="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <div class="text-3xl mb-1">✍️</div>
              <div class="text-xs font-black">Texto</div>
              <div class="text-[10px] text-white/80 mt-1">Describir</div>
            </button>
          </div>

          <!-- Separador -->
          <div class="flex items-center my-6">
            <div class="flex-1 border-t border-gray-300"></div>
            <span class="px-4 text-sm text-gray-500 font-semibold">o busca manualmente</span>
            <div class="flex-1 border-t border-gray-300"></div>
          </div>

          <!-- Search Input -->
          <div class="relative mb-4">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              v-model="searchInput"
              type="text"
              placeholder="Busca un alimento (ej: pollo, arroz, plátano...)"
              class="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition font-medium text-lg"
              autofocus
              @focus="() => { if (searchInput.length >= 2) foodsStore.searchFoods(searchInput) }"
            />
          </div>

          <!-- Loading State -->
          <div v-if="foodsStore.loading" class="text-center py-12">
            <div class="inline-block w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-gray-600 mt-4 font-medium">Buscando alimentos...</p>
          </div>

          <!-- Search Results -->
          <div v-else-if="foodsStore.foods.length > 0" class="space-y-2">
            <p class="text-sm text-gray-600 font-semibold mb-3">{{ foodsStore.foods.length }} resultados encontrados:</p>
            <div class="max-h-96 overflow-y-auto space-y-2">
              <button
                v-for="food in foodsStore.foods"
                :key="food.id"
                @click="selectFood(food)"
                class="w-full text-left p-4 bg-gray-50 hover:bg-primary-50 border-2 border-gray-200 hover:border-primary-300 rounded-xl transition-all group"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <p class="font-bold text-gray-900 group-hover:text-primary-700 mb-1">{{ food.name }}</p>
                    <div class="flex flex-wrap gap-2 text-sm">
                      <span class="px-2 py-1 bg-red-100 text-red-700 rounded-md font-semibold">{{ food.calories_per_100g }} kcal</span>
                      <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-semibold">P: {{ food.protein_per_100g }}g</span>
                      <span class="px-2 py-1 bg-orange-100 text-orange-700 rounded-md font-semibold">C: {{ food.carbs_per_100g }}g</span>
                      <span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md font-semibold">G: {{ food.fats_per_100g }}g</span>
                      <span class="text-gray-400 text-xs self-center">(por 100g)</span>
                    </div>
                  </div>
                  <svg class="w-6 h-6 text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <!-- No Results -->
          <div v-else-if="searchInput.length >= 2 && !foodsStore.loading" class="text-center py-12">
            <span class="text-6xl mb-4 block">🔍</span>
            <p class="text-gray-700 font-bold text-lg">No se encontraron alimentos</p>
            <p class="text-gray-500 mt-2">Intenta con otro término de búsqueda</p>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-12">
            <span class="text-7xl mb-4 block">🥗</span>
            <p class="text-gray-700 font-bold text-lg">Busca un alimento</p>
            <p class="text-gray-500 mt-2">Escribe al menos 2 caracteres para buscar</p>
          </div>
        </div>

        <!-- STEP AUDIO: Grabación de audio -->
        <div v-if="step === 'audio'" class="space-y-6">
          <!-- Estado de grabación -->
          <div class="text-center py-12">
            <div v-if="audioRecorder.isRecording.value" class="space-y-6">
              <!-- Animación de micrófono -->
              <div class="relative inline-block">
                <div class="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                <div class="relative w-32 h-32 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center shadow-2xl">
                  <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
              </div>

              <div>
                <p class="text-xl font-black text-gray-900 mb-2">Grabando...</p>
                <p class="text-gray-600 text-sm">
                  Describe tu comida. Ejemplo:<br>
                  <span class="italic text-gray-500">"Para el almuerzo comí 200g de pollo a la plancha con arroz"</span>
                </p>
              </div>

              <!-- Botones -->
              <div class="flex space-x-3 justify-center max-w-md mx-auto">
                <button
                  @click="cancelAudioRecording"
                  class="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all"
                >
                  Cancelar
                </button>
                <button
                  @click="stopAndProcessAudio"
                  class="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold rounded-xl hover:from-primary-700 hover:to-primary-600 shadow-lg transition-all"
                >
                  ✓ Detener y Analizar
                </button>
              </div>
            </div>

            <!-- Estado de procesamiento -->
            <div v-else-if="audioRecorder.isProcessing.value || geminiNutrition.isAnalyzing.value" class="space-y-6">
              <div class="inline-block w-24 h-24 border-8 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <p class="text-xl font-black text-gray-900 mb-2">Analizando tu comida...</p>
                <p class="text-gray-600 text-sm">Estamos calculando las calorías y macros exactos</p>
              </div>
            </div>
          </div>

          <!-- Errores -->
          <div v-if="audioRecorder.error.value || geminiNutrition.error.value" class="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <p class="text-red-700 font-semibold">{{ audioRecorder.error.value || geminiNutrition.error.value }}</p>
          </div>
        </div>

        <!-- STEP IMAGE: Análisis de imagen -->
        <div v-if="step === 'image'" class="space-y-6">
          <!-- Preview de la imagen -->
          <div v-if="imageCapture.imageData.value" class="text-center">
            <img :src="imageCapture.imageData.value" alt="Imagen capturada" class="max-w-full max-h-64 mx-auto rounded-xl shadow-lg mb-4" />
            <p class="text-sm text-gray-600">Vista previa de tu comida</p>
          </div>

          <!-- Estado de procesamiento -->
          <div v-if="geminiNutrition.isAnalyzing.value" class="text-center py-12">
            <div class="inline-block w-24 h-24 border-8 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <div>
              <p class="text-xl font-black text-gray-900 mb-2">Analizando tu comida...</p>
              <p class="text-gray-600 text-sm">Detectando alimentos y calculando valores nutricionales precisos</p>
              <p class="text-gray-500 text-xs mt-2">Esto puede tomar unos segundos</p>
            </div>
          </div>

          <!-- Errores -->
          <div v-if="imageCapture.error.value || geminiNutrition.error.value" class="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <p class="text-red-700 font-semibold">{{ imageCapture.error.value || geminiNutrition.error.value }}</p>
            <button
              @click="step = 'search'"
              class="mt-3 w-full px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>

        <!-- STEP TEXT: Entrada de texto -->
        <div v-if="step === 'text'" class="space-y-6">
          <!-- Instrucciones -->
          <div class="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5">
            <div class="flex items-start space-x-3 mb-3">
              <div class="text-2xl">💡</div>
              <div class="flex-1">
                <p class="font-black text-lg text-gray-900 mb-2">Describe tu comida</p>
                <p class="text-sm text-gray-700 mb-2">Escribe lo que comiste y la IA calculará las calorías y macros automáticamente.</p>
                <div class="text-xs text-gray-600 space-y-1">
                  <p><strong>Ejemplos:</strong></p>
                  <p class="italic">• "Para el almuerzo comí 200g de pollo a la plancha con arroz"</p>
                  <p class="italic">• "Desayuno: tostadas con aguacate y 2 huevos revueltos"</p>
                  <p class="italic">• "Cena: ensalada de atún con tomate"</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Textarea para descripción -->
          <div>
            <label class="block text-sm font-bold text-gray-800 mb-2">Tu comida:</label>
            <textarea
              v-model="textDescription"
              placeholder="Ej: Para el almuerzo comí 200 gramos de pollo a la plancha con 150 gramos de arroz blanco..."
              rows="6"
              class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition font-medium resize-none"
              :disabled="geminiNutrition.isAnalyzing.value"
            ></textarea>
            <p class="text-xs text-gray-500 mt-2">
              {{ textDescription.length }}/500 caracteres
            </p>
          </div>

          <!-- Estado de procesamiento -->
          <div v-if="geminiNutrition.isAnalyzing.value" class="text-center py-8">
            <div class="inline-block w-16 h-16 border-8 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <div>
              <p class="text-lg font-black text-gray-900 mb-1">Analizando tu descripción...</p>
              <p class="text-gray-600 text-sm">Calculando valores nutricionales exactos</p>
            </div>
          </div>

          <!-- Errores -->
          <div v-if="geminiNutrition.error.value" class="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <p class="text-red-700 font-semibold">{{ geminiNutrition.error.value }}</p>
          </div>

          <!-- Botones -->
          <div class="flex space-x-3">
            <button
              @click="cancelTextInput"
              class="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all"
              :disabled="geminiNutrition.isAnalyzing.value"
            >
              Cancelar
            </button>
            <button
              @click="analyzeText"
              class="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-600 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!textDescription.trim() || geminiNutrition.isAnalyzing.value"
            >
              <span v-if="!geminiNutrition.isAnalyzing.value">✓ Analizar</span>
              <span v-else class="flex items-center justify-center space-x-2">
                <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Analizando...</span>
              </span>
            </button>
          </div>
        </div>

        <!-- STEP 2: Configuración -->
        <div v-if="step === 'configure'" class="space-y-6">
          <!-- Información del análisis de audio -->
          <div v-if="!selectedFood" class="bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-pink-200 rounded-xl p-5">
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center space-x-2">
                <svg class="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="font-black text-lg text-gray-900">Análisis completado</p>
              </div>
              <button
                @click="step = 'search'"
                class="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p class="text-sm text-gray-600 mb-3">Detectamos tu comida y calculamos los valores nutricionales. Revisa y ajusta lo que necesites antes de guardar.</p>

            <!-- Nombre de la comida editable -->
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-2">Nombre de la comida:</label>
              <input
                v-model="mealConfig.name"
                type="text"
                class="w-full px-3 py-2 bg-white border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 font-semibold text-gray-900"
                placeholder="Ej: Pollo a la plancha con arroz"
              />
            </div>

            <!-- Desglose de alimentos individuales -->
            <div v-if="foodItems.length > 0" class="mt-4">
              <label class="block text-xs font-bold text-gray-700 mb-2">Alimentos detectados:</label>
              <div class="space-y-2">
                <div
                  v-for="(item, index) in foodItems"
                  :key="index"
                  class="bg-white border-2 border-pink-100 rounded-lg p-3 hover:border-pink-300 transition-colors"
                >
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex-1">
                      <p class="font-bold text-gray-900 text-sm">{{ item.name }}</p>
                      <p class="text-xs text-gray-600 font-semibold mt-1">{{ item.grams }}g</p>
                    </div>
                    <button
                      @click="foodItems.splice(index, 1); recalculateTotals()"
                      class="text-red-500 hover:text-red-700 text-xs font-bold ml-2"
                      title="Eliminar este alimento"
                    >
                      ✕
                    </button>
                  </div>
                  <div class="grid grid-cols-4 gap-2 text-xs">
                    <div class="text-center">
                      <p class="text-gray-500">Kcal</p>
                      <p class="font-bold text-primary-600">{{ item.calories }}</p>
                    </div>
                    <div class="text-center">
                      <p class="text-gray-500">Prot</p>
                      <p class="font-bold text-blue-600">{{ item.protein }}g</p>
                    </div>
                    <div class="text-center">
                      <p class="text-gray-500">Carb</p>
                      <p class="font-bold text-orange-600">{{ item.carbs }}g</p>
                    </div>
                    <div class="text-center">
                      <p class="text-gray-500">Gras</p>
                      <p class="font-bold text-yellow-600">{{ item.fats }}g</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Alimento seleccionado (solo si viene de búsqueda manual) -->
          <div v-if="selectedFood" class="bg-primary-50 border-2 border-primary-200 rounded-xl p-4">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <p class="font-black text-xl text-gray-900 mb-2">{{ selectedFood.name }}</p>
                <div class="flex flex-wrap gap-2 text-sm">
                  <span class="px-2 py-1 bg-white border border-primary-300 text-gray-700 rounded-md font-semibold">
                    {{ selectedFood.calories_per_100g }} kcal/100g
                  </span>
                  <span class="px-2 py-1 bg-white border border-primary-300 text-gray-700 rounded-md font-semibold">
                    P: {{ selectedFood.protein_per_100g }}g
                  </span>
                  <span class="px-2 py-1 bg-white border border-primary-300 text-gray-700 rounded-md font-semibold">
                    C: {{ selectedFood.carbs_per_100g }}g
                  </span>
                  <span class="px-2 py-1 bg-white border border-primary-300 text-gray-700 rounded-md font-semibold">
                    G: {{ selectedFood.fats_per_100g }}g
                  </span>
                </div>
              </div>
              <button
                @click="goBackToSearch"
                class="text-gray-400 hover:text-gray-600 transition-colors ml-3"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Tipo de comida -->
          <div>
            <label class="block text-sm font-bold text-gray-800 mb-3">
              <span class="flex items-center space-x-2">
                <span>Tipo de comida</span>
                <span class="text-xl">{{ getMealTypeEmoji(mealConfig.meal_type) }}</span>
              </span>
            </label>
            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="type in ['breakfast', 'lunch', 'dinner', 'snack']"
                :key="type"
                @click="mealConfig.meal_type = type as any"
                :class="mealConfig.meal_type === type
                  ? 'bg-primary-500 text-white border-primary-600'
                  : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'"
                class="p-3 border-2 rounded-xl font-bold transition-all flex items-center justify-center space-x-2"
              >
                <span class="text-2xl">{{ getMealTypeEmoji(type) }}</span>
                <span>{{ getMealTypeLabel(type) }}</span>
              </button>
            </div>
          </div>

          <!-- Selector de unidades (solo para búsqueda manual con serving_unit) -->
          <div v-if="selectedFood && selectedFood.serving_unit && selectedFood.serving_size_grams">
            <label class="block text-sm font-bold text-gray-800 mb-3">
              Unidad de medida
            </label>
            <div class="grid grid-cols-2 gap-3 mb-4">
              <button
                @click="selectedUnit = 'serving'"
                :class="selectedUnit === 'serving'
                  ? 'bg-primary-500 text-white border-primary-600'
                  : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'"
                class="p-3 border-2 rounded-xl font-bold transition-all"
              >
                {{ selectedFood.serving_unit }}
              </button>
              <button
                @click="selectedUnit = 'grams'"
                :class="selectedUnit === 'grams'
                  ? 'bg-primary-500 text-white border-primary-600'
                  : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'"
                class="p-3 border-2 rounded-xl font-bold transition-all"
              >
                gramos
              </button>
            </div>
          </div>

          <!-- Cantidad -->
          <div>
            <label class="block text-sm font-bold text-gray-800 mb-3">
              <span v-if="selectedUnit === 'serving' && selectedFood?.serving_unit">
                Cantidad ({{ selectedFood.serving_unit }}s)
              </span>
              <span v-else>
                Cantidad (gramos)
              </span>
            </label>

            <!-- Input de serving quantity -->
            <div v-if="selectedUnit === 'serving' && selectedFood?.serving_unit" class="space-y-2">
              <input
                v-model.number="servingQuantity"
                type="number"
                min="0.5"
                step="0.5"
                class="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition font-bold text-3xl text-center"
              />
              <p class="text-xs text-gray-500 text-center">
                = {{ mealConfig.grams }}g ({{ selectedFood.serving_size_grams }}g por {{ selectedFood.serving_unit }})
              </p>
            </div>

            <!-- Input de gramos -->
            <input
              v-else
              v-model.number="mealConfig.grams"
              type="number"
              min="1"
              step="1"
              class="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition font-bold text-3xl text-center"
            />
          </div>

          <!-- Información nutricional (editable si viene de audio) -->
          <div class="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-5 border-2 border-primary-200">
            <p class="text-sm font-bold text-primary-800 mb-4 uppercase tracking-wide flex items-center justify-between">
              <span>Valores Nutricionales:</span>
              <span v-if="!selectedFood" class="text-xs bg-pink-500 text-white px-3 py-1 rounded-full normal-case">Editables</span>
            </p>

            <!-- Si viene de audio, campos editables -->
            <div v-if="!selectedFood" class="grid grid-cols-2 gap-3">
              <div class="bg-white rounded-lg p-4 text-center shadow-sm">
                <p class="text-xs text-gray-600 font-semibold mb-2">Calorías</p>
                <input
                  v-model.number="mealConfig.calories"
                  type="number"
                  min="0"
                  step="1"
                  class="w-full text-center text-2xl font-black text-primary-600 bg-gray-50 border-2 border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p class="text-xs text-gray-500 mt-1">kcal</p>
              </div>
              <div class="bg-white rounded-lg p-4 text-center shadow-sm">
                <p class="text-xs text-gray-600 font-semibold mb-2">Proteína</p>
                <input
                  v-model.number="mealConfig.protein"
                  type="number"
                  min="0"
                  step="0.1"
                  class="w-full text-center text-2xl font-black text-blue-600 bg-gray-50 border-2 border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p class="text-xs text-gray-500 mt-1">gramos</p>
              </div>
              <div class="bg-white rounded-lg p-4 text-center shadow-sm">
                <p class="text-xs text-gray-600 font-semibold mb-2">Carbohidratos</p>
                <input
                  v-model.number="mealConfig.carbs"
                  type="number"
                  min="0"
                  step="0.1"
                  class="w-full text-center text-2xl font-black text-orange-600 bg-gray-50 border-2 border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p class="text-xs text-gray-500 mt-1">gramos</p>
              </div>
              <div class="bg-white rounded-lg p-4 text-center shadow-sm">
                <p class="text-xs text-gray-600 font-semibold mb-2">Grasas</p>
                <input
                  v-model.number="mealConfig.fats"
                  type="number"
                  min="0"
                  step="0.1"
                  class="w-full text-center text-2xl font-black text-yellow-600 bg-gray-50 border-2 border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <p class="text-xs text-gray-500 mt-1">gramos</p>
              </div>
            </div>

            <!-- Si viene de búsqueda manual, solo mostrar -->
            <div v-else class="grid grid-cols-2 gap-3">
              <div class="bg-white rounded-lg p-4 text-center shadow-sm">
                <p class="text-xs text-gray-600 font-semibold mb-1">Calorías</p>
                <p class="text-3xl font-black text-primary-600">{{ mealConfig.calories }}</p>
                <p class="text-xs text-gray-500">kcal</p>
              </div>
              <div class="bg-white rounded-lg p-4 text-center shadow-sm">
                <p class="text-xs text-gray-600 font-semibold mb-1">Proteína</p>
                <p class="text-3xl font-black text-blue-600">{{ mealConfig.protein }}</p>
                <p class="text-xs text-gray-500">gramos</p>
              </div>
              <div class="bg-white rounded-lg p-4 text-center shadow-sm">
                <p class="text-xs text-gray-600 font-semibold mb-1">Carbohidratos</p>
                <p class="text-3xl font-black text-orange-600">{{ mealConfig.carbs }}</p>
                <p class="text-xs text-gray-500">gramos</p>
              </div>
              <div class="bg-white rounded-lg p-4 text-center shadow-sm">
                <p class="text-xs text-gray-600 font-semibold mb-1">Grasas</p>
                <p class="text-3xl font-black text-yellow-600">{{ mealConfig.fats }}</p>
                <p class="text-xs text-gray-500">gramos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 bg-gray-50 rounded-b-3xl">
        <div v-if="step === 'search'" class="flex justify-center">
          <button
            @click="handleClose"
            class="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all"
          >
            Cancelar
          </button>
        </div>
        <div v-if="step === 'configure'" class="flex space-x-3">
          <button
            @click="selectedFood ? goBackToSearch() : (step = 'search')"
            class="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all"
            :disabled="isSaving"
          >
            ← Volver
          </button>
          <button
            @click="selectedFood ? saveMeal() : saveMealFromAudio()"
            :disabled="isSaving || mealConfig.grams <= 0"
            class="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold rounded-xl hover:from-primary-700 hover:to-primary-600 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!isSaving">Guardar Comida</span>
            <span v-else class="flex items-center justify-center space-x-2">
              <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Guardando...</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
