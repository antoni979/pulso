# Arreglo de Sincronización de Fecha - Resumen

## 🐛 Problema Original

Al cambiar entre "Hoy" y "Ayer":
- ❌ No cambiaba el balance de calorías
- ❌ No se mostraban las comidas correctas
- ❌ Los ejercicios no cambiaban
- ❌ Los pasos aparecían en 0

## 🔍 Causa Raíz

El problema tenía **3 causas principales**:

### 1. Computed Filters Incorrectos en Stores

**Antes:**
```typescript
const selectedDateMeals = computed(() => {
  const selected = new Date(selectedDate.value)
  return meals.value.filter(meal => {
    const mealDate = new Date(meal.eaten_at)
    return mealDate.getTime() === selected.getTime()
  })
})
```

**Problema:** Los stores filtraban en memoria DESPUÉS de cargar, pero como `selectedDate` cambiaba, el computed no se actualizaba correctamente porque `meals.value` seguía teniendo los datos viejos.

### 2. useCaloriesCalculation Usaba RPC de "Hoy"

**Antes:**
```typescript
await supabase.rpc('get_today_calorie_balance', ...)
```

**Problema:** Siempre pedía datos de HOY, ignorando la fecha seleccionada.

### 3. No Había Re-render al Cambiar Fecha

El watch funcionaba, pero los computed no se recalculaban porque usaban referencias viejas.

---

## ✅ Solución Implementada

### 1. Stores Confían en los Datos Cargados

**Ahora:**
```typescript
// Los meals ya vienen filtrados desde loadMealsForDate
const selectedDateMeals = computed(() => meals.value)
```

**Por qué funciona:** Cuando cambias de fecha:
1. Se ejecuta `loadMealsForDate(nuevaFecha)`
2. Esto carga SOLO las meals de esa fecha desde Supabase
3. `meals.value` se reemplaza completamente
4. El computed detecta el cambio y actualiza la UI

### 2. useCaloriesCalculation Ahora Usa Stores Directamente

**Ahora:**
```typescript
export function useCaloriesCalculation() {
  const mealsStore = useMealsStore()
  const workoutsStore = useWorkoutsStore()
  const stepsStore = useStepsStore()

  const caloriesConsumed = computed(() => mealsStore.selectedDateTotals.calories)
  const caloriesFromWorkouts = computed(() => workoutsStore.selectedDateTotalCaloriesBurned)
  const caloriesFromSteps = computed(() => stepsStore.selectedDateStepsCalories)

  // ... resto de cálculos
}
```

**Por qué funciona:**
- Ya no hace llamadas RPC
- Usa directamente los datos de los stores
- Como los stores se actualizan al cambiar fecha, los cálculos se recalculan automáticamente

### 3. Watch Automático Recarga Todo

**DashboardView.vue:**
```typescript
watch(selectedDate, async () => {
  await loadAllDataForSelectedDate()
})

const loadAllDataForSelectedDate = async () => {
  await Promise.all([
    mealsStore.loadMealsForDate(),    // Carga comidas de la fecha seleccionada
    workoutsStore.loadWorkoutsForDate(), // Carga ejercicios de la fecha seleccionada
    stepsStore.loadStepsForDate()       // Carga pasos de la fecha seleccionada
  ])
}
```

**Por qué funciona:**
- Cuando `selectedDate` cambia, se dispara el watch
- Se cargan TODOS los datos en paralelo
- Los stores se actualizan con los nuevos datos
- Los computed reactivos detectan el cambio
- La UI se actualiza automáticamente

---

## 🎯 Flujo Completo (Ahora)

```
Usuario hace clic en "Ayer"
         ↓
   goToYesterday() cambia selectedDate a ayer
         ↓
   Watch detecta cambio en selectedDate
         ↓
   loadAllDataForSelectedDate() se ejecuta
         ↓
   ┌──────────────────────────────────────────────────────┐
   │  Promise.all ejecuta 3 cargas en paralelo:           │
   │                                                       │
   │  1. loadMealsForDate(ayer)                           │
   │     → Query a Supabase: meals WHERE date = ayer      │
   │     → meals.value = [comidas de ayer]                │
   │                                                       │
   │  2. loadWorkoutsForDate(ayer)                        │
   │     → Query a Supabase: workouts WHERE date = ayer   │
   │     → workouts.value = [ejercicios de ayer]          │
   │                                                       │
   │  3. loadStepsForDate(ayer)                           │
   │     → Query a Supabase: steps WHERE date = ayer      │
   │     → selectedDateSteps.value = pasos de ayer        │
   └──────────────────────────────────────────────────────┘
         ↓
   Stores actualizados con datos de ayer
         ↓
   Computed se recalculan automáticamente:
   - selectedDateMeals (ahora apunta a comidas de ayer)
   - selectedDateTotals (suma calorías de ayer)
   - selectedDateWorkouts (ejercicios de ayer)
   - selectedDateStepsCalories (calorías de pasos de ayer)
         ↓
   useCaloriesCalculation detecta cambios:
   - caloriesConsumed actualizado
   - caloriesFromWorkouts actualizado
   - caloriesFromSteps actualizado
   - totalCaloriesBurned recalculado
   - netCalories recalculado
         ↓
   UI se actualiza automáticamente:
   ✅ Balance muestra "Balance de Ayer"
   ✅ Comidas de ayer aparecen en historial
   ✅ Ejercicios de ayer aparecen
   ✅ Pasos de ayer se muestran correctamente
   ✅ Totales son de ayer
```

