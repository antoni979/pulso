import { GoogleGenerativeAI } from '@google/generative-ai'
import { ref } from 'vue'

interface FoodItem {
  name: string
  grams: number
  calories: number
  protein: number
  carbs: number
  fats: number
}

interface NutritionAnalysis {
  name: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  grams: number
  calories: number
  protein: number
  carbs: number
  fats: number
  items: FoodItem[]  // Lista de alimentos individuales
}

export function useGeminiNutrition() {
  const isAnalyzing = ref(false)
  const error = ref<string | null>(null)

  const analyzeAudioNutrition = async (audioBlob: Blob): Promise<NutritionAnalysis> => {
    isAnalyzing.value = true
    error.value = null

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey) {
        throw new Error('VITE_GEMINI_API_KEY no está configurada')
      }

      const genAI = new GoogleGenerativeAI(apiKey)

      // Usar Gemini 2.0 Flash que soporta audio y es rápido
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

      // Convertir audio a base64
      const audioBase64 = await blobToBase64(audioBlob)

      const prompt = `Eres un experto nutricionista. Analiza este audio donde el usuario describe una comida que ha consumido.

Debes extraer:
1. El tipo de comida (desayuno/breakfast, almuerzo/lunch, cena/dinner, o snack)
2. Nombre descriptivo del plato completo
3. DESGLOSE INDIVIDUAL de cada alimento con su cantidad en gramos
4. Análisis nutricional EXACTO basado en bases de datos nutricionales estándar (USDA, tablas nutricionales españolas)

Sé MUY PRECISO con los valores nutricionales. Usa datos reales de alimentos.

Responde SOLO con un objeto JSON válido, sin texto adicional:
{
  "meal_type": "breakfast" | "lunch" | "dinner" | "snack",
  "name": "nombre descriptivo del plato completo",
  "grams": suma total de gramos de todos los items,
  "calories": suma total de calorías,
  "protein": suma total de proteínas,
  "carbs": suma total de carbohidratos,
  "fats": suma total de grasas,
  "items": [
    {
      "name": "nombre del alimento individual",
      "grams": cantidad en gramos,
      "calories": calorías de este item,
      "protein": proteínas de este item,
      "carbs": carbohidratos de este item,
      "fats": grasas de este item
    }
  ]
}

Ejemplo de audio: "Para el almuerzo comí 200 gramos de pollo a la plancha con 150 gramos de arroz blanco"
Respuesta esperada:
{
  "meal_type": "lunch",
  "name": "Pollo a la plancha con arroz blanco",
  "grams": 350,
  "calories": 495,
  "protein": 52,
  "carbs": 53,
  "fats": 5,
  "items": [
    {
      "name": "Pollo a la plancha",
      "grams": 200,
      "calories": 330,
      "protein": 50,
      "carbs": 0,
      "fats": 5
    },
    {
      "name": "Arroz blanco",
      "grams": 150,
      "calories": 165,
      "protein": 2,
      "carbs": 53,
      "fats": 0
    }
  ]
}`

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: 'audio/webm',
            data: audioBase64
          }
        },
        { text: prompt }
      ])

      const response = await result.response
      const text = response.text()

      // Extraer JSON del texto (puede venir con markdown)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No se pudo extraer información nutricional del audio')
      }

      const nutritionData: NutritionAnalysis = JSON.parse(jsonMatch[0])

      // Validar datos
      if (!nutritionData.name || !nutritionData.meal_type ||
          nutritionData.calories < 0 || nutritionData.grams < 0) {
        throw new Error('Datos nutricionales inválidos')
      }

      return nutritionData
    } catch (err) {
      console.error('Error al analizar audio:', err)
      error.value = err instanceof Error ? err.message : 'Error desconocido al analizar el audio'
      throw err
    } finally {
      isAnalyzing.value = false
    }
  }

  return {
    isAnalyzing,
    error,
    analyzeAudioNutrition
  }
}

// Función auxiliar para convertir Blob a base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      // Remover el prefijo "data:audio/webm;base64,"
      const base64Data = base64.split(',')[1]
      resolve(base64Data)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
