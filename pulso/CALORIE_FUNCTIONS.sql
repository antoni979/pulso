-- Script para agregar funciones de cálculo de calorías en Supabase
-- Ejecuta esto en tu Supabase SQL Editor

-- ============================================
-- FUNCIÓN 1: Calcular TMB (Tasa Metabólica Basal)
-- usando la fórmula de Harris-Benedict
-- ============================================
CREATE OR REPLACE FUNCTION calculate_tmb(
  p_weight DECIMAL,
  p_height INTEGER,
  p_birth_date DATE,
  p_sex TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_age INTEGER;
  v_tmb DECIMAL;
BEGIN
  -- Calcular edad
  v_age := EXTRACT(YEAR FROM AGE(CURRENT_DATE, p_birth_date));

  -- Validar edad
  IF v_age < 15 OR v_age > 100 THEN
    RETURN 0;
  END IF;

  -- Calcular TMB según sexo (fórmula Harris-Benedict)
  IF p_sex = 'male' THEN
    v_tmb := 88.362 + (13.397 * p_weight) + (4.799 * p_height) - (5.677 * v_age);
  ELSIF p_sex = 'female' THEN
    v_tmb := 447.593 + (9.247 * p_weight) + (3.098 * p_height) - (4.330 * v_age);
  ELSE
    RETURN 0; -- Para 'other' o valores inválidos
  END IF;

  RETURN ROUND(v_tmb);
END;
$$;

-- ============================================
-- FUNCIÓN 2: Obtener calorías quemadas por pasos hoy
-- (60 kcal por cada 1000 pasos)
-- ============================================
CREATE OR REPLACE FUNCTION get_today_steps_calories(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_calories INTEGER;
BEGIN
  SELECT COALESCE(calories_burned, 0)
  INTO v_calories
  FROM daily_steps
  WHERE user_id = p_user_id
    AND step_date = CURRENT_DATE;

  RETURN COALESCE(v_calories, 0);
END;
$$;

-- ============================================
-- FUNCIÓN 3: Obtener calorías quemadas por ejercicio hoy
-- ============================================
CREATE OR REPLACE FUNCTION get_today_workout_calories(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_calories INTEGER;
BEGIN
  SELECT COALESCE(SUM(calories_burned), 0)
  INTO v_calories
  FROM workouts
  WHERE user_id = p_user_id
    AND DATE(workout_date) = CURRENT_DATE;

  RETURN COALESCE(v_calories, 0);
END;
$$;

-- ============================================
-- FUNCIÓN 4: Obtener calorías consumidas hoy
-- ============================================
CREATE OR REPLACE FUNCTION get_today_consumed_calories(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_calories INTEGER;
BEGIN
  SELECT COALESCE(SUM(calories), 0)
  INTO v_calories
  FROM meals
  WHERE user_id = p_user_id
    AND DATE(eaten_at) = CURRENT_DATE;

  RETURN COALESCE(v_calories, 0);
END;
$$;

-- ============================================
-- FUNCIÓN 5: Calcular efecto termogénico (10% de consumidas)
-- ============================================
CREATE OR REPLACE FUNCTION calculate_thermic_effect(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_consumed INTEGER;
  v_thermic INTEGER;
BEGIN
  v_consumed := get_today_consumed_calories(p_user_id);
  v_thermic := ROUND(v_consumed * 0.10);

  RETURN v_thermic;
END;
$$;

-- ============================================
-- FUNCIÓN 6: Calcular TOTAL de calorías quemadas hoy
-- TMB + Pasos + Ejercicio + Termogénesis
-- ============================================
CREATE OR REPLACE FUNCTION get_total_calories_burned_today(p_user_id UUID)
RETURNS TABLE (
  tmb INTEGER,
  steps_calories INTEGER,
  workout_calories INTEGER,
  thermic_effect INTEGER,
  total_burned INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_tmb INTEGER;
  v_steps INTEGER;
  v_workouts INTEGER;
  v_thermic INTEGER;
  v_total INTEGER;
  v_weight DECIMAL;
  v_height INTEGER;
  v_birth_date DATE;
  v_sex TEXT;
BEGIN
  -- Obtener datos del perfil para calcular TMB
  SELECT current_weight, height, birth_date, sex
  INTO v_weight, v_height, v_birth_date, v_sex
  FROM user_profiles
  WHERE id = p_user_id;

  -- Calcular TMB
  IF v_weight IS NOT NULL AND v_height IS NOT NULL
     AND v_birth_date IS NOT NULL AND v_sex IS NOT NULL THEN
    v_tmb := calculate_tmb(v_weight, v_height, v_birth_date, v_sex);
  ELSE
    v_tmb := 0;
  END IF;

  -- Obtener otros componentes
  v_steps := get_today_steps_calories(p_user_id);
  v_workouts := get_today_workout_calories(p_user_id);
  v_thermic := calculate_thermic_effect(p_user_id);

  -- Calcular total
  v_total := v_tmb + v_steps + v_workouts + v_thermic;

  -- Retornar tabla con desglose
  RETURN QUERY SELECT v_tmb, v_steps, v_workouts, v_thermic, v_total;
END;
$$;

-- ============================================
-- FUNCIÓN 7: Obtener balance calórico completo de hoy
-- Consumidas - Quemadas = Balance (déficit/superávit)
-- ============================================
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
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_consumed INTEGER;
  v_burned_data RECORD;
  v_balance INTEGER;
  v_goal INTEGER;
BEGIN
  -- Obtener consumidas
  v_consumed := get_today_consumed_calories(p_user_id);

  -- Obtener desglose de quemadas
  SELECT * INTO v_burned_data
  FROM get_total_calories_burned_today(p_user_id);

  -- Calcular balance (negativo = déficit, positivo = superávit)
  v_balance := v_consumed - v_burned_data.total_burned;

  -- Obtener déficit objetivo del perfil
  SELECT daily_calorie_goal
  INTO v_goal
  FROM user_profiles
  WHERE id = p_user_id;

  v_goal := COALESCE(v_goal, -500); -- Por defecto -500 kcal de déficit

  -- Retornar tabla completa
  RETURN QUERY SELECT
    v_consumed,
    v_burned_data.tmb,
    v_burned_data.steps_calories,
    v_burned_data.workout_calories,
    v_burned_data.thermic_effect,
    v_burned_data.total_burned,
    v_balance,
    v_goal;
END;
$$;

-- ============================================
-- FUNCIÓN 8: Vista materializada o función de resumen semanal
-- Para ver el progreso de la semana
-- ============================================
CREATE OR REPLACE FUNCTION get_week_calorie_summary(p_user_id UUID)
RETURNS TABLE (
  day_date DATE,
  consumed INTEGER,
  burned INTEGER,
  balance INTEGER,
  goal_met BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH week_days AS (
    SELECT CURRENT_DATE - n AS day_date
    FROM generate_series(0, 6) AS n
  ),
  daily_consumed AS (
    SELECT
      DATE(eaten_at) AS day_date,
      SUM(calories) AS total_consumed
    FROM meals
    WHERE user_id = p_user_id
      AND eaten_at >= CURRENT_DATE - INTERVAL '6 days'
    GROUP BY DATE(eaten_at)
  ),
  daily_burned AS (
    SELECT
      wd.day_date,
      -- Aquí simplificamos, en producción calcularías TMB + pasos + workouts por cada día
      COALESCE(SUM(w.calories_burned), 0) +
      COALESCE((SELECT calories_burned FROM daily_steps WHERE user_id = p_user_id AND step_date = wd.day_date), 0) AS total_burned
    FROM week_days wd
    LEFT JOIN workouts w ON DATE(w.workout_date) = wd.day_date AND w.user_id = p_user_id
    GROUP BY wd.day_date
  )
  SELECT
    wd.day_date,
    COALESCE(dc.total_consumed, 0)::INTEGER AS consumed,
    COALESCE(db.total_burned, 0)::INTEGER AS burned,
    (COALESCE(dc.total_consumed, 0) - COALESCE(db.total_burned, 0))::INTEGER AS balance,
    (COALESCE(dc.total_consumed, 0) - COALESCE(db.total_burned, 0)) <=
      (SELECT daily_calorie_goal FROM user_profiles WHERE id = p_user_id) AS goal_met
  FROM week_days wd
  LEFT JOIN daily_consumed dc ON wd.day_date = dc.day_date
  LEFT JOIN daily_burned db ON wd.day_date = db.day_date
  ORDER BY wd.day_date DESC;
END;
$$;

-- ============================================
-- PERMISOS: Permitir que los usuarios autenticados ejecuten estas funciones
-- ============================================
GRANT EXECUTE ON FUNCTION calculate_tmb TO authenticated;
GRANT EXECUTE ON FUNCTION get_today_steps_calories TO authenticated;
GRANT EXECUTE ON FUNCTION get_today_workout_calories TO authenticated;
GRANT EXECUTE ON FUNCTION get_today_consumed_calories TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_thermic_effect TO authenticated;
GRANT EXECUTE ON FUNCTION get_total_calories_burned_today TO authenticated;
GRANT EXECUTE ON FUNCTION get_today_calorie_balance TO authenticated;
GRANT EXECUTE ON FUNCTION get_week_calorie_summary TO authenticated;

-- ============================================
-- EJEMPLOS DE USO:
-- ============================================

-- Ejemplo 1: Obtener balance completo de hoy
-- SELECT * FROM get_today_calorie_balance(auth.uid());

-- Ejemplo 2: Obtener desglose de calorías quemadas
-- SELECT * FROM get_total_calories_burned_today(auth.uid());

-- Ejemplo 3: Calcular solo TMB
-- SELECT calculate_tmb(75, 175, '1993-05-15', 'male');

-- Ejemplo 4: Resumen de la semana
-- SELECT * FROM get_week_calorie_summary(auth.uid());

-- ============================================
-- NOTAS:
-- ============================================
-- Estas funciones se ejecutan en el servidor de Supabase
-- Reducen la carga en el cliente
-- Garantizan cálculos consistentes
-- Pueden ser usadas en triggers o scheduled jobs
-- Se actualizan automáticamente con los datos más recientes
