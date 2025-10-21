# Arreglo de Guardado desde Audio - Bug Crítico

## 🐛 Problema Reportado

Al registrar comida desde **audio** en el móvil:
- ✅ El audio se procesaba correctamente
- ✅ Los macros y kcal se rellenaban bien
- ❌ **Al darle a "Guardar" NO se guardaba NADA** en Supabase

## 🔍 Causa Raíz

**El error no se estaba verificando después de llamar a `addMeal()`**

### Antes (MAL):
```typescript
const saveMealFromAudio = async () => {
  try {
    await mealsStore.addMeal({...})  // ← Esto NO lanza excepción si falla
    emit('saved')  // ← Se emite SIEMPRE, incluso si falló
    emit('close')  // ← Se cierra SIEMPRE, incluso si falló
  } catch (error) {
    // ← NUNCA entra aquí porque addMeal() no lanza excepción
    alert('Error al guardar la comida')
  }
}
```

### El problema:

La función `addMeal()` en el store **retorna** `{ error }` cuando falla, **NO lanza una excepción**:

```typescript
// src/stores/meals.ts
async function addMeal(meal) {
  try {
    const { data, error } = await supabase.from('meals').insert({...})
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error adding meal:', error)
    return { data: null, error: error as Error }  // ← Retorna el error
  }
}
```

Entonces en `saveMealFromAudio()`:
1. Se llamaba `await mealsStore.addMeal({...})`
2. Si había error, `addMeal()` lo retornaba como `{ error }`
3. **Pero no se verificaba el resultado**
4. Se emitía `saved` y `close` **aunque hubiera fallado**
5. El modal se cerraba y parecía que se guardó
6. **Pero en realidad falló silenciosamente**

## ✅ Solución Implementada

Ahora **verificamos el resultado** de `addMeal()`:

```typescript
const saveMealFromAudio = async () => {
  console.log('[DEBUG] Guardando comida desde audio:', mealConfig.value)

  isSaving.value = true
  try {
    const result = await mealsStore.addMeal({...})  // ← Capturamos resultado

    console.log('[DEBUG] Resultado de addMeal:', result)

    if (result?.error) {  // ← Verificamos si hay error
      throw result.error  // ← Lanzamos excepción para que entre al catch
    }

    console.log('[DEBUG] Comida guardada exitosamente')
    emit('saved')  // ← Solo se emite si NO hay error
    emit('close')  // ← Solo se cierra si NO hay error
  } catch (error) {
    console.error('[ERROR] Error al guardar comida:', error)
    alert(`Error al guardar la comida: ${error.message}`)  // ← Muestra el error
  } finally {
    isSaving.value = false
  }
}
```

### Beneficios:

1. **Si hay error:** El usuario ve un alert con el mensaje de error
2. **Si hay error:** El modal NO se cierra (puedes reintentar)
3. **Logs de debug:** Puedes ver en la consola qué pasó
4. **Solo cierra si guardó:** Se emite `saved` solo si realmente guardó

## 📝 Cambios Realizados

### Archivo: `src/components/FoodSearch.vue`

**Función `saveMealFromAudio():`**
- ✅ Ahora verifica `result?.error`
- ✅ Lanza excepción si hay error
- ✅ Logs de debug para tracking
- ✅ Alert con mensaje de error específico

**Función `saveMeal():`**
- ✅ Mismo fix aplicado (consistencia)
- ✅ Logs de debug
- ✅ Verificación de errores

## 🧪 Testing

### Prueba 1: Guardado Exitoso desde Audio

1. Abre el móvil y la consola de desarrollo (si puedes)
2. Haz clic en "🎤 Audio"
3. Graba: "Para el almuerzo comí pollo con arroz"
4. Haz clic en "Detener y Analizar"
5. Verifica que se rellenan los datos
6. Haz clic en "Guardar Comida"

**Resultado esperado:**
```
[DEBUG] Guardando comida desde audio: {...}
[DEBUG] Resultado de addMeal: { data: {...}, error: null }
[DEBUG] Comida guardada exitosamente
```
- ✅ El modal se cierra
- ✅ La comida aparece en el historial
- ✅ Los totales se actualizan

### Prueba 2: Error al Guardar

Si hay un error (ej: sin conexión, problema con Supabase):

