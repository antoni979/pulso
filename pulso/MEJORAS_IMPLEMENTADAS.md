# Mejoras Implementadas - Pulso

## ✅ 1. Búsqueda sin tildes

**Problema**: Buscar "cafe" no encontraba "café"

**Solución**:
- Implementado `normalizeText()` que quita tildes usando `String.normalize('NFD')`
- La búsqueda ahora funciona con y sin tildes
- Ejemplo: "cafe", "café", "Café" → todos encuentran lo mismo

**Archivos modificados**:
- `src/stores/foods.ts` → Función `searchFoods()` mejorada

**Cómo probar**:
1. Busca "cafe" (sin tilde)
2. Debería encontrar "Café con leche", "Café solo", etc.

---

## ✅ 2. Sistema de unidades alternativas

**Problema**: Tener que poner "250ml de café" en vez de "1 taza"

**Solución**: Sistema completo de unidades alternativas

### Unidades soportadas:
- **taza** → Café, té, infusiones (250g)
- **vaso** → Leche, zumo, refrescos (250-330g)
- **unidad** → Frutas, huevos, galletas, etc.
- **rebanada** → Pan, tostadas (25-30g)
- **envase** → Yogur (125g)
- **loncha** → Queso (20g)
- **cucharada** → Mantequilla, aceite, miel (15-20g)
- **porción** → Pizza, tarta, pastel (80-120g)

### Funcionalidades:
- **Selector de unidades**: Botón toggle entre unidad personalizada y gramos
- **Conversión automática**: Calcula nutrientes automáticamente
- **Nombre descriptivo**: "Café con leche (1 taza)" en vez de "(250g)"
- **Fracciones**: Puedes poner 0.5 tazas, 1.5 unidades, etc.
- **Indicador de equivalencia**: Muestra "= 250g (250g por taza)"

### Archivos modificados:
- `src/lib/supabase.ts` → Interface `Food` con `serving_unit` y `serving_size_grams`
- `src/components/FoodSearch.vue` → UI completa con selector de unidades
- `supabase_migrations/add_serving_units.sql` → Migración SQL

---

## 🗄️ Aplicar migración a Supabase

Para que las unidades funcionen, necesitas ejecutar la migración SQL:

### Opción 1: Dashboard de Supabase (recomendado)
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto Pulso
3. Ve a **SQL Editor** en el menú lateral
4. Clic en **"New query"**
5. Copia y pega todo el contenido de `supabase_migrations/add_serving_units.sql`
6. Clic en **"Run"**
7. ✅ Listo! Las columnas se añaden y los alimentos comunes se actualizan

### Opción 2: CLI de Supabase
```bash
# Si tienes Supabase CLI instalado
supabase db push

# O ejecutar directamente
psql $DATABASE_URL -f supabase_migrations/add_serving_units.sql
```

### ¿Qué hace la migración?
1. Añade 2 columnas a la tabla `foods`:
   - `serving_unit` (TEXT) → 'taza', 'vaso', 'unidad', etc.
   - `serving_size_grams` (DECIMAL) → Peso en gramos de 1 unidad

2. Actualiza alimentos comunes automáticamente:
   - Café → 1 taza = 250g
   - Plátano → 1 unidad = 120g
   - Yogur → 1 envase = 125g
   - etc. (ver archivo SQL para lista completa)

---

## 🧪 Cómo probar las mejoras

### Búsqueda sin tildes:
1. Abre la app
2. Clic en "+" para añadir comida
3. Busca "platano" (sin tilde)
4. ✅ Debería encontrar "Plátano"

### Unidades alternativas:
1. Busca "café con leche"
2. Selecciónalo
3. Verás 2 botones: **"taza"** y **"gramos"**
4. Selecciona **"taza"**
5. Pon cantidad **"1"**
6. ✅ Verás "= 250g (250g por taza)"
7. Los nutrientes se calculan automáticamente para 250g

### Ejemplos de uso:
```
Café con leche → 1 taza (en vez de 250ml)
Plátano → 1 unidad (en vez de ~120g)
Yogur natural → 1 envase (en vez de 125g)
Huevo → 2 unidades (en vez de 120g)
Pan integral → 2 rebanadas (en vez de 60g)
```

---

## 🎯 Beneficios para el usuario

### Antes:
- ❌ "Necesito café... ¿cuántos ml tiene una taza? ¿250? ¿300?"
- ❌ Buscar "cafe" no encuentra "Café"
- ❌ Pesar todo en gramos es tedioso

### Ahora:
- ✅ "Tomé 1 taza de café" → Click, listo
- ✅ Búsqueda inteligente con y sin tildes
- ✅ Unidades naturales (tazas, vasos, unidades)
- ✅ Conversión automática a gramos en segundo plano
- ✅ UX mucho más rápida y natural

---

## 📝 Notas técnicas

### Compatibilidad hacia atrás:
- Alimentos SIN `serving_unit` → Siguen funcionando normal (solo gramos)
- Alimentos CON `serving_unit` → Muestran selector de unidades
- No rompe nada existente ✅

### Alimentos custom:
Los usuarios pueden crear alimentos personalizados con sus propias unidades. Por ejemplo:
- "Mi proteína en polvo → 1 scoop = 30g"
- "Tostada de mi panadería → 1 unidad = 45g"

### Futuras mejoras opcionales:
- [ ] Añadir más unidades (pizca, taza pequeña, taza grande, etc.)
- [ ] Permitir editar `serving_size_grams` desde la UI
- [ ] Sugerencias automáticas de unidades al crear alimento custom
- [ ] Historial de unidades más usadas por el usuario

---

¡Disfruta de la app mejorada! 🚀
