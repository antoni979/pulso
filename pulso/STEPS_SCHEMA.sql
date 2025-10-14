-- Script para agregar el tracking de pasos diarios
-- Ejecuta esto en tu Supabase SQL Editor

-- Crear tabla de pasos diarios
CREATE TABLE daily_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  steps_count INTEGER NOT NULL CHECK (steps_count >= 0),
  calories_burned INTEGER NOT NULL, -- calculado automáticamente (60 kcal por 1000 pasos)
  step_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, step_date) -- solo un registro de pasos por día por usuario
);

-- Habilitar Row Level Security
ALTER TABLE daily_steps ENABLE ROW LEVEL SECURITY;

-- Políticas para daily_steps
CREATE POLICY "Users can view own steps"
  ON daily_steps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own steps"
  ON daily_steps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own steps"
  ON daily_steps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own steps"
  ON daily_steps FOR DELETE
  USING (auth.uid() = user_id);

-- Índices para mejor rendimiento
CREATE INDEX idx_daily_steps_user_id ON daily_steps(user_id);
CREATE INDEX idx_daily_steps_date ON daily_steps(step_date);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_daily_steps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_steps_updated_at
  BEFORE UPDATE ON daily_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_steps_updated_at();

-- Verificar que todo se creó correctamente
SELECT 'Daily steps table ready:' as info, COUNT(*) as count FROM daily_steps;
