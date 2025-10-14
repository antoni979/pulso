# Instrucciones para Ejecutar las Migraciones SQL

## 📋 Resumen de Cambios

Se han realizado los siguientes cambios al sistema:

### 1. **Simplificación del Perfil de Usuario**
- Se eliminaron campos innecesarios como `daily_calorie_goal`, `protein_goal`, `carbs_goal`, `fats_goal`, `activity_level`, y `goal`
- Se agregó el campo `caloric_deficit_goal` para definir el objetivo de déficit/superávit calórico diario
- El perfil ahora solo incluye los datos necesarios para calcular el TMB (Tasa Metabólica Basal)

### 2. **Mejoras en el Dashboard**
- Se eliminó la tarjeta problemática de "Déficit Objetivo"
- Se agregó un badge simple mostrando el objetivo arriba del balance del día
- Se agregó una sección de **Estadísticas Semanales** con:
  - 📊 **Balance Promedio**: Promedio de balance calórico de los últimos 7 días
  - 🎯 **Días en Meta**: Cantidad de días que cumpliste con tu objetivo (con % de adherencia)
  - 📈 **Tendencia**: Indicador de si estás perdiendo peso, ganando o manteniendo
  - **Gráfica de Barras**: Visualización del balance calórico diario de los últimos 7 días

### 3. **Cálculos Automáticos en el Backend**
- El TMB se calcula automáticamente en Supabase usando la fórmula de Harris-Benedict
- El balance calórico se calcula considerando: TMB + Calorías de pasos + Calorías de ejercicio + Efecto termogénico
- Todo se actualiza en tiempo real cuando agregas comidas, ejercicios o pasos

---

## 🚀 Pasos para Aplicar las Migraciones

### Paso 1: Ejecutar la Primera Migración (Déficit Calórico)

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto **Pulso**
3. Ve a **SQL Editor** en el menú lateral
4. Copia y pega el contenido del archivo `MIGRATION_ADD_DEFICIT_GOAL.sql`
5. Haz clic en **Run** para ejecutar la migración

**Esta migración hace lo siguiente:**
- Agrega la columna `caloric_deficit_goal` a la tabla `user_profiles` (por defecto -500 kcal)
- Actualiza la función `get_today_calorie_balance` para usar el déficit del perfil del usuario

### Paso 2: Ejecutar la Segunda Migración (Balance Semanal)

1. En el mismo **SQL Editor** de Supabase
2. Copia y pega el contenido del archivo `MIGRATION_ADD_WEEKLY_BALANCE.sql`
3. Haz clic en **Run** para ejecutar la migración

**Esta migración hace lo siguiente:**
- Crea la función `get_weekly_calorie_balance` que obtiene el balance calórico de los últimos 7 días
- Esta función es usada por la nueva sección de estadísticas semanales

---

## ✅ Verificar que las Migraciones Funcionaron

### 1. Verificar la columna `caloric_deficit_goal`

Ejecuta esta consulta SQL:

```sql
SELECT id, full_name, caloric_deficit_goal
FROM user_profiles
LIMIT 5;
```

Deberías ver la columna `caloric_deficit_goal` con valor `-500` por defecto.

### 2. Verificar la función `get_today_calorie_balance`

Ejecuta esta consulta SQL (reemplaza `TU_USER_ID` con tu ID de usuario):

```sql
SELECT * FROM get_today_calorie_balance('TU_USER_ID');
```

Deberías recibir una fila con: `consumed`, `tmb`, `steps_calories`, `workout_calories`, `thermic_effect`, `total_burned`, `balance`, `deficit_goal`.

### 3. Verificar la función `get_weekly_calorie_balance`

Ejecuta esta consulta SQL (reemplaza `TU_USER_ID` con tu ID de usuario):

```sql
SELECT * FROM get_weekly_calorie_balance('TU_USER_ID');
```

Deberías recibir 7 filas (una por cada día de la semana) con: `date`, `consumed`, `burned`, `balance`, `deficit_goal`.

---

## 🎯 Cómo Usar el Sistema

### 1. Configurar tu Perfil

1. Ve a **Perfil** en el dashboard
2. Completa los datos básicos:
   - Nombre completo
   - Sexo (necesario para calcular TMB)
   - Fecha de nacimiento (para calcular edad)
   - Altura (en cm)
   - Peso actual (en kg)
3. Haz clic en **"Calcular mi TMB"** para ver tu Tasa Metabólica Basal
4. Define tu **Déficit/Superávit Calórico Objetivo**:
   - **-750 kcal**: Pérdida acelerada de peso (~0.75 kg/semana)
   - **-500 kcal**: Pérdida moderada de peso (~0.5 kg/semana)
   - **0 kcal**: Mantenimiento del peso actual
   - **+300 kcal**: Ganancia de masa muscular limpia
5. Haz clic en **"Guardar Cambios"**

### 2. Usar el Dashboard

El dashboard ahora muestra:

#### Balance Calórico del Día
- **TMB**: Tu metabolismo basal calculado automáticamente
- **Pasos**: Calorías quemadas por caminar (60 kcal por 1000 pasos)
- **Ejercicio**: Calorías quemadas en entrenamientos
- **Termogénesis**: 10% de las calorías consumidas
- **Total Quemadas**: TMB + Pasos + Ejercicio + Termogénesis
- **Consumidas**: Total de calorías de tus comidas
- **Balance del Día**: Consumidas - Quemadas (con tu objetivo mostrado arriba)

#### Estadísticas de la Semana
- **Balance Promedio**: Tu balance calórico promedio en los últimos 7 días
- **Días en Meta**: Cuántos días cumpliste tu objetivo de déficit/superávit
- **Tendencia**: Si estás perdiendo peso, ganando o manteniendo
- **Gráfica de Barras**: Visualización del balance de cada día con indicadores de meta cumplida (✓)

---

## 🐛 Solución de Problemas

### Error: "function get_today_calorie_balance does not exist"
- Asegúrate de haber ejecutado `MIGRATION_ADD_DEFICIT_GOAL.sql`
- Verifica que no haya errores de sintaxis en la función

### Error: "column caloric_deficit_goal does not exist"
- Ejecuta la primera parte de `MIGRATION_ADD_DEFICIT_GOAL.sql` que agrega la columna

### La gráfica no muestra datos
- Ejecuta `MIGRATION_ADD_WEEKLY_BALANCE.sql`
- Verifica que tengas comidas registradas en los últimos días
- Asegúrate de tener configurado tu perfil correctamente

### El balance muestra cero
- Verifica que tengas configurado tu perfil (sexo, fecha de nacimiento, altura, peso)
- Asegúrate de haber definido tu déficit calórico objetivo
- Registra algunas comidas para ver el balance actualizado

---

## 📚 Documentación Adicional

- **SUPABASE_SETUP.md**: Esquema completo de la base de datos
- **CLAUDE.md**: Instrucciones del proyecto para Claude Code

---

## ✨ Próximos Pasos Recomendados

1. Ejecutar ambas migraciones SQL en Supabase
2. Configurar tu perfil completamente en la aplicación
3. Registrar tu primera comida y ver cómo se actualiza el balance
4. Agregar pasos del día para ver el cálculo completo
5. Explorar la sección de estadísticas semanales

¡Disfruta de **Pulso**! 🥗
