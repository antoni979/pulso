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

  const analyzeImageNutrition = async (imageBase64: string): Promise<NutritionAnalysis> => {
    isAnalyzing.value = true
    error.value = null

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey) {
        throw new Error('VITE_GEMINI_API_KEY no está configurada')
      }

      const genAI = new GoogleGenerativeAI(apiKey)

      // Usar Gemini 2.0 Flash que soporta imágenes y es rápido
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 2048,
        }
      })

      // Extraer solo la parte base64 (sin el prefijo data:image/...)
      const parts = imageBase64.split(',')
      const base64Data = parts.length > 1 ? parts[1] : imageBase64

      if (!base64Data) {
        throw new Error('No se pudo procesar la imagen')
      }

      const mimeTypeMatch = imageBase64.match(/data:(image\/[a-z]+);base64,/)
      const mimeType = mimeTypeMatch?.[1] || 'image/jpeg'

      const prompt = `Eres un experto nutricionista y chef profesional. Analiza esta imagen de comida con MÁXIMA PRECISIÓN.

INSTRUCCIONES CRÍTICAS:
1. Identifica TODOS los alimentos visibles en la imagen
2. Estima las porciones reales basándote en referencias visuales (tamaño de platos estándar: 20-25cm, cubiertos, etc.)
3. Calcula valores nutricionales EXACTOS usando bases de datos USDA, tablas nutricionales españolas, y tu conocimiento experto
4. Si ves múltiples alimentos, DESGLOSARLOS TODOS individualmente
5. Sé CONSERVADOR con las cantidades si hay duda (mejor subestimar que sobreestimar)
6. Considera el método de cocción (frito, hervido, etc.) para ajustar calorías

CRITERIOS DE PRECISIÓN:
- Para proteínas: Estima peso cocido (el pollo pierde 25-30% peso al cocinar)
- Para carbohidratos: Considera si están cocidos (arroz/pasta triplica su peso)
- Para grasas: Considera aceites de cocción visibles
- Para vegetales: Peso real sin desperdicio

Responde SOLO con un objeto JSON válido, sin texto adicional:
{
  "meal_type": "breakfast" | "lunch" | "dinner" | "snack",
  "name": "nombre descriptivo del plato completo",
  "grams": suma total de gramos estimados,
  "calories": suma total de calorías (PRECISIÓN ±10%),
  "protein": suma total de proteínas en gramos,
  "carbs": suma total de carbohidratos en gramos,
  "fats": suma total de grasas en gramos,
  "items": [
    {
      "name": "nombre del alimento individual con método de cocción",
      "grams": cantidad estimada en gramos,
      "calories": calorías de este item,
      "protein": proteínas de este item,
      "carbs": carbohidratos de este item,
      "fats": grasas de este item
    }
  ]
}

EJEMPLO:
Imagen: Plato con pechuga de pollo a la plancha, arroz blanco y brócoli al vapor

{
  "meal_type": "lunch",
  "name": "Pechuga de pollo a la plancha con arroz y brócoli",
  "grams": 450,
  "calories": 520,
  "protein": 48,
  "carbs": 58,
  "fats": 7,
  "items": [
    {
      "name": "Pechuga de pollo a la plancha",
      "grams": 180,
      "calories": 297,
      "protein": 45,
      "carbs": 0,
      "fats": 6
    },
    {
      "name": "Arroz blanco cocido",
      "grams": 200,
      "calories": 260,
      "protein": 5,
      "carbs": 57,
      "fats": 0.5
    },
    {
      "name": "Brócoli al vapor",
      "grams": 70,
      "calories": 24,
      "protein": 2,
      "carbs": 1,
      "fats": 0.5
    }
  ]
}`

      // Crear promesa con timeout de 30 segundos
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: El análisis de la imagen tardó demasiado. Por favor, inténtalo de nuevo.')), 30000)
      })

      const generatePromise = model.generateContent([
        {
          inlineData: {
            mimeType,
            data: base64Data
          }
        },
        { text: prompt }
      ])

      // Esperar la primera promesa que se resuelva (generación o timeout)
      const result = await Promise.race([generatePromise, timeoutPromise])

      const response = result.response
      const text = response.text()

      // Extraer JSON del texto (puede venir con markdown)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No se pudo extraer información nutricional de la imagen')
      }

      const nutritionData: NutritionAnalysis = JSON.parse(jsonMatch[0])

      // Validar datos
      if (!nutritionData.name || !nutritionData.meal_type ||
          nutritionData.calories < 0 || nutritionData.grams < 0) {
        throw new Error('Datos nutricionales inválidos')
      }

      return nutritionData
    } catch (err) {
      console.error('Error al analizar imagen:', err)
      error.value = err instanceof Error ? err.message : 'Error desconocido al analizar la imagen'
      throw err
    } finally {
      isAnalyzing.value = false
    }
  }

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

      // Crear promesa con timeout de 30 segundos
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: El análisis del audio tardó demasiado. Por favor, inténtalo de nuevo.')), 30000)
      })

      const generatePromise = model.generateContent([
        {
          inlineData: {
            mimeType: 'audio/webm',
            data: audioBase64
          }
        },
        { text: prompt }
      ])

      // Esperar la primera promesa que se resuelva (generación o timeout)
      const result = await Promise.race([generatePromise, timeoutPromise])

      const response = result.response
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
    analyzeImageNutrition,
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
      if (!base64Data) {
        reject(new Error('No se pudo convertir el audio a base64'))
        return
      }
      resolve(base64Data)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
