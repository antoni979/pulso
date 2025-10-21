# Plan de Testing Manual - Pulso

Este documento describe cómo probar manualmente las funcionalidades de registro de comidas con foto y audio para asegurar que todo funciona correctamente.

## Cambios Realizados

### 1. Problema: Foto NO detectaba nada (se quedaba "pensando")
**Solución aplicada:**
- ✅ Agregado timeout de 30 segundos a la llamada de Gemini Vision API
- ✅ Mejorada configuración del modelo con parámetros específicos
- ✅ Mejor manejo de errores con mensajes claros

**Archivos modificados:**
- `src/composables/useGeminiNutrition.ts` (líneas 138-157)

### 2. Problema: Audio guardaba pero NO sumaba al total diario
**Solución aplicada:**
- ✅ Agregada recarga de comidas después de guardar en `handleFoodSaved()`
- ✅ El store ahora recarga `loadTodayMeals()` después de cada guardado exitoso
- ✅ Los totales se calculan correctamente después de recargar

**Archivos modificados:**
- `src/views/DashboardView.vue` (líneas 41-47)
- `src/composables/useGeminiNutrition.ts` (timeout para audio también)

---

## Plan de Testing Manual

### Pre-requisitos
1. La aplicación debe estar corriendo: `npm run dev`
2. Debes estar autenticado en la aplicación
3. Tener acceso a la cámara/micrófono del dispositivo
4. La API key de Gemini debe estar configurada en `.env`

### Test 1: Registro de Comida con Foto 📸

**Objetivo:** Verificar que el flujo de foto detecta alimentos, calcula valores nutricionales y suma al total.

**Pasos:**
1. Abre el dashboard
2. Anota el total de calorías actual (ej: 500 kcal)
3. Haz clic en el botón "Comida"
4. Haz clic en el botón "📸 Foto"
5. Toma una foto de un plato de comida (o selecciona una de galería)
6. **Espera máximo 30 segundos** para el análisis

**Resultado esperado:**
- ✅ La pantalla cambia a "Analizando Imagen" con spinner
- ✅ Después del análisis, aparece la pantalla "Configurar Comida"
- ✅ Se muestran los alimentos detectados con sus valores nutricionales
- ✅ Puedes editar los valores si es necesario
- ✅ Al hacer clic en "Guardar Comida", se guarda correctamente
- ✅ **EL TOTAL DE CALORÍAS SE ACTUALIZA** (ej: 500 → 850 kcal)
- ✅ La nueva comida aparece en el historial

**Casos de error:**
- ❌ Si pasan 30 segundos sin respuesta: Aparece mensaje "Timeout: El análisis de la imagen tardó demasiado"
- ❌ Si la imagen no es válida: Aparece mensaje de error claro
- ❌ Si no hay API key: Aparece "VITE_GEMINI_API_KEY no está configurada"

---

### Test 2: Registro de Comida con Audio 🎤

**Objetivo:** Verificar que el flujo de audio detecta comidas, calcula valores nutricionales y suma al total.

**Pasos:**
1. Abre el dashboard
2. Anota el total de calorías actual (ej: 850 kcal)
3. Haz clic en el botón "Comida"
4. Haz clic en el botón "🎤 Audio"
5. Describe tu comida en voz alta:
   - Ejemplo: "Para el almuerzo comí 200 gramos de pollo a la plancha con 150 gramos de arroz blanco"
6. Haz clic en "✓ Detener y Analizar"
7. **Espera máximo 30 segundos** para el análisis

**Resultado esperado:**
- ✅ La pantalla muestra "Grabando..." con animación de micrófono
- ✅ Al detener, cambia a "Analizando tu comida..."
- ✅ Después del análisis, aparece la pantalla "Configurar Comida"
- ✅ Se muestran los alimentos detectados individualmente
- ✅ Los valores nutricionales son precisos (basados en datos reales)
- ✅ Puedes editar los valores si es necesario
- ✅ Al hacer clic en "Guardar Comida", se guarda correctamente
- ✅ **EL TOTAL DE CALORÍAS SE ACTUALIZA** (ej: 850 → 1345 kcal)
- ✅ La nueva comida aparece en el historial con el desglose

