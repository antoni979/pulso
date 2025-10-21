# Sistema de Fecha Sincronizado - Documentación

## 🎯 Resumen

Hemos implementado un sistema **completamente sincronizado** para gestionar la fecha seleccionada en toda la aplicación. Ahora cuando cambias de día (Hoy/Ayer), **TODO se actualiza automáticamente**:

- ✅ Comidas registradas
- ✅ Ejercicios realizados
- ✅ Pasos caminados
- ✅ Totales de calorías
- ✅ Macros (proteína, carbos, grasas)

---

## 🏗️ Arquitectura

### Composable Centralizado: `useSelectedDate`

**Archivo:** `src/composables/useSelectedDate.ts`

Este es el **corazón del sistema**. Todos los stores (meals, workouts, steps) escuchan la misma fecha global.

#### Funciones disponibles:

```typescript
const {
  selectedDate,      // Ref<Date> - Fecha actualmente seleccionada
  isToday,          // Computed<boolean> - ¿Es hoy?
  isYesterday,      // Computed<boolean> - ¿Es ayer?
  dateLabel,        // Computed<string> - "Hoy", "Ayer" o fecha completa
  selectedDateRange, // Computed - Inicio/fin del día para queries
  setDate,          // (date: Date) => void - Setear fecha específica
  goToToday,        // () => void - Ir a hoy
  goToYesterday     // () => void - Ir a ayer
} = useSelectedDate()
```

---

## 🔄 Flujo de Sincronización

### 1. Usuario hace clic en "Ayer" o "Hoy"

```
Usuario → goToYesterday() → selectedDate.value cambia
                                    ↓
                          Watch en DashboardView detecta cambio
                                    ↓
                          loadAllDataForSelectedDate()
                                    ↓
            ┌──────────────────────┼──────────────────────┐
            ↓                      ↓                      ↓
  mealsStore.loadMealsForDate()  workoutsStore.loadWorkoutsForDate()  stepsStore.loadStepsForDate()
            ↓                      ↓                      ↓
       Carga comidas         Carga ejercicios        Carga pasos
        del día                del día                del día
```

### 2. Sincronización Automática

**DashboardView.vue** tiene un `watch` que escucha cambios en `selectedDate`:

```typescript
watch(selectedDate, async () => {
  await loadAllDataForSelectedDate()
})
```

Esto asegura que **cualquier cambio** en la fecha recarga automáticamente todos los datos.

---

## 📦 Stores Actualizados

### 1. Meals Store (`src/stores/meals.ts`)

```typescript
// Antes
const selectedDate = ref<Date>(new Date()) // ❌ Local

// Ahora
const { selectedDate } = useSelectedDate() // ✅ Compartido globalmente
```

**Nuevas funciones:**
- `loadMealsForDate(date?: Date)` - Carga comidas de cualquier fecha
- `selectedDateMeals` - Computed con comidas de la fecha seleccionada
- `selectedDateTotals` - Computed con totales de la fecha seleccionada

### 2. Workouts Store (`src/stores/workouts.ts`)

**Nuevas funciones:**
- `loadWorkoutsForDate(date?: Date)` - Carga ejercicios de cualquier fecha
- `selectedDateWorkouts` - Computed con ejercicios de la fecha seleccionada
- `selectedDateTotalCaloriesBurned` - Computed con calorías quemadas

### 3. Steps Store (`src/stores/steps.ts`)

**Nuevas funciones:**
- `loadStepsForDate(date?: Date)` - Carga pasos de cualquier fecha
- `updateStepsForDate(steps, date?)` - Actualiza pasos de cualquier fecha
- `selectedDateSteps` - Ref con pasos de la fecha seleccionada
- `selectedDateStepsCalories` - Computed con calorías de pasos

---

## 🎨 UI del Selector de Fecha

### Componente: `DashboardView.vue`

```vue
<!-- Selector de Fecha -->
<div class="mb-6 bg-white rounded-2xl shadow-md border border-gray-200 p-4">
  <div class="flex items-center justify-between">
    <!-- Botón Ayer -->
    <button @click="goToYesterday" :class="isYesterday ? 'active' : ''">
      ← Ayer
    </button>

    <!-- Indicador Central -->
    <div class="flex flex-col items-center">
      📅 {{ dateLabel }}
      <div v-if="isToday" class="badge-today">🟢 Hoy</div>
      <div v-else-if="isYesterday" class="badge-yesterday">🔵 Ayer</div>
    </div>

    <!-- Botón Hoy -->
    <button @click="goToToday" :class="isToday ? 'active' : ''">
      Hoy →
    </button>
  </div>
</div>
```

### Estados Visuales

- **Botón activo:** Fondo verde/azul destacado
- **Badge "Hoy":** Animación de pulso verde
- **Badge "Ayer":** Badge azul estático
- **Otra fecha:** Muestra día completo (ej: "miércoles, 20 de octubre")

---

## 🔧 Funcionalidades Clave

### 1. Retrocompatibilidad

Todos los stores mantienen aliases para compatibilidad:

```typescript
// Funciona con código antiguo
const todayMeals = computed(() => selectedDateMeals.value)
const todayTotals = computed(() => selectedDateTotals.value)
```

