# Sistema de Cálculo de Calorías en Pulso

## Fórmula Científica Completa

El sistema de Pulso calcula las calorías quemadas diarias utilizando una fórmula científica precisa:

```
Calorías Quemadas = TMB + Calorías Pasos + Calorías Ejercicio + Efecto Termogénico
```

### Componentes del Gasto Calórico

#### 1. TMB (Tasa Metabólica Basal)
El TMB es el gasto energético en reposo, calculado con la **fórmula de Harris-Benedict**:

**Para hombres:**
```
TMB = 88.362 + (13.397 × peso en kg) + (4.799 × altura en cm) - (5.677 × edad)
```

**Para mujeres:**
```
TMB = 447.593 + (9.247 × peso en kg) + (3.098 × altura en cm) - (4.330 × edad)
```

El TMB representa las calorías que tu cuerpo quema simplemente para mantener las funciones vitales (respiración, circulación, temperatura corporal, etc.).

#### 2. Calorías por Pasos
Las calorías quemadas por los pasos diarios se calculan con:

```
Calorías Pasos = (Pasos ÷ 1000) × 60
```

**Ejemplo:**
- 10,000 pasos = (10,000 ÷ 1000) × 60 = **600 kcal**

#### 3. Calorías por Ejercicio Físico
Las calorías quemadas por entrenamientos se calculan según la actividad:

```
Calorías Ejercicio = (Calorías por hora ÷ 60) × Duración en minutos
```

**Ejemplo:**
- Correr (720 kcal/h) durante 30 minutos = (720 ÷ 60) × 30 = **360 kcal**

La base de datos incluye 24 ejercicios predefinidos con sus valores calóricos por hora.

#### 4. Efecto Termogénico de los Alimentos (TEF)
El efecto termogénico representa las calorías quemadas al digerir y procesar los alimentos:

```
Efecto Termogénico = Calorías Consumidas × 0.10
```

Es decir, el **10% de las calorías ingeridas** se queman durante la digestión.

**Ejemplo:**
- Si consumes 2000 kcal = 2000 × 0.10 = **200 kcal** quemadas por termogénesis

## Balance Calórico

El balance neto se calcula como:

```
Balance Neto = Calorías Consumidas - Calorías Quemadas Totales
```

### Déficit/Superávit respecto al objetivo:

```
Déficit = Objetivo Diario - Calorías Consumidas
```

Si el déficit es **positivo**, te quedan calorías por consumir.
Si es **negativo**, has excedido tu objetivo.

## Ejemplo Completo

### Datos del usuario:
- Hombre, 30 años, 75 kg, 175 cm
- Objetivo: Perder peso (2000 kcal/día)
- Pasos hoy: 12,000
- Ejercicio: Correr 30 minutos (360 kcal)
- Comidas consumidas: 1800 kcal

### Cálculo:

1. **TMB** = 88.362 + (13.397 × 75) + (4.799 × 175) - (5.677 × 30) = **1,756 kcal**

2. **Pasos** = (12,000 ÷ 1000) × 60 = **720 kcal**

3. **Ejercicio** = **360 kcal** (correr 30 min)

4. **Efecto Termogénico** = 1,800 × 0.10 = **180 kcal**

**Total Calorías Quemadas** = 1,756 + 720 + 360 + 180 = **3,016 kcal**

**Balance Neto** = 1,800 - 3,016 = **-1,216 kcal** (déficit)

**Respecto al objetivo** = 2,000 - 1,800 = **200 kcal restantes**

## Cambios Importantes vs Versión Anterior

### ❌ Lo que ya NO se usa:
- **TDEE (Total Daily Energy Expenditure)**: Ya no multiplicamos el TMB por niveles de actividad (sedentario, moderado, etc.)
- **Multiplicadores de actividad**: Ya no usamos 1.2x, 1.55x, etc.
- **activity_level**: Aunque el campo existe en la base de datos por compatibilidad, ya no afecta el cálculo

### ✅ Lo que SÍ se usa ahora:
- **TMB puro** (sin multiplicadores)
- **Pasos reales** del usuario
- **Ejercicios registrados** con duración específica
- **Efecto termogénico** calculado automáticamente

## Implementación en el Código

### 1. Base de Datos
Ejecutar estos scripts en Supabase:
```sql
-- Actualizar perfiles (UPDATE_USER_PROFILES.sql)
-- Agregar entrenamientos (WORKOUTS_SCHEMA.sql)
-- Agregar pasos (STEPS_SCHEMA.sql)
```

### 2. Stores
- `stores/steps.ts` - Manejo de pasos diarios
- `stores/workouts.ts` - Entrenamientos
- `stores/meals.ts` - Comidas (ya existente)

### 3. Composable
`composables/useCaloriesCalculation.ts` - Centraliza toda la lógica de cálculo

### 4. Componentes
- `StepsInput.vue` - Modal para registrar pasos
- `WorkoutSearch.vue` - Búsqueda de ejercicios
- `DashboardView.vue` - Vista principal con desglose completo

## Ventajas del Nuevo Sistema

1. **Precisión**: Usa datos reales del usuario en lugar de estimaciones generales
2. **Transparencia**: El usuario ve exactamente de dónde vienen las calorías quemadas
3. **Flexibilidad**: Cada día es diferente según la actividad real
4. **Motivación**: Gamifica el tracking de pasos y ejercicios
5. **Científicamente válido**: Basado en fórmulas reconocidas (Harris-Benedict, TEF)

## Referencias Científicas

- Harris-Benedict equation (1919, revisada 1984)
- Thermic Effect of Food: ~10% del gasto calórico total
- Pasos y gasto energético: ~0.06 kcal/paso (promedio)
