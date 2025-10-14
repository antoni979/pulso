import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions
export interface UserProfile {
  id: string
  full_name: string | null
  sex: 'male' | 'female' | 'other' | null
  birth_date: string | null
  height: number | null
  current_weight: number | null
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null
  goal: 'lose_weight' | 'maintain' | 'gain_muscle' | null
  caloric_deficit_goal: number
  daily_calorie_goal: number
  protein_goal: number
  carbs_goal: number
  fats_goal: number
  created_at: string
  updated_at: string
}

export interface Measurement {
  id: string
  user_id: string
  measurement_date: string
  weight: number | null
  chest: number | null
  waist: number | null
  hips: number | null
  thigh: number | null
  arm: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Meal {
  id: string
  user_id: string
  name: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  calories: number
  protein: number
  carbs: number
  fats: number
  eaten_at: string
  created_at: string
  updated_at: string
}

export interface Food {
  id: string
  user_id: string | null
  name: string
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fats_per_100g: number
  is_custom: boolean
  created_at: string
}

export interface Exercise {
  id: string
  name: string
  calories_per_hour: number
  category: string | null
  intensity: 'low' | 'moderate' | 'high' | null
  description: string | null
  is_custom: boolean
  user_id: string | null
  created_at: string
}

export interface Workout {
  id: string
  user_id: string
  exercise_name: string
  duration_minutes: number
  calories_burned: number
  workout_date: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DailySteps {
  id: string
  user_id: string
  steps_count: number
  calories_burned: number
  step_date: string
  created_at: string
  updated_at: string
}
