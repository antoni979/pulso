-- Script para agregar el módulo de entrenamiento
-- Ejecuta esto en tu Supabase SQL Editor

-- Crear tabla de ejercicios (base de datos de deportes/actividades)
CREATE TABLE exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  calories_per_hour INTEGER NOT NULL, -- kcal quemadas por hora
  category TEXT, -- cardio, strength, sports, etc
  intensity TEXT CHECK (intensity IN ('low', 'moderate', 'high')),
  description TEXT,
  is_custom BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- null for system exercises
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de entrenamientos (registro de actividad física del usuario)
CREATE TABLE workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL, -- duración en minutos
  calories_burned INTEGER NOT NULL, -- kcal quemadas calculadas
  workout_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Políticas para exercises (similar a foods)
CREATE POLICY "Anyone can view exercises"
  ON exercises FOR SELECT
  USING (true);

CREATE POLICY "Users can create custom exercises"
  ON exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom exercises"
  ON exercises FOR UPDATE
  USING (auth.uid() = user_id AND is_custom = true);

CREATE POLICY "Users can delete own custom exercises"
  ON exercises FOR DELETE
  USING (auth.uid() = user_id AND is_custom = true);

-- Políticas para workouts (similar a meals)
CREATE POLICY "Users can view own workouts"
  ON workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workouts"
  ON workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts"
  ON workouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts"
  ON workouts FOR DELETE
  USING (auth.uid() = user_id);

-- Índices para mejor rendimiento
CREATE INDEX idx_exercises_name ON exercises(name);
CREATE INDEX idx_exercises_category ON exercises(category);
CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workouts_date ON workouts(workout_date);

-- Insertar ejercicios/deportes de ejemplo (base de datos predefinida)
INSERT INTO exercises (name, calories_per_hour, category, intensity, description, is_custom) VALUES
  -- Cardio
  ('Correr (8 km/h)', 480, 'cardio', 'moderate', 'Trote moderado', false),
  ('Correr (12 km/h)', 720, 'cardio', 'high', 'Carrera rápida', false),
  ('Caminar rápido', 240, 'cardio', 'low', 'Caminata rápida', false),
  ('Ciclismo moderado', 400, 'cardio', 'moderate', 'Bicicleta ritmo moderado', false),
  ('Ciclismo intenso', 600, 'cardio', 'high', 'Bicicleta ritmo alto', false),
  ('Natación (ritmo moderado)', 500, 'cardio', 'moderate', 'Natación continua', false),
  ('Natación (ritmo intenso)', 700, 'cardio', 'high', 'Natación intensa', false),
  ('Elíptica', 350, 'cardio', 'moderate', 'Máquina elíptica', false),
  ('Saltar la cuerda', 600, 'cardio', 'high', 'Comba/soga', false),
  ('HIIT', 650, 'cardio', 'high', 'Entrenamiento intervalos alta intensidad', false),

  -- Fuerza
  ('Entrenamiento con pesas', 220, 'strength', 'moderate', 'Musculación general', false),
  ('CrossFit', 500, 'strength', 'high', 'Entrenamiento funcional intenso', false),
  ('Calistenia', 280, 'strength', 'moderate', 'Ejercicios con peso corporal', false),

  -- Deportes
  ('Fútbol', 450, 'sports', 'high', 'Partido o entrenamiento', false),
  ('Baloncesto', 400, 'sports', 'high', 'Partido o entrenamiento', false),
  ('Tenis', 420, 'sports', 'moderate', 'Partido singles', false),
  ('Pádel', 360, 'sports', 'moderate', 'Partido de pádel', false),
  ('Voleibol', 300, 'sports', 'moderate', 'Partido de voleibol', false),

  -- Actividades
  ('Yoga', 150, 'flexibility', 'low', 'Yoga Hatha/Vinyasa', false),
  ('Pilates', 200, 'flexibility', 'low', 'Pilates mat', false),
  ('Baile', 300, 'cardio', 'moderate', 'Baile/Zumba', false),
  ('Boxeo', 550, 'sports', 'high', 'Entrenamiento de boxeo', false),
  ('Remo', 480, 'cardio', 'moderate', 'Máquina de remo', false),
  ('Escalada', 400, 'strength', 'moderate', 'Escalada indoor/outdoor', false);

-- Verificar que todo se creó correctamente
SELECT 'Exercises created:' as info, COUNT(*) as count FROM exercises;
SELECT 'Workouts table ready:' as info, COUNT(*) as count FROM workouts;
