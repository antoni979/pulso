-- Function to get calorie balance for the last 7 days
CREATE OR REPLACE FUNCTION get_weekly_calorie_balance(p_user_id UUID)
RETURNS TABLE (
  date DATE,
  consumed INTEGER,
  burned INTEGER,
  balance INTEGER,
  deficit_goal INTEGER
) AS $$
DECLARE
  v_tmb DECIMAL;
  v_deficit_goal INTEGER;
  v_current_date DATE;
  i INTEGER;
BEGIN
  -- Get user's TMB and deficit goal
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

  -- If profile not found, return empty
  IF v_tmb IS NULL THEN
    RETURN;
  END IF;

  -- Loop through last 7 days
  FOR i IN 0..6 LOOP
    v_current_date := CURRENT_DATE - i;

    RETURN QUERY
    SELECT
      v_current_date as date,
      COALESCE(SUM(meals.calories), 0)::INTEGER as consumed,
      (
        v_tmb +
        COALESCE((SELECT SUM(ds.calories_burned) FROM daily_steps ds WHERE ds.user_id = p_user_id AND DATE(ds.step_date) = v_current_date), 0) +
        COALESCE((SELECT SUM(w.calories_burned) FROM workouts w WHERE w.user_id = p_user_id AND DATE(w.workout_date AT TIME ZONE 'UTC') = v_current_date), 0) +
        (COALESCE(SUM(meals.calories), 0) * 0.10)
      )::INTEGER as burned,
      (
        COALESCE(SUM(meals.calories), 0) - (
          v_tmb +
          COALESCE((SELECT SUM(ds.calories_burned) FROM daily_steps ds WHERE ds.user_id = p_user_id AND DATE(ds.step_date) = v_current_date), 0) +
          COALESCE((SELECT SUM(w.calories_burned) FROM workouts w WHERE w.user_id = p_user_id AND DATE(w.workout_date AT TIME ZONE 'UTC') = v_current_date), 0) +
          (COALESCE(SUM(meals.calories), 0) * 0.10)
        )
      )::INTEGER as balance,
      v_deficit_goal::INTEGER as deficit_goal
    FROM meals
    WHERE meals.user_id = p_user_id
      AND DATE(meals.eaten_at AT TIME ZONE 'UTC') = v_current_date
    GROUP BY v_current_date;

    -- If no meals for this day, still return a row with zeros
    IF NOT FOUND THEN
      RETURN QUERY
      SELECT
        v_current_date as date,
        0::INTEGER as consumed,
        v_tmb::INTEGER as burned,
        (0 - v_tmb)::INTEGER as balance,
        v_deficit_goal::INTEGER as deficit_goal;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
