-- Script para actualizar SOLO la tabla user_profiles con los nuevos campos
-- Ejecuta esto en tu Supabase SQL Editor

-- Añadir las nuevas columnas a user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS sex TEXT CHECK (sex IN ('male', 'female', 'other')),
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS height INTEGER,
ADD COLUMN IF NOT EXISTS current_weight DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')) DEFAULT 'moderate',
ADD COLUMN IF NOT EXISTS goal TEXT CHECK (goal IN ('lose_weight', 'maintain', 'gain_muscle')) DEFAULT 'maintain';

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;
