# Testing de Guardado de Comidas - Todas las Fuentes

## Servidor de Desarrollo
**URL:** http://localhost:5174

## Problema Identificado y Solucionado

### ❌ Problema Original
- El guardado desde **foto** no funcionaba
- Había dos funciones separadas: `saveMeal()` y `saveMealFromAudio()`
- La validación era inconsistente entre ambas funciones
- El botón de guardar llamaba condicionalmente a diferentes funciones

### ✅ Solución Implementada
- **Función unificada**: Una sola función `saveMeal()` para manual, audio e imagen
- **Validaciones mejoradas**:
  - Nombre de la comida no puede estar vacío
  - Calorías deben ser > 0
  - Mensajes de error descriptivos con console.log para debug
- **Botón simplificado**: Siempre llama a `saveMeal()` sin condiciones

## Cambios en el Código

### `src/components/FoodSearch.vue`

#### Antes (línea 167-189 y 266-288):
```typescript
// Dos funciones separadas
const saveMeal = async () => {
  if (!selectedFood.value || mealConfig.value.grams <= 0) return
  // ... guardado
}

const saveMealFromAudio = async () => {
  if (mealConfig.value.grams <= 0 || mealConfig.value.calories <= 0) return
  // ... guardado duplicado
}
```

#### Después (línea 167-202):
```typescript
// Una sola función unificada
const saveMeal = async () => {
  // Validación básica
  if (!mealConfig.value.name || mealConfig.value.name.trim() === '') {
    alert('Por favor, ingresa un nombre para la comida')
    return
  }

  if (mealConfig.value.calories <= 0) {
    alert('Las calorías deben ser mayores a 0')
    return
  }

  isSaving.value = true
  try {
    console.log('Guardando comida:', mealConfig.value) // Debug

    await mealsStore.addMeal({
      name: mealConfig.value.name,
      meal_type: mealConfig.value.meal_type,
      calories: mealConfig.value.calories,
      protein: mealConfig.value.protein,
      carbs: mealConfig.value.carbs,
      fats: mealConfig.value.fats,
      eaten_at: new Date().toISOString()
    })

    console.log('Comida guardada exitosamente') // Debug
    emit('saved')
    emit('close')
  } catch (error) {
    console.error('Error al guardar comida:', error)
    alert('Error al guardar la comida: ' + (error instanceof Error ? error.message : 'Error desconocido'))
  } finally {
    isSaving.value = false
  }
}
```

#### Botón de Guardar (línea 805):
```vue
<!-- Antes -->
<button @click="selectedFood ? saveMeal() : saveMealFromAudio()">

<!-- Después -->
<button @click="saveMeal()" :disabled="isSaving || mealConfig.calories <= 0">
```

## Plan de Pruebas Manual

### ✅ Test 1: Guardado Manual (Búsqueda)
1. Abrir http://localhost:5174
2. Iniciar sesión
3. Click en "Registrar Comida" 🍽️
4. Buscar "pollo"
5. Seleccionar un alimento
6. Configurar tipo de comida, gramos
7. Click en "Guardar Comida"
8. **Verificar**:
   - ✅ Console muestra "Guardando comida:" con los datos
   - ✅ Console muestra "Comida guardada exitosamente"
   - ✅ Modal se cierra
   - ✅ Comida aparece en el historial
   - ✅ Totales del día se actualizan

### ✅ Test 2: Guardado desde Audio 🎤
1. Click en "Registrar Comida" 🍽️
2. Click en botón "Audio" 🎤
3. Permitir acceso al micrófono
4. Decir: "Para el almuerzo comí 200 gramos de pollo a la plancha con arroz"
5. Click en "Detener y Analizar"
6. Esperar análisis de Gemini
7. Verificar que aparecen los alimentos individuales
8. Click en "Guardar Comida"
9. **Verificar**:
   - ✅ Console muestra "Guardando comida:" con los datos
   - ✅ Console muestra "Comida guardada exitosamente"
   - ✅ Modal se cierra
   - ✅ Comida aparece en el historial
   - ✅ Totales del día se actualizan

### ✅ Test 3: Guardado desde Foto 📸
1. Click en "Registrar Comida" 🍽️
2. Click en botón "Foto" 📸
3. Tomar foto o seleccionar de galería
4. Esperar análisis de Gemini Vision
5. Verificar que aparecen:
   - Nombre del plato
   - Tipo de comida detectado
   - Alimentos individuales con cantidades
   - Valores nutricionales
6. (Opcional) Editar valores si es necesario
7. Click en "Guardar Comida"
8. **Verificar**:
   - ✅ Console muestra "Guardando comida:" con los datos
   - ✅ Console muestra "Comida guardada exitosamente"
   - ✅ Modal se cierra
   - ✅ Comida aparece en el historial
   - ✅ Totales del día se actualizan

## Validaciones Automáticas

### Caso 1: Nombre vacío
- **Acción**: Intentar guardar sin nombre
- **Resultado esperado**: Alert "Por favor, ingresa un nombre para la comida"
- **Status**: ⏳ Pendiente de probar

### Caso 2: Calorías en 0
- **Acción**: Intentar guardar con calorías = 0
- **Resultado esperado**:
  - Botón deshabilitado (opacity-50)
  - Alert "Las calorías deben ser mayores a 0" si se intenta
- **Status**: ⏳ Pendiente de probar

### Caso 3: Edición de valores
- **Acción**: En audio/foto, editar valores nutricionales antes de guardar
- **Resultado esperado**: Se guardan los valores editados, no los originales de Gemini
- **Status**: ⏳ Pendiente de probar

## Debug en Consola del Navegador

Al guardar una comida, deberías ver en la consola:

```javascript
// 1. Antes de guardar
Guardando comida: {
  meal_type: "lunch",
  grams: 350,
  name: "Pollo a la plancha con arroz",
  calories: 495,
  protein: 52,
  carbs: 53,
  fats: 5
}

// 2. Después de guardar exitosamente
Comida guardada exitosamente
```

Si hay un error, verás:
```javascript
Error al guardar comida: [mensaje de error detallado]
```

## Checklist de Verificación Final

- [ ] Test 1: Guardado manual funciona
- [ ] Test 2: Guardado desde audio funciona
- [ ] Test 3: Guardado desde foto funciona
- [ ] Validación de nombre vacío funciona
- [ ] Validación de calorías = 0 funciona
- [ ] Edición de valores se guarda correctamente
- [ ] Totales del día se actualizan después de guardar
- [ ] Modal se cierra después de guardar
- [ ] No hay errores en consola

## Próximos Pasos Después del Testing

Una vez confirmado que todo funciona:
1. Eliminar los `console.log` de debug (líneas 181 y 193)
2. Hacer commit de los cambios
3. Desplegar a producción (Vercel)
4. Eliminar este archivo de testing

---

**Fecha de creación**: 2025-10-18
**Desarrollador**: Claude Code
**Issue**: Guardado desde foto no funcionaba
**Estado**: ✅ Solucionado - Pendiente de testing manual
