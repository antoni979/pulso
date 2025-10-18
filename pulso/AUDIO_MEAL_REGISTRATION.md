# Registro de Comidas por Audio

## Descripción

Esta funcionalidad permite a los usuarios registrar sus comidas mediante grabación de audio. El sistema utiliza Google Gemini AI para transcribir el audio y analizar la información nutricional de manera precisa.

## Características

- **Grabación de audio** directamente desde el navegador
- **Análisis nutricional automático** usando Gemini 1.5 Flash
- **Cálculo preciso** de calorías, proteínas, carbohidratos y grasas
- **Detección automática** del tipo de comida (desayuno, almuerzo, cena, snack)
- **Estimación de cantidades** basada en porciones típicas si no se especifican gramos

## Cómo usar

1. **Abrir el modal de registro de comidas** haciendo click en el botón "Comida" del dashboard
2. **Click en "Grabar Audio"** (botón rojo destacado)
3. **Describir la comida** por voz. Ejemplo:
   - "Para el almuerzo comí 200 gramos de pollo a la plancha con arroz"
   - "Desayuno: dos huevos revueltos con una tostada integral"
   - "Cena: ensalada mixta con atún"
4. **Detener la grabación** cuando termines de hablar
5. **Revisar y ajustar** los valores calculados si es necesario
6. **Guardar** la comida

## Configuración

### Variables de Entorno

Necesitas configurar la API key de Google Gemini en tu archivo `.env`:

```bash
VITE_GEMINI_API_KEY=tu_api_key_de_gemini
```

### Obtener una API Key de Gemini

1. Visita [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Crea una nueva API key
4. Copia la clave y agrégala al archivo `.env`

## Arquitectura Técnica

### Composables

#### `useAudioRecorder.ts`
Maneja la grabación de audio usando la API de MediaRecorder del navegador.

**Funciones:**
- `startRecording()`: Inicia la grabación de audio
- `stopRecording()`: Detiene la grabación y retorna el Blob de audio
- `cancelRecording()`: Cancela la grabación actual

**Estados:**
- `isRecording`: Indica si está grabando
- `isProcessing`: Indica si está procesando el audio
- `error`: Mensajes de error

#### `useGeminiNutrition.ts`
Integra con Google Gemini AI para analizar el audio y extraer información nutricional.

**Funciones:**
- `analyzeAudioNutrition(audioBlob: Blob)`: Analiza un audio y retorna datos nutricionales

**Retorna:**
```typescript
interface NutritionAnalysis {
  name: string                    // Nombre descriptivo del plato
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  grams: number                   // Cantidad en gramos
  calories: number                // Calorías totales
  protein: number                 // Proteínas en gramos
  carbs: number                   // Carbohidratos en gramos
  fats: number                    // Grasas en gramos
}
```

### Modelo de IA

Se utiliza **Gemini 1.5 Flash** que:
- Soporta entrada de audio directamente
- Es rápido y eficiente
- Tiene conocimiento nutricional preciso basado en bases de datos estándar (USDA, tablas españolas)

### Flujo de Datos

```
1. Usuario graba audio
   ↓
2. Audio se convierte a Blob (formato webm)
   ↓
3. Blob se codifica en base64
   ↓
4. Se envía a Gemini con prompt específico
   ↓
5. Gemini analiza y retorna JSON con datos nutricionales
   ↓
6. Se validan los datos
   ↓
7. Se muestran al usuario para revisión
   ↓
8. Usuario confirma y se guarda en Supabase
```

## Precisión Nutricional

El sistema está diseñado para ser **muy preciso** en los cálculos nutricionales:

- Usa bases de datos nutricionales estándar (USDA, tablas españolas)
- Calcula valores por peso real, no por estimaciones genéricas
- Considera métodos de cocción cuando se especifican
- Ajusta valores según ingredientes combinados

## Limitaciones

- Requiere permiso del navegador para acceder al micrófono
- El audio debe estar en español (puede configurarse para otros idiomas)
- Requiere conexión a internet para el análisis
- La calidad del análisis depende de la claridad de la descripción

## Mejoras Futuras

- [ ] Soporte multi-idioma
- [ ] Historial de comidas frecuentes por voz
- [ ] Sugerencias de mejora nutricional en tiempo real
- [ ] Reconocimiento de marcas específicas de alimentos
- [ ] Análisis de recetas completas
