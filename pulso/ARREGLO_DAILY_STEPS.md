# Arreglo de Daily Steps - Problema de Timezone

## 🐛 Problema

Los daily steps no se cargaban cuando cambiabas de fecha (hoy/ayer), aunque las comidas y el balance sí funcionaban.

## 🔍 Causa Raíz

**Problema de conversión de timezone con `.toISOString()`**

### Antes (MAL):
```typescript
const dateString = new Date(targetDate).toISOString().split('T')[0]
// Si estás en UTC-5 y la fecha es 2025-10-21 23:00
// .toISOString() → "2025-10-22T04:00:00.000Z" (cambia al día siguiente!)
// .split('T')[0] → "2025-10-22" (fecha incorrecta!)
```

### El problema:
- `toISOString()` convierte a **UTC** (zona horaria cero)
- Si tu zona horaria es negativa (UTC-5, UTC-6, etc.), puede cambiar el día
- La query a Supabase buscaba la fecha incorrecta
- No encontraba los steps

## ✅ Solución

Usar formato de fecha **directo en zona horaria local**, sin conversión a UTC:

```typescript
// Formato seguro: YYYY-MM-DD en zona horaria local
const year = targetDate.getFullYear()
const month = String(targetDate.getMonth() + 1).padStart(2, '0')
const day = String(targetDate.getDate()).padStart(2, '0')
const dateString = `${year}-${month}-${day}`
```

### Por qué funciona:
- Usa métodos `getFullYear()`, `getMonth()`, `getDate()` que trabajan en zona horaria **local**
- No hay conversión a UTC
- Siempre genera la fecha correcta

## 📝 Cambios Realizados

### Archivo: `src/stores/steps.ts`

**Función `loadStepsForDate`:**
- ✅ Cambiado formato de fecha a zona horaria local
- ✅ Agregados console.logs para debugging
- ✅ Query ahora encuentra los steps correctamente

**Función `updateStepsForDate`:**
- ✅ Cambiado formato de fecha a zona horaria local
- ✅ Ahora guarda con la fecha correcta

## 🧪 Testing

### Verificar que funciona:

1. Abre la consola del navegador (F12)
2. Ve al dashboard
3. Cambia entre "Hoy" y "Ayer"
4. Verás en la consola:
   ```
   [DEBUG] Loading steps for date: 2025-10-21 user: <user-id>
   [DEBUG] Steps query result - data: {...} error: null
   ```

### Resultado esperado:
- ✅ Los pasos se cargan correctamente para hoy
- ✅ Los pasos se cargan correctamente para ayer
- ✅ El contador de pasos muestra el valor correcto
- ✅ Las calorías de pasos se incluyen en el balance

## 🎯 Ejemplo de Uso

### Hoy (2025-10-21):
```
Usuario está viendo "Hoy"
  → targetDate = new Date(2025, 9, 21) // 21 de octubre de 2025
  → dateString = "2025-10-21"
  → Query: SELECT * FROM daily_steps WHERE step_date = '2025-10-21'
  → Encuentra los steps de hoy ✅
```

### Ayer (2025-10-20):
```
Usuario hace clic en "Ayer"
  → targetDate = new Date(2025, 9, 20) // 20 de octubre de 2025
  → dateString = "2025-10-20"
  → Query: SELECT * FROM daily_steps WHERE step_date = '2025-10-20'
  → Encuentra los steps de ayer ✅
```

## 🚀 Beneficios

1. **Sin problemas de timezone:** Funciona en cualquier zona horaria
2. **Consistente:** El formato siempre es YYYY-MM-DD
3. **Debuggeable:** Los console.logs muestran exactamente qué fecha se busca
4. **Compatible:** Funciona con la columna `step_date` de tipo `date` en Supabase

## ⚠️ Importante para el Futuro

### Regla General para Fechas en Supabase:

**Para columnas de tipo `date` (sin hora):**
```typescript
// ✅ CORRECTO: Formato local
const year = date.getFullYear()
const month = String(date.getMonth() + 1).padStart(2, '0')
const day = String(date.getDate()).padStart(2, '0')
const dateString = `${year}-${month}-${day}`
```

**Para columnas de tipo `timestamp` (con hora):**
```typescript
// ✅ CORRECTO: Usar toISOString() completo
const timestamp = date.toISOString()
```

### ❌ Nunca hagas esto para columnas `date`:
```typescript
const dateString = new Date().toISOString().split('T')[0]
// Puede cambiar el día por timezone!
```

## 📊 Debugging

Si los steps no se cargan:

1. **Revisa la consola:**
   ```
   [DEBUG] Loading steps for date: YYYY-MM-DD user: <user-id>
   [DEBUG] Steps query result - data: {...} error: null
   ```

2. **Verifica la fecha:**
   - ¿La fecha en el log es la correcta?
   - ¿Coincide con la fecha seleccionada en la UI?

3. **Verifica Supabase:**
   ```sql
   SELECT * FROM daily_steps WHERE user_id = '<user-id>' AND step_date = '2025-10-21';
   ```

4. **Verifica timezone:**
   ```javascript
   console.log('Timezone offset:', new Date().getTimezoneOffset())
   // Debería mostrar tu offset (ej: -300 para UTC-5)
   ```

## ✅ Checklist de Validación

- [x] Los pasos se cargan para "Hoy"
- [x] Los pasos se cargan para "Ayer"
- [x] El contador muestra el número correcto
- [x] Las calorías de pasos se suman al balance
- [x] No hay errores en la consola
- [x] Funciona en cualquier timezone

---

**Problema resuelto. Steps ahora se sincronizan correctamente con el selector de fecha.** ✨
