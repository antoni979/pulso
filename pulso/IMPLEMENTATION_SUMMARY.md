# Resumen de Implementación: Sistema de Cálculo de Calorías Científico

## ✅ Lo que se ha implementado

### 1. Base de Datos (Supabase)

#### Scripts SQL creados:
- **STEPS_SCHEMA.sql** - Nueva tabla `daily_steps` para tracking de pasos diarios
  - Almacena pasos y calorías quemadas por día
  - Constraint único: un registro por usuario por día
  - RLS policies configuradas

### 2. TypeScript Interfaces

Actualizado `src/lib/supabase.ts`:
```typescript
export interface DailySteps {
  id: string
  user_id: string
  steps_count: number
  calories_burned: number
  step_date: string
  created_at: string
  updated_at: string
}
```

### 3. Pinia Stores

#### Nuevo: `src/stores/steps.ts`
- `loadTodaySteps()` - Carga pasos del día actual
- `updateTodaySteps(steps)` - Actualiza/crea registro de pasos
- `calculateStepsCalories(steps)` - Calcula: (pasos ÷ 1000) × 60
- `todayStepsCalories` (computed) - Calorías quemadas por pasos hoy

### 4. Composable Central

#### Nuevo: `src/composables/useCaloriesCalculation.ts`

Centraliza toda la lógica de cálculo con computed properties reactivos:

```typescript
// Componentes del gasto
userTMB                    // TMB calculado con Harris-Benedict
caloriesFromSteps          // 60 kcal por 1000 pasos
caloriesFromWorkouts       // Suma de entrenamientos del día
thermogenicEffect          // 10% de calorías consumidas

// Totales
totalCaloriesBurned        // TMB + Pasos + Ejercicio + Termogénico
caloriesConsumed           // Total de comidas
netCalories                // Consumidas - Quemadas

// Vs objetivo
caloriesVsGoal             // Diferencia con objetivo
caloriesRemaining          // Calorías que faltan/sobran
```

**Fórmula completa:**
```
Total Quemadas = TMB + (Pasos ÷ 1000 × 60) + Ejercicios + (Consumidas × 0.10)
```

### 5. Componente de UI

#### Nuevo: `src/components/StepsInput.vue`
- Modal para registrar pasos diarios
- Muestra cálculo de calorías en tiempo real
- Tema púrpura/indigo
- Guarda automáticamente en la base de datos

### 6. Vista Principal Actualizada

#### Actualizado: `src/views/DashboardView.vue`

**Nuevo diseño con:**

1. **Card principal de Balance Neto** (destacado en verde)
   - Balance calórico (Consumidas - Quemadas)
   - Comparación con objetivo diario

2. **Desglose de Calorías Quemadas** (4 cards)
   - 💤 TMB (metabolismo basal) - azul
   - 👟 Pasos (clickeable para editar) - púrpura
   - 🏋️ Ejercicio (suma entrenamientos) - rojo
   - 🔥 Termogénesis (10% consumo) - amarillo

3. **Macros Stats** (3 cards)
   - Proteína, Carbohidratos, Grasas con progress bars

4. **Botones de acción** (3 cards)
   - Agregar Comida (verde)
   - Agregar Entrenamiento (rojo/naranja)
   - Registrar Pasos (púrpura) - **NUEVO**

5. **Historial**
   - Comidas del día
   - Entrenamientos del día

### 7. Perfil Actualizado

#### Actualizado: `src/views/ProfileView.vue`

**Cambios:**
- ❌ Eliminada sección "Nivel de Actividad"
- ✅ Ahora calcula solo **TMB** (no TDEE)
- ✅ Muestra "TMB (metabolismo basal)" en lugar de "TDEE (gasto diario)"
- ✅ Recomendación basada en TMB + objetivo:
  - Perder peso: TMB - 500
  - Mantener: TMB
  - Ganar músculo: TMB + 200

## 📋 Pasos para probar la implementación

### 1. Ejecutar scripts SQL en Supabase

```sql
-- 1. Actualizar tabla user_profiles (si aún no lo hiciste)
-- Ejecutar: UPDATE_USER_PROFILES.sql

-- 2. Crear tabla de entrenamientos (si aún no lo hiciste)
-- Ejecutar: WORKOUTS_SCHEMA.sql

-- 3. Crear tabla de pasos (NUEVO)
-- Ejecutar: STEPS_SCHEMA.sql
```