### 2. Carga Automática al Cambiar Fecha

No necesitas hacer nada manualmente. El `watch` se encarga:

```typescript
// ✅ Automático
goToYesterday() // Esto automáticamente recarga todo

// ❌ Ya no necesitas hacer esto
goToYesterday()
await mealsStore.loadMealsForDate()
await workoutsStore.loadWorkoutsForDate()
// etc...
```

### 3. Actualización de Totales

Los totales se recalculan automáticamente cuando cambias de fecha:

- **Balance de Hoy** → **Balance de Ayer**
- **Calorías consumidas** (solo de ese día)
- **Calorías quemadas** (solo de ese día)
- **Macros** (proteína, carbos, grasas del día)

---

## 🧪 Testing Manual

### Caso 1: Ver datos de ayer

1. Abre el dashboard (verás datos de hoy)
2. Haz clic en **"← Ayer"**
3. Verifica que:
   - ✅ El badge cambia a "🔵 Ayer"
   - ✅ Las comidas mostradas son del día de ayer
   - ✅ Los ejercicios mostrados son del día de ayer
   - ✅ Los pasos mostrados son del día de ayer
   - ✅ Los totales de calorías son del día de ayer
   - ✅ Los macros son del día de ayer

### Caso 2: Volver a hoy

1. Estando en "Ayer"
2. Haz clic en **"Hoy →"**
3. Verifica que:
   - ✅ El badge cambia a "🟢 Hoy" con animación
   - ✅ Todo vuelve a mostrar datos de hoy

### Caso 3: Agregar comida en "Ayer"

1. Ve a "Ayer"
2. Agrega una comida (foto o audio)
3. Verifica que:
   - ✅ La comida se agrega a ayer (no a hoy)
   - ✅ Los totales de ayer se actualizan
   - ✅ Si vuelves a "Hoy", los totales de hoy NO cambian

---

## 🐛 Debugging

Si algo no funciona, verifica:

### 1. Consola del navegador

```javascript
// Ver fecha seleccionada actual
console.log(selectedDate.value)

// Ver comidas del store
console.log(mealsStore.selectedDateMeals)

// Ver ejercicios del store
console.log(workoutsStore.selectedDateWorkouts)

// Ver pasos del store
console.log(stepsStore.selectedDateSteps)
```

### 2. Vue DevTools

- Inspecciona `useSelectedDate` para ver la fecha actual
- Inspecciona cada store para ver los computed values
- Verifica que el `watch` en DashboardView se está ejecutando

### 3. Network Tab (F12 → Network)

Cuando cambias de fecha, deberías ver 3 llamadas a Supabase:
- `GET /meals?...gte=<fecha>&lt=<fecha+1>`
- `GET /workouts?...gte=<fecha>&lt=<fecha+1>`
- `GET /daily_steps?...eq=<fecha>`

---

## 🚀 Extensiones Futuras

### Agregar navegación por calendario

```typescript
// En useSelectedDate.ts
function goToDate(date: Date) {
  selectedDate.value = new Date(date)
  selectedDate.value.setHours(0, 0, 0, 0)
}
```

### Agregar navegación +1 día / -1 día

```typescript
function goToNextDay() {
  const next = new Date(selectedDate.value)
  next.setDate(next.getDate() + 1)
  selectedDate.value = next
}

function goToPreviousDay() {
  const prev = new Date(selectedDate.value)
  prev.setDate(prev.getDate() - 1)
  selectedDate.value = prev
}
```

### Agregar selector de semana

```typescript
function goToWeekStart() {
  const week = new Date(selectedDate.value)
  week.setDate(week.getDate() - week.getDay())
  selectedDate.value = week
}
```

---

## ✅ Checklist de Validación

Marca cada punto después de probarlo:

- [ ] Ver datos de hoy funciona
- [ ] Ver datos de ayer funciona
- [ ] Cambiar de ayer a hoy funciona
- [ ] Cambiar de hoy a ayer funciona
- [ ] Agregar comida en "ayer" la guarda en ayer (no en hoy)
- [ ] Agregar ejercicio en "ayer" lo guarda en ayer
- [ ] Agregar pasos en "ayer" los guarda en ayer
- [ ] Los totales de calorías cambian correctamente
- [ ] Los macros cambian correctamente
- [ ] El badge "Hoy" tiene animación de pulso
- [ ] El badge "Ayer" aparece correctamente
- [ ] No hay errores en la consola
- [ ] No hay errores de compilación

---

## 📚 Archivos Modificados

1. ✅ `src/composables/useSelectedDate.ts` (NUEVO)
2. ✅ `src/stores/meals.ts` (MODIFICADO)
3. ✅ `src/stores/workouts.ts` (MODIFICADO)
4. ✅ `src/stores/steps.ts` (MODIFICADO)
5. ✅ `src/views/DashboardView.vue` (MODIFICADO)

---

## 💡 Resumen Ejecutivo

**Antes:** Cada store tenía su propia fecha. Cambiar de día solo afectaba a las comidas.

**Ahora:** Hay una única fecha compartida globalmente. Cambiar de día actualiza **TODO** automáticamente.

**Beneficio:** Sistema robusto, sincronizado y fácil de mantener. ✨