---

## 📝 Cambios en Archivos

### Stores (3 archivos)

**src/stores/meals.ts**
- ✅ Removed filtrado en computed
- ✅ `selectedDateMeals` ahora apunta directamente a `meals.value`
- ✅ `loadMealsForDate` usa `useSelectedDate()` para obtener la fecha

**src/stores/workouts.ts**
- ✅ Removed filtrado en computed
- ✅ `selectedDateWorkouts` ahora apunta directamente a `workouts.value`
- ✅ `loadWorkoutsForDate` usa `useSelectedDate()` para obtener la fecha

**src/stores/steps.ts**
- ✅ Removed filtrado en computed
- ✅ `selectedDateSteps` ya es un ref directo (no computed)
- ✅ `loadStepsForDate` usa `useSelectedDate()` para obtener la fecha

### Composables (1 archivo)

**src/composables/useCaloriesCalculation.ts**
- ✅ Removed llamada RPC a `get_today_calorie_balance`
- ✅ Ahora usa directamente los stores
- ✅ Calcula TMB usando fórmula Harris-Benedict
- ✅ Todos los valores son computed reactivos
- ✅ `refresh()` ahora es dummy (los computed se actualizan solos)

### Views (1 archivo)

**src/views/DashboardView.vue**
- ✅ Removed import de `useWeeklyBalance`
- ✅ Removed llamadas a `refresh()`
- ✅ Watch automático recarga todo al cambiar fecha

---

## ✅ Testing

### Caso 1: Ver Ayer

1. Haz clic en "← Ayer"
2. **Resultado esperado:**
   - Badge cambia a "🔵 Ayer"
   - Las comidas mostradas son de ayer
   - Los ejercicios mostrados son de ayer
   - Los pasos mostrados son de ayer
   - El balance es de ayer
   - Los macros son de ayer

### Caso 2: Volver a Hoy

1. Estando en "Ayer", haz clic en "Hoy →"
2. **Resultado esperado:**
   - Badge cambia a "🟢 Hoy" con pulso
   - Todo vuelve a datos de hoy

### Caso 3: Agregar Comida en Ayer

1. Ve a "Ayer"
2. Agrega una comida
3. **Resultado esperado:**
   - La comida se guarda en ayer
   - Los totales de ayer se actualizan
   - Si vas a "Hoy", los totales de hoy NO cambian

---

## 🚀 Beneficios

### 1. Simplicidad
- Menos código
- Menos bugs
- Más fácil de mantener

### 2. Performance
- Una sola fuente de verdad (los stores)
- No hay filtrados dobles
- Los computed son eficientes

### 3. Reactividad
- Todo es automático
- No hay que llamar `refresh()` manualmente
- Vue se encarga de todo

### 4. Escalabilidad
- Fácil agregar más fechas (semana, mes, etc.)
- Fácil agregar más datos
- El patrón es consistente

---

## 💡 Lecciones Aprendidas

### ❌ Anti-pattern: Filtrar en Computed

```typescript
// MAL: Filtrar datos que ya vienen de la BD
const todayData = computed(() => {
  return allData.value.filter(item => isToday(item.date))
})
```

**Problema:** Si `allData` tiene datos de múltiples días, cambiar la fecha no recarga los datos, solo filtra los que ya están.

### ✅ Pattern Correcto: Cargar Solo lo Necesario

```typescript
// BIEN: Cargar solo los datos que necesitas
async function loadDataForDate(date: Date) {
  const { data } = await supabase
    .from('table')
    .select('*')
    .gte('date', startOfDay)
    .lt('date', endOfDay)

  allData.value = data // Reemplazar completamente
}

const displayData = computed(() => allData.value) // No filtrar
```

**Ventaja:** Los datos se cargan frescos cada vez, y el computed solo apunta a lo cargado.

---

## 🎉 Resumen Ejecutivo

**Antes:** Sistema con filtros en memoria, múltiples fuentes de verdad, y sincronización manual.

**Ahora:** Sistema simple donde:
1. Cambias la fecha → se cargan los datos de esa fecha
2. Los stores se actualizan automáticamente
3. Los computed se recalculan automáticamente
4. La UI se actualiza automáticamente

**Todo funciona sin tocar nada más.** 🚀
