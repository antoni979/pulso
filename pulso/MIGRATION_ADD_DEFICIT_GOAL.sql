-- Migration: Add caloric_deficit_goal to user_profiles
-- This column will store the user's desired caloric deficit/surplus (negative for deficit, positive for surplus)

-- Add the column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS caloric_deficit_goal INTEGER DEFAULT -500;

-- Update comment for documentation
COMMENT ON COLUMN user_profiles.caloric_deficit_goal IS 'Daily caloric deficit goal (negative = deficit, positive = surplus). Default: -500 kcal';

-- Update the get_today_calorie_balance function to use the profile's deficit goal
CREATE OR REPLACE FUNCTION get_today_calorie_balance(p_user_id UUID)
RETURNS TABLE (
  consumed INTEGER,
  tmb INTEGER,
  steps_calories INTEGER,
  workout_calories INTEGER,
  thermic_effect INTEGER,
  total_burned INTEGER,
  balance INTEGER,
  deficit_goal INTEGER
) AS $$
DECLARE
  v_tmb DECIMAL;
  v_age INTEGER;
  v_consumed INTEGER;
  v_steps_cal INTEGER;
  v_workout_cal INTEGER;
  v_thermic DECIMAL;
  v_total_burned INTEGER;
  v_deficit_goal INTEGER;
BEGIN
  -- Get user profile data
  SELECT
    CASE
      WHEN up.sex = 'male' THEN
        88.362 + (13.397 * COALESCE(m.weight, up.current_weight, 70)) + (4.799 * COALESCE(up.height, 170)) - (5.677 * EXTRACT(YEAR FROM AGE(CURRENT_DATE, up.birth_date)))
      ELSE
        447.593 + (9.247 * COALESCE(m.weight, up.current_weight, 60)) + (3.098 * COALESCE(up.height, 160)) - (4.330 * EXTRACT(YEAR FROM AGE(CURRENT_DATE, up.birth_date)))
    END,
    COALESCE(up.caloric_deficit_goal, -500)
  INTO v_tmb, v_deficit_goal
  FROM user_profiles up
  LEFT JOIN LATERAL (
    SELECT weight
    FROM measurements
    WHERE user_id = p_user_id
    ORDER BY measurement_date DESC
    LIMIT 1
  ) m ON true
  WHERE up.id = p_user_id;

  -- If profile not found, return zeros
  IF v_tmb IS NULL THEN
    RETURN QUERY SELECT 0, 0, 0, 0, 0, 0, 0, -500;
    RETURN;
  END IF;

  -- Get total calories consumed today
  SELECT COALESCE(SUM(calories), 0)
  INTO v_consumed
  FROM meals
  WHERE user_id = p_user_id
    AND DATE(eaten_at AT TIME ZONE 'UTC') = CURRENT_DATE;

  -- Get calories from steps today (60 kcal per 1000 steps)
  SELECT COALESCE(SUM(calories_burned), 0)
  INTO v_steps_cal
  FROM daily_steps
  WHERE user_id = p_user_id
    AND DATE(step_date) = CURRENT_DATE;

  -- Get calories from workouts today
  SELECT COALESCE(SUM(calories_burned), 0)
  INTO v_workout_cal
  FROM workouts
  WHERE user_id = p_user_id
    AND DATE(workout_date AT TIME ZONE 'UTC') = CURRENT_DATE;

  -- Calculate thermic effect (10% of consumed calories)
  v_thermic := v_consumed * 0.10;

  -- Calculate total burned
  v_total_burned := ROUND(v_tmb + v_steps_cal + v_workout_cal + v_thermic);

  -- Return the balance data
  RETURN QUERY SELECT
    v_consumed::INTEGER,
    ROUND(v_tmb)::INTEGER,
    v_steps_cal::INTEGER,
    v_workout_cal::INTEGER,
    ROUND(v_thermic)::INTEGER,
    v_total_burned::INTEGER,
    (v_consumed - v_total_burned)::INTEGER as balance,
    v_deficit_goal::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
