# Configuración del Backend en Supabase

Este documento te guiará para configurar todas las funciones de cálculo de calorías en tu base de datos Supabase.

## 📋 Scripts SQL a Ejecutar (en orden)

### 1. **WORKOUTS_SCHEMA.sql** (si aún no lo ejecutaste)
Crea las tablas de ejercicios y entrenamientos con 24 ejercicios predefinidos.

```sql
-- Ejecutar primero si aún no tienes las tablas de workouts y exercises
```

### 2. **STEPS_SCHEMA.sql**
Crea la tabla de pasos diarios con políticas RLS.

```sql
-- Ejecutar para habilitar el tracking de pasos
```

### 3. **CALORIE_FUNCTIONS.sql** ⭐ **NUEVO E IMPORTANTE**
Crea 8 funciones SQL para calcular calorías en el servidor.

```sql
-- Este es el script más importante - crea todas las funciones de cálculo
```

## 🚀 Cómo Ejecutar los Scripts

### Opción A: Desde la Consola de Supabase (Recomendado)

1. Ve a tu proyecto en [https://supabase.com](https://supabase.com)
2. En el panel izquierdo, haz clic en **SQL Editor**
3. Haz clic en **+ New query**
4. Copia y pega el contenido completo de cada script
5. Haz clic en **Run** (o presiona Ctrl/Cmd + Enter)
6. Verifica que no haya errores en la consola

### Opción B: Desde el CLI de Supabase

```bash
# Si tienes Supabase CLI instalado
supabase db execute -f WORKOUTS_SCHEMA.sql
supabase db execute -f STEPS_SCHEMA.sql
supabase db execute -f CALORIE_FUNCTIONS.sql
```

## 📊 Funciones SQL Creadas

Una vez ejecutes **CALORIE_FUNCTIONS.sql**, tendrás disponibles:

### 1. `calculate_tmb(weight, height, birth_date, sex)`
Calcula la Tasa Metabólica Basal usando Harris-Benedict.

```sql
-- Ejemplo:
SELECT calculate_tmb(75, 175, '1993-05-15', 'male');
-- Resultado: 1756 kcal
```

### 2. `get_today_steps_calories(user_id)`
Obtiene las calorías quemadas por pasos hoy.

```sql
SELECT get_today_steps_calories(auth.uid());
```

### 3. `get_today_workout_calories(user_id)`
Suma las calorías de todos los entrenamientos de hoy.

```sql
SELECT get_today_workout_calories(auth.uid());
```

### 4. `get_today_consumed_calories(user_id)`
Suma las calorías de todas las comidas de hoy.

```sql
SELECT get_today_consumed_calories(auth.uid());
```

### 5. `calculate_thermic_effect(user_id)`
Calcula el efecto termogénico (10% de las calorías consumidas).

```sql
SELECT calculate_thermic_effect(auth.uid());
```

### 6. `get_total_calories_burned_today(user_id)` ⭐
Retorna una tabla con el desglose completo de calorías quemadas.

```sql
SELECT * FROM get_total_calories_burned_today(auth.uid());

-- Resultado:
-- tmb | steps_calories | workout_calories | thermic_effect | total_burned
-- 1756|            720 |              360 |            180 |         3016
```

### 7. `get_today_calorie_balance(user_id)` ⭐⭐ **LA MÁS IMPORTANTE**
Retorna todo el balance calórico del día. **Esta es la que usa la app**.

```sql
SELECT * FROM get_today_calorie_balance(auth.uid());

-- Resultado:
-- consumed | tmb  | steps_cal | workout_cal | thermic | total_burned | balance | deficit_goal
--     1800 | 1756 |       720 |         360 |     180 |         3016 |  -1216  |         -500
```

### 8. `get_week_calorie_summary(user_id)`
Resumen de los últimos 7 días para ver tu progreso.

```sql
SELECT * FROM get_week_calorie_summary(auth.uid());

-- Resultado: tabla con balance diario de la semana
```

## 🔐 Permisos y Seguridad

Todas las funciones tienen:
- **Permisos** solo para usuarios autenticados (`GRANT EXECUTE TO authenticated`)
- **RLS (Row Level Security)** habilitado en todas las tablas
- **Políticas** que garantizan que cada usuario solo vea sus propios datos

## ✅ Verificación Post-Instalación

### Verificar que las funciones existen:

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_type = 'FUNCTION'
  AND routine_schema = 'public'
  AND routine_name LIKE '%calorie%';
```

Deberías ver las 8 funciones listadas.

### Probar el balance completo:

```sql
SELECT * FROM get_today_calorie_balance(auth.uid());
```

Si retorna datos (aunque sean en 0), ¡está funcionando! 🎉

## 🎯 Ventajas del Enfoque Backend

### Antes (cálculo en cliente):
```javascript
// Cliente calcula TMB
const tmb = 88.362 + (13.397 * peso) + ...
// Cliente suma pasos
const pasosKcal = (pasos / 1000) * 60
// Cliente suma ejercicios
const ejercicioKcal = workouts.reduce(...)
// etc...
```

❌ Inconsistente (si cambias la fórmula, debes actualizar el cliente)
❌ Lento (muchas queries)
❌ Pesado (mucho código en el cliente)

### Ahora (cálculo en servidor):
```javascript
// Una sola llamada a Supabase
const { data } = await supabase
  .rpc('get_today_calorie_balance', { p_user_id: user.id })
```

✅ Consistente (la fórmula está centralizada)
✅ Rápido (una sola query optimizada)
✅ Ligero (el cliente solo muestra los datos)

## 🔄 Cómo se Actualiza

Cada vez que:
- Agregas una comida → La app llama `caloriesCalc.refresh()`
- Registras pasos → La app llama `caloriesCalc.refresh()`
- Agregas un entrenamiento → La app llama `caloriesCalc.refresh()`

Esto ejecuta `get_today_calorie_balance()` en Supabase y obtiene los datos actualizados.

## 📱 Integración con la App

El composable `useCaloriesCalculation.ts` ahora:

1. Llama a `get_today_calorie_balance(auth.uid())` en el mount
2. Retorna computed properties reactivos
3. Expone un método `refresh()` para actualizar los datos
4. Maneja loading y errores automáticamente

```typescript
const caloriesCalc = useCaloriesCalculation()

// Acceder a los datos
caloriesCalc.userTMB           // 1756
caloriesCalc.caloriesFromSteps // 720
caloriesCalc.totalCaloriesBurned // 3016
caloriesCalc.netCalories       // -1216

// Refrescar después de un cambio
await mealsStore.addMeal(...)
caloriesCalc.refresh()
```

## 🐛 Troubleshooting

### Error: "function get_today_calorie_balance does not exist"
→ No ejecutaste el script **CALORIE_FUNCTIONS.sql**

### Error: "permission denied for function"
→ Falta ejecutar los `GRANT EXECUTE` al final del script

### Los datos retornan en 0
→ Normal si aún no has agregado comidas/pasos/entrenamientos. Prueba agregando datos.

### Error: "relation daily_steps does not exist"
→ No ejecutaste **STEPS_SCHEMA.sql**

## 📚 Documentación Adicional

- **CALORIE_CALCULATION.md** - Explicación de la fórmula científica
- **DEFICIT_CONCEPT.md** - Cómo funciona el déficit calórico
- **IMPLEMENTATION_SUMMARY.md** - Resumen de toda la implementación

## 🎉 ¡Listo!

Una vez ejecutes los 3 scripts SQL, tu backend estará completamente configurado y la app funcionará con cálculos de calorías en el servidor.

Accede a: **http://localhost:5175**
