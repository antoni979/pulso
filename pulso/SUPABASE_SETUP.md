# Supabase Setup Guide

## 1. Environment Variables

Create a `.env` file in the root directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

You can find these values in your Supabase project settings:
- Go to: Project Settings → API
- Copy the URL and anon/public key

## 2. Database Schema

Execute the following SQL in your Supabase SQL Editor to create the required tables:

```sql
-- Create user_profiles table (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  sex TEXT CHECK (sex IN ('male', 'female', 'other')),
  birth_date DATE,
  height INTEGER, -- in cm
  current_weight DECIMAL(5,2), -- in kg
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal TEXT CHECK (goal IN ('lose_weight', 'maintain', 'gain_muscle')),
  caloric_deficit_goal INTEGER DEFAULT -500, -- negative = deficit, positive = surplus
  daily_calorie_goal INTEGER DEFAULT 2000,
  protein_goal INTEGER DEFAULT 150,
  carbs_goal INTEGER DEFAULT 200,
  fats_goal INTEGER DEFAULT 65,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create measurements table for tracking body metrics over time
CREATE TABLE measurements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  measurement_date DATE NOT NULL,
  weight DECIMAL(5,2), -- in kg
  chest DECIMAL(5,2), -- in cm
  waist DECIMAL(5,2), -- in cm
  hips DECIMAL(5,2), -- in cm
  thigh DECIMAL(5,2), -- in cm
  arm DECIMAL(5,2), -- in cm
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, measurement_date)
);

-- Create meals table
CREATE TABLE meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  meal_type TEXT NOT NULL, -- breakfast, lunch, dinner, snack
  calories INTEGER NOT NULL,
  protein INTEGER DEFAULT 0,
  carbs INTEGER DEFAULT 0,
  fats INTEGER DEFAULT 0,
  eaten_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create foods table (optional - for food database)
CREATE TABLE foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  calories_per_100g INTEGER NOT NULL,
  protein_per_100g INTEGER DEFAULT 0,
  carbs_per_100g INTEGER DEFAULT 0,
  fats_per_100g INTEGER DEFAULT 0,
  is_custom BOOLEAN DEFAULT false,
  serving_unit TEXT, -- 'taza', 'unidad', 'cucharada', 'vaso', etc
  serving_size_grams DECIMAL(10, 2), -- Cuántos gramos equivale 1 unidad
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exercises table
CREATE TABLE exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  calories_per_hour INTEGER NOT NULL,
  category TEXT,
  intensity TEXT CHECK (intensity IN ('low', 'moderate', 'high')),
  description TEXT,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workouts table (tracking exercise sessions)
CREATE TABLE workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  calories_burned INTEGER NOT NULL,
  workout_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_steps table (tracking daily step count)
CREATE TABLE daily_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  steps_count INTEGER NOT NULL DEFAULT 0,
  calories_burned INTEGER NOT NULL DEFAULT 0,
  step_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, step_date)
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_steps ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create policies for measurements
CREATE POLICY "Users can view own measurements"
  ON measurements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own measurements"
  ON measurements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own measurements"
  ON measurements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own measurements"
  ON measurements FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for meals
CREATE POLICY "Users can view own meals"
  ON meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own meals"
  ON meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals"
  ON meals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals"
  ON meals FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for foods
CREATE POLICY "Users can view all foods"
  ON foods FOR SELECT
  USING (true);

CREATE POLICY "Users can create custom foods"
  ON foods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom foods"
  ON foods FOR UPDATE
  USING (auth.uid() = user_id AND is_custom = true);

CREATE POLICY "Users can delete own custom foods"
  ON foods FOR DELETE
  USING (auth.uid() = user_id AND is_custom = true);

-- Create policies for exercises
CREATE POLICY "Users can view all exercises"
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

-- Create policies for workouts
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

-- Create policies for daily_steps
CREATE POLICY "Users can view own daily steps"
  ON daily_steps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own daily steps"
  ON daily_steps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily steps"
  ON daily_steps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily steps"
  ON daily_steps FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_measurements_user_id ON measurements(user_id);
CREATE INDEX idx_measurements_date ON measurements(measurement_date);
CREATE INDEX idx_meals_user_id ON meals(user_id);
CREATE INDEX idx_meals_eaten_at ON meals(eaten_at);
CREATE INDEX idx_foods_user_id ON foods(user_id);
CREATE INDEX idx_foods_name ON foods(name);
CREATE INDEX idx_exercises_user_id ON exercises(user_id);
CREATE INDEX idx_exercises_name ON exercises(name);
CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workouts_date ON workouts(workout_date);
CREATE INDEX idx_daily_steps_user_id ON daily_steps(user_id);
CREATE INDEX idx_daily_steps_date ON daily_steps(step_date);
```

## 3. Authentication Setup

In Supabase Dashboard:
1. Go to Authentication → Providers
2. Enable Email provider (enabled by default)
3. Optional: Configure email templates in Authentication → Email Templates

## 4. Test Connection

After setting up the `.env` file and running the SQL scripts:
1. Run `npm run dev`
2. Try to register a new user
3. Check if the user_profiles table is automatically populated
4. Test login functionality

## 5. Optional: Seed Data

Add some sample foods to the database:

```sql
INSERT INTO foods (name, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g, is_custom) VALUES
  ('Pollo pechuga', 165, 31, 0, 3.6, false),
  ('Arroz blanco cocido', 130, 2.7, 28, 0.3, false),
  ('Brocoli', 34, 2.8, 7, 0.4, false),
  ('Huevo', 155, 13, 1.1, 11, false),
  ('Plátano', 89, 1.1, 23, 0.3, false),
  ('Avena', 389, 17, 66, 7, false),
  ('Salmón', 208, 20, 0, 13, false);
```