**Casos de error:**
- ❌ Si pasan 30 segundos sin respuesta: Aparece mensaje "Timeout: El análisis del audio tardó demasiado"
- ❌ Si el audio no se graba: Aparece mensaje de error claro
- ❌ Si no hay permisos de micrófono: Aparece mensaje pidiendo permisos

---

### Test 3: Verificación de Totales Diarios 📊

**Objetivo:** Asegurar que los totales se calculan correctamente en todas las vistas.

**Pasos:**
1. Después de agregar varias comidas (foto y audio)
2. Verifica en el dashboard:
   - Balance de Hoy muestra calorías totales
   - Tab "💪 Macros" muestra proteínas, carbos, grasas correctos
   - Tab "📋 Historial" muestra todas las comidas del día
3. Refresca la página (F5)
4. Verifica que los totales persisten

**Resultado esperado:**
- ✅ Los totales son consistentes en todas las vistas
- ✅ Después de refrescar, los datos persisten correctamente
- ✅ Las barras de progreso de macros son precisas
- ✅ El balance calórico es correcto (Consumidas - Quemadas)

---

### Test 4: Robustez y Manejo de Errores 🛡️

**Objetivo:** Verificar que la aplicación maneja errores gracefully.

**Casos a probar:**

#### 4.1 Timeout
1. Si Gemini tarda más de 30 segundos (poco probable en condiciones normales)
2. Debe aparecer mensaje de error claro
3. Debes poder intentar de nuevo

#### 4.2 Sin conexión
1. Desactiva el WiFi/datos
2. Intenta agregar comida con foto o audio
3. Debe aparecer error de red
4. Al reconectar, debes poder intentar de nuevo

#### 4.3 Cancelación
1. Inicia grabación de audio
2. Haz clic en "Cancelar"
3. Debe volver a la pantalla de búsqueda sin guardar nada

#### 4.4 Edición de valores
1. Después de análisis de audio/foto
2. Edita manualmente calorías/macros
3. Guarda la comida
4. Verifica que se guardaron los valores editados (no los originales)

---

## Checklist de Validación Final

Marca cada punto después de probarlo:

### Funcionalidad Foto
- [ ] Captura de foto funciona
- [ ] Análisis con Gemini funciona (< 30s)
- [ ] Valores nutricionales son razonables
- [ ] Guardado funciona correctamente
- [ ] **Total diario SE ACTUALIZA** ✨
- [ ] Aparece en historial

### Funcionalidad Audio
- [ ] Grabación de audio funciona
- [ ] Análisis con Gemini funciona (< 30s)
- [ ] Desglose de alimentos es correcto
- [ ] Guardado funciona correctamente
- [ ] **Total diario SE ACTUALIZA** ✨
- [ ] Aparece en historial con items

### Totales y UI
- [ ] Balance de Hoy actualiza en tiempo real
- [ ] Macros se calculan correctamente
- [ ] Historial muestra todas las comidas
- [ ] Los datos persisten después de refrescar
- [ ] No hay errores en consola del navegador

### Manejo de Errores
- [ ] Timeout funciona (si aplica)
- [ ] Errores de red se manejan bien
- [ ] Cancelación funciona correctamente
- [ ] Mensajes de error son claros

---

## Debugging

Si encuentras problemas, revisa:

1. **Consola del navegador** (F12 → Console)
   - Busca errores en rojo
   - Busca mensajes de "Error al..."

2. **Network tab** (F12 → Network)
   - Verifica llamadas a Gemini API
   - Chequea llamadas a Supabase

3. **Vue DevTools**
   - Inspecciona el estado de `mealsStore`
   - Verifica que `todayMeals` y `todayTotals` se actualizan

4. **Variables de entorno**
   ```bash
   # Verifica que existan:
   cat .env | grep VITE_GEMINI_API_KEY
   cat .env | grep VITE_SUPABASE_URL
   ```

---

## Próximos Pasos (Opcional)

Si todo funciona correctamente, considera:

1. **Tests automatizados**: Agregar tests unitarios con Vitest
2. **Monitoring**: Agregar analytics para trackear errores de Gemini
3. **Optimizaciones**: Cache de resultados de Gemini para imágenes similares
4. **UX**: Agregar feedback más visual durante el análisis (ej: % de progreso)

---

## Contacto

Si encuentras bugs después de este testing, documéntalos con:
- Pasos para reproducir
- Screenshots/videos
- Mensajes de error de la consola
- Navegador y versión