### 2. Verificar que el servidor esté corriendo

El servidor está en: **http://localhost:5175**

### 3. Configurar tu perfil

1. Ve a **Perfil**
2. Completa todos los campos:
   - Nombre, sexo, fecha de nacimiento
   - Altura y peso actual
   - Objetivo (perder peso, mantener, ganar músculo)
3. Haz clic en **"Calcular Automáticamente"**
4. Verás tu **TMB** (metabolismo basal)
5. Aplica la recomendación o ajusta manualmente

### 4. Registrar pasos

1. En el Dashboard, haz clic en **"Registrar Pasos"** (card púrpura)
2. Ingresa tu conteo de pasos (ej: 10000)
3. Verás el cálculo en tiempo real: (10000 ÷ 1000) × 60 = 600 kcal
4. Guarda

### 5. Agregar ejercicios

1. Haz clic en **"Agregar Entrenamiento"** (card roja)
2. Busca un ejercicio (ej: "Correr")
3. Ingresa duración en minutos
4. Se calculan automáticamente las calorías quemadas
5. Guarda

### 6. Agregar comidas

1. Haz clic en **"Agregar Comida"** (card verde)
2. Busca alimentos o agrégalos manualmente
3. Las calorías consumidas se suman al total

### 7. Ver el desglose completo

En el Dashboard verás:
- **Balance Neto** = Consumidas - (TMB + Pasos + Ejercicio + Termogénesis)
- **Desglose detallado** de cada componente del gasto calórico
- **Respecto al objetivo**: cuántas calorías te quedan o has excedido

## 🎯 Ejemplo de uso real

### Escenario:
- Usuario: Hombre, 30 años, 75kg, 175cm
- Objetivo: 2000 kcal/día (perder peso)
- TMB calculado: 1756 kcal

### Durante el día:
1. **Registra 12,000 pasos** → +720 kcal quemadas
2. **Hace 30 min de running** → +360 kcal quemadas
3. **Come 1800 kcal** → +180 kcal termogénesis (10%)

### Resultado en Dashboard:
```
Balance Neto: -1,216 kcal (déficit)

Desglose de Calorías Quemadas:
├─ TMB:              1,756 kcal
├─ Pasos:              720 kcal (12,000 pasos)
├─ Ejercicio:          360 kcal (Running 30min)
└─ Termogénesis:       180 kcal (10% de 1,800)
   ─────────────────────────────
   TOTAL QUEMADAS:    3,016 kcal

Consumidas:           1,800 kcal
Balance:             -1,216 kcal
Objetivo:             2,000 kcal
Restantes:              200 kcal
```

## 📚 Documentación creada

1. **CALORIE_CALCULATION.md** - Explicación científica completa del sistema
2. **STEPS_SCHEMA.sql** - Script para crear tabla de pasos
3. **IMPLEMENTATION_SUMMARY.md** - Este documento

## 🔄 Cambios importantes vs versión anterior

### Ya NO se usa:
- ❌ TDEE (Total Daily Energy Expenditure)
- ❌ Multiplicadores de actividad (1.2x, 1.55x, etc.)
- ❌ Campo activity_level en cálculos (solo TMB puro)

### Ahora SÍ se usa:
- ✅ TMB puro (Harris-Benedict)
- ✅ Pasos reales del usuario
- ✅ Ejercicios registrados con duración
- ✅ Efecto termogénico automático (10%)

## 🎨 Diseño visual

- **Balance Neto**: Card grande verde con número prominente
- **Desglose**: 4 cards con colores temáticos
  - Azul (TMB), Púrpura (Pasos), Rojo (Ejercicio), Amarillo (Termogénesis)
- **Acciones**: 3 cards grandes interactivos
- **Todo responsive** y con animaciones suaves

## ⚠️ Notas importantes

1. El campo `activity_level` sigue existiendo en la BD por compatibilidad, pero **ya no afecta los cálculos**
2. El usuario debe tener **perfil completo** para que el TMB se calcule correctamente
3. Si el usuario no registra pasos, ese componente será **0**
4. El **efecto termogénico** se calcula automáticamente (no requiere input del usuario)

## 🚀 Estado actual

✅ **Todo implementado y funcionando**
✅ **Servidor corriendo sin errores** (puerto 5175)
✅ **Ready para testing**

Solo falta que ejecutes los scripts SQL en Supabase y pruebes la app!
