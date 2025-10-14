# Concepto de Déficit Calórico en Pulso

## Cambio Conceptual Importante

El campo `daily_calorie_goal` en el perfil del usuario **ya NO representa calorías totales a consumir**, sino que ahora representa el **déficit calórico objetivo diario**.

## ¿Por qué este cambio?

Las calorías consumidas deben depender de las calorías quemadas cada día, ya que:

1. **Las calorías quemadas varían día a día** según:
   - Pasos caminados
   - Entrenamientos realizados
   - Nivel de actividad

2. **No tiene sentido un objetivo fijo de consumo** porque:
   - Un día sedentario quemas menos → debes comer menos
   - Un día activo quemas más → puedes comer más
   - Lo importante es mantener el **déficit constante**

## Ejemplo Práctico

### Usuario con déficit objetivo: -500 kcal/día

#### Día Sedentario:
```
Quemadas: 2,000 kcal (TMB: 1,700 + Pasos: 200 + Ejercicio: 0 + Termogénesis: 100)
Consumidas: 1,500 kcal
Balance: -500 kcal ✓ Objetivo alcanzado
```

#### Día Activo:
```
Quemadas: 2,800 kcal (TMB: 1,700 + Pasos: 600 + Ejercicio: 400 + Termogénesis: 100)
Consumidas: 2,300 kcal
Balance: -500 kcal ✓ Objetivo alcanzado
```

**Conclusión**: Ambos días mantienen el mismo déficit (-500 kcal) pero con diferentes consumos según la actividad.

## Cómo se usa en la app

### En el Perfil (ProfileView)

El usuario configura su **déficit objetivo** según su meta:

- **Perder peso agresivo**: -700 a -1000 kcal/día
- **Perder peso moderado**: -500 kcal/día (recomendado)
- **Perder peso lento**: -300 kcal/día
- **Mantener peso**: 0 kcal/día
- **Ganar músculo**: +200 a +300 kcal/día (superávit)

### En el Dashboard

La app muestra:

1. **Desglose de calorías quemadas**:
   - TMB (metabolismo basal)
   - Pasos
   - Ejercicio
   - Termogénesis (10% del consumo)

2. **Balance calórico**:
   ```
   Balance = Consumidas - Quemadas
   ```

3. **Comparación con objetivo**:
   ```
   Si Balance = -500 y Objetivo = -500 → ✓ Objetivo alcanzado
   Si Balance = -300 y Objetivo = -500 → Faltan 200 kcal de déficit
   Si Balance = -700 y Objetivo = -500 → Déficit mayor al objetivo
   ```

## Interfaz de Usuario

### Card de "Déficit Objetivo Diario"

```
╔═══════════════════════════════════════════╗
║  Déficit objetivo diario         -500    ║
║  Este es tu déficit calórico objetivo    ║
║  para alcanzar tu meta                   ║
║─────────────────────────────────────────║
║  Tu balance actual: -480 kcal déficit   ║
║  Faltan 20 kcal                          ║
╚═══════════════════════════════════════════╝
```

Si el déficit es mayor al objetivo:
```
╔═══════════════════════════════════════════╗
║  Déficit objetivo diario         -500    ║
║  Este es tu déficit calórico objetivo    ║
║  para alcanzar tu meta                   ║
║─────────────────────────────────────────║
║  Tu balance actual: -650 kcal déficit   ║
║  ✓ Objetivo alcanzado                    ║
╚═══════════════════════════════════════════╝
```

## Colores Visuales

- **Verde**: Cuando tienes déficit y alcanzas o superas el objetivo
- **Naranja**: Cuando el déficit es menor al objetivo
- **Rojo**: Cuando tienes superávit (no déficit)

## Notas Técnicas

- El campo `daily_calorie_goal` en la BD mantiene su nombre por compatibilidad
- Pero semánticamente representa **déficit objetivo**, no calorías a consumir
- Los valores típicos: -1000 a +300 (negativos = déficit, positivos = superávit)
- El TMB se calcula sin multiplicadores de actividad (solo Harris-Benedict puro)