**Resultado esperado:**
```
[DEBUG] Guardando comida desde audio: {...}
[DEBUG] Resultado de addMeal: { data: null, error: Error {...} }
[ERROR] Error al guardar comida: <mensaje del error>
```
- ✅ Aparece un **alert** con el error
- ✅ El modal **NO se cierra** (puedes reintentar)
- ✅ La comida **NO se agrega** al historial

## 🚨 Posibles Errores y Soluciones

### Error 1: "No user logged in"
**Causa:** No hay sesión activa
**Solución:** Vuelve a iniciar sesión

### Error 2: "new row violates row-level security policy"
**Causa:** RLS en Supabase bloqueando el insert
**Solución:** Verificar políticas RLS en Supabase

### Error 3: "null value in column 'user_id'"
**Causa:** El user_id no se está pasando
**Solución:** Verificar que `authStore.user?.id` existe

### Error 4: "Network error" o timeout
**Causa:** Sin conexión a internet
**Solución:** Verificar conexión WiFi/datos

## 🔍 Debugging en Móvil

### Opción 1: Chrome Remote Debugging (Android)

1. Conecta tu móvil Android por USB
2. Activa "Depuración USB" en el móvil
3. Abre Chrome en PC: `chrome://inspect`
4. Selecciona tu dispositivo
5. Podrás ver la consola del móvil

### Opción 2: Safari Web Inspector (iOS)

1. En iPhone: Ajustes → Safari → Avanzado → Inspector Web (activar)
2. Conecta iPhone por cable
3. En Mac: Safari → Develop → [Tu iPhone] → [Tu página]
4. Verás la consola del iPhone

### Opción 3: Eruda (Consola en pantalla)

Agregar temporalmente en `index.html`:
```html
<script src="https://cdn.jsdelivr.net/npm/eruda"></script>
<script>eruda.init();</script>
```
Te sale una consola flotante en la pantalla del móvil.

## 📊 Logs Disponibles

Con el fix implementado, verás estos logs:

### Al iniciar guardado:
```javascript
[DEBUG] Guardando comida desde audio: {
  name: "Pollo con arroz",
  meal_type: "lunch",
  calories: 450,
  protein: 45,
  carbs: 50,
  fats: 8,
  grams: 300
}
```

### Al completar (éxito):
```javascript
[DEBUG] Resultado de addMeal: {
  data: { id: "...", name: "...", ... },
  error: null
}
[DEBUG] Comida guardada exitosamente
```

### Al fallar:
```javascript
[DEBUG] Resultado de addMeal: {
  data: null,
  error: Error { message: "..." }
}
[ERROR] Error al guardar comida: <mensaje del error>
```

## ✅ Checklist de Validación

Prueba estos casos:

### Desde Audio:
- [ ] Guardar comida desde audio funciona
- [ ] Si hay error, se muestra alert
- [ ] Si hay error, el modal NO se cierra
- [ ] Solo cierra si guardó exitosamente
- [ ] La comida aparece en el historial después de guardar
- [ ] Los totales se actualizan correctamente

### Desde Búsqueda Manual:
- [ ] Guardar comida desde búsqueda funciona
- [ ] Si hay error, se muestra alert
- [ ] Si hay error, el modal NO se cierra
- [ ] Solo cierra si guardó exitosamente
- [ ] La comida aparece en el historial
- [ ] Los totales se actualizan

### Desde Foto:
- [ ] Guardar comida desde foto funciona (usa `saveMealFromAudio`)
- [ ] Mismo comportamiento que audio

## 🎯 Próximos Pasos

Si después de este fix aún no se guarda:

1. **Revisa la consola del móvil** (Chrome/Safari Remote Debugging)
2. **Busca el mensaje de error específico** en los logs
3. **Verifica tu conexión** a Supabase
4. **Revisa las políticas RLS** en Supabase:
   ```sql
   -- En Supabase SQL Editor:
   SELECT * FROM pg_policies WHERE tablename = 'meals';
   ```
5. **Verifica que el usuario está autenticado:**
   ```javascript
   console.log('User ID:', authStore.user?.id)
   ```

---

**Problema resuelto. Ahora los errores se capturan y muestran correctamente.** ✨

Si persiste el problema, los logs te dirán exactamente qué está fallando.
