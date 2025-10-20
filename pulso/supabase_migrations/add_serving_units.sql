-- Añadir columnas para unidades alternativas en la tabla foods
ALTER TABLE foods
ADD COLUMN IF NOT EXISTS serving_unit TEXT,
ADD COLUMN IF NOT EXISTS serving_size_grams DECIMAL(10, 2);

-- Comentarios para las columnas
COMMENT ON COLUMN foods.serving_unit IS 'Unidad de medida alternativa (taza, unidad, cucharada, vaso, etc)';
COMMENT ON COLUMN foods.serving_size_grams IS 'Cantidad de gramos equivalente a 1 serving_unit';

-- Actualizar alimentos comunes con unidades prácticas
-- Bebidas calientes
UPDATE foods SET serving_unit = 'taza', serving_size_grams = 250 WHERE name ILIKE '%café%';
UPDATE foods SET serving_unit = 'taza', serving_size_grams = 250 WHERE name ILIKE '%té%';
UPDATE foods SET serving_unit = 'taza', serving_size_grams = 250 WHERE name ILIKE '%infusión%';

-- Leches y bebidas
UPDATE foods SET serving_unit = 'vaso', serving_size_grams = 250 WHERE name ILIKE '%leche%';
UPDATE foods SET serving_unit = 'vaso', serving_size_grams = 250 WHERE name ILIKE '%zumo%';
UPDATE foods SET serving_unit = 'vaso', serving_size_grams = 250 WHERE name ILIKE '%jugo%';
UPDATE foods SET serving_unit = 'vaso', serving_size_grams = 330 WHERE name ILIKE '%refresco%';

-- Frutas (unidades)
UPDATE foods SET serving_unit = 'unidad', serving_size_grams = 180 WHERE name ILIKE '%manzana%';
UPDATE foods SET serving_unit = 'unidad', serving_size_grams = 120 WHERE name ILIKE '%plátano%';
UPDATE foods SET serving_unit = 'unidad', serving_size_grams = 120 WHERE name ILIKE '%banana%';
UPDATE foods SET serving_unit = 'unidad', serving_size_grams = 150 WHERE name ILIKE '%naranja%';
UPDATE foods SET serving_unit = 'unidad', serving_size_grams = 100 WHERE name ILIKE '%kiwi%';
UPDATE foods SET serving_unit = 'unidad', serving_size_grams = 180 WHERE name ILIKE '%pera%';
UPDATE foods SET serving_unit = 'unidad', serving_size_grams = 60 WHERE name ILIKE '%huevo%' AND name NOT ILIKE '%tortilla%';

-- Pan y tostadas
UPDATE foods SET serving_unit = 'rebanada', serving_size_grams = 30 WHERE name ILIKE '%pan%rebanada%';
UPDATE foods SET serving_unit = 'rebanada', serving_size_grams = 25 WHERE name ILIKE '%tostada%';
UPDATE foods SET serving_unit = 'unidad', serving_size_grams = 60 WHERE name ILIKE '%panecillo%';
UPDATE foods SET serving_unit = 'unidad', serving_size_grams = 70 WHERE name ILIKE '%bollo%';

-- Yogur
UPDATE foods SET serving_unit = 'envase', serving_size_grams = 125 WHERE name ILIKE '%yogur%';

-- Quesos
UPDATE foods SET serving_unit = 'loncha', serving_size_grams = 20 WHERE name ILIKE '%queso%' AND (name ILIKE '%loncha%' OR name ILIKE '%lonchas%');

-- Cucharadas (mantequilla, aceite, miel, etc)
UPDATE foods SET serving_unit = 'cucharada', serving_size_grams = 15 WHERE name ILIKE '%mantequilla%';
UPDATE foods SET serving_unit = 'cucharada', serving_size_grams = 15 WHERE name ILIKE '%aceite%';
UPDATE foods SET serving_unit = 'cucharada', serving_size_grams = 20 WHERE name ILIKE '%miel%';
UPDATE foods SET serving_unit = 'cucharada', serving_size_grams = 15 WHERE name ILIKE '%mermelada%';

-- Porciones (tarta, pizza)
UPDATE foods SET serving_unit = 'porción', serving_size_grams = 120 WHERE name ILIKE '%pizza%';
UPDATE foods SET serving_unit = 'porción', serving_size_grams = 100 WHERE name ILIKE '%tarta%';
UPDATE foods SET serving_unit = 'porción', serving_size_grams = 80 WHERE name ILIKE '%pastel%';

-- Galletas
UPDATE foods SET serving_unit = 'unidad', serving_size_grams = 10 WHERE name ILIKE '%galleta%';

-- Nota: Estos son valores aproximados estándar
-- Los usuarios pueden crear alimentos custom con sus propias medidas
