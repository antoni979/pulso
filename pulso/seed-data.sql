-- ============================================
-- DATOS DE EJEMPLO PARA PULSO
-- Ejecutar este script en el SQL Editor de Supabase
-- ============================================

-- ============================================
-- ALIMENTOS (foods)
-- ============================================

INSERT INTO foods (name, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g, is_custom, user_id) VALUES
  -- Proteínas
  ('Pollo pechuga', 165, 31, 0, 4, false, NULL),
  ('Pavo pechuga', 135, 30, 0, 1, false, NULL),
  ('Ternera magra', 250, 26, 0, 15, false, NULL),
  ('Salmón', 208, 20, 0, 13, false, NULL),
  ('Atún', 132, 28, 0, 1, false, NULL),
  ('Huevo', 155, 13, 1, 11, false, NULL),
  ('Claras de huevo', 52, 11, 1, 0, false, NULL),
  ('Queso fresco', 174, 11, 3, 13, false, NULL),
  ('Yogur griego', 97, 10, 4, 5, false, NULL),
  ('Proteína whey', 400, 80, 8, 5, false, NULL),

  -- Carbohidratos
  ('Arroz blanco cocido', 130, 3, 28, 0, false, NULL),
  ('Arroz integral cocido', 112, 3, 24, 1, false, NULL),
  ('Pasta cocida', 131, 5, 25, 1, false, NULL),
  ('Pan integral', 247, 13, 41, 4, false, NULL),
  ('Pan blanco', 265, 9, 49, 3, false, NULL),
  ('Avena', 389, 17, 66, 7, false, NULL),
  ('Patata cocida', 77, 2, 17, 0, false, NULL),
  ('Boniato', 86, 2, 20, 0, false, NULL),
  ('Quinoa cocida', 120, 4, 21, 2, false, NULL),

  -- Frutas
  ('Plátano', 89, 1, 23, 0, false, NULL),
  ('Manzana', 52, 0, 14, 0, false, NULL),
  ('Naranja', 47, 1, 12, 0, false, NULL),
  ('Fresas', 32, 1, 8, 0, false, NULL),
  ('Uvas', 69, 1, 18, 0, false, NULL),
  ('Sandía', 30, 1, 8, 0, false, NULL),
  ('Kiwi', 61, 1, 15, 1, false, NULL),
  ('Piña', 50, 1, 13, 0, false, NULL),

  -- Verduras
  ('Brócoli', 34, 3, 7, 0, false, NULL),
  ('Espinacas', 23, 3, 4, 0, false, NULL),
  ('Lechuga', 15, 1, 3, 0, false, NULL),
  ('Tomate', 18, 1, 4, 0, false, NULL),
  ('Zanahoria', 41, 1, 10, 0, false, NULL),
  ('Pepino', 16, 1, 4, 0, false, NULL),
  ('Pimiento', 31, 1, 6, 0, false, NULL),
  ('Coliflor', 25, 2, 5, 0, false, NULL),
  ('Judías verdes', 31, 2, 7, 0, false, NULL),

  -- Grasas saludables
  ('Aguacate', 160, 2, 9, 15, false, NULL),
  ('Nueces', 654, 15, 14, 65, false, NULL),
  ('Almendras', 579, 21, 22, 50, false, NULL),
  ('Cacahuetes', 567, 26, 16, 49, false, NULL),
  ('Aceite de oliva', 884, 0, 0, 100, false, NULL),
  ('Mantequilla de cacahuete', 588, 25, 20, 50, false, NULL),

  -- Lácteos
  ('Leche entera', 61, 3, 5, 3, false, NULL),
  ('Leche desnatada', 34, 3, 5, 0, false, NULL),
  ('Yogur natural', 61, 3, 5, 3, false, NULL),

  -- Snacks y otros
  ('Tortitas de arroz', 387, 8, 82, 3, false, NULL),
  ('Galletas integrales', 435, 7, 67, 15, false, NULL),
  ('Chocolate negro 85%', 598, 8, 24, 50, false, NULL)
ON CONFLICT DO NOTHING;

-- ============================================
-- EJERCICIOS (exercises)
-- ============================================

INSERT INTO exercises (name, calories_per_hour, category, intensity, description, is_custom, user_id) VALUES
  -- Cardio
  ('Correr (8 km/h)', 480, 'cardio', 'moderate', 'Carrera suave o jogging', false, NULL),
  ('Correr (10 km/h)', 600, 'cardio', 'high', 'Carrera intensa', false, NULL),
  ('Correr (12 km/h)', 720, 'cardio', 'high', 'Carrera muy intensa', false, NULL),
  ('Caminar rápido', 280, 'cardio', 'low', 'Caminata a buen ritmo', false, NULL),
  ('Caminar ligero', 200, 'cardio', 'low', 'Caminata suave', false, NULL),
  ('Ciclismo (16 km/h)', 360, 'cardio', 'moderate', 'Bicicleta ritmo moderado', false, NULL),
  ('Ciclismo (20 km/h)', 480, 'cardio', 'high', 'Bicicleta ritmo intenso', false, NULL),
  ('Natación (estilo libre)', 420, 'cardio', 'moderate', 'Natación estilo crol', false, NULL),
  ('Natación (intensa)', 600, 'cardio', 'high', 'Natación a ritmo intenso', false, NULL),
  ('Elíptica', 360, 'cardio', 'moderate', 'Máquina elíptica', false, NULL),
  ('Remo', 420, 'cardio', 'high', 'Máquina de remo', false, NULL),
  ('Saltar cuerda', 600, 'cardio', 'high', 'Comba o salto de cuerda', false, NULL),
  ('HIIT', 500, 'cardio', 'high', 'Entrenamiento de alta intensidad', false, NULL),
  ('Spinning', 480, 'cardio', 'high', 'Clase de bicicleta estática', false, NULL),
  ('Zumba', 360, 'cardio', 'moderate', 'Baile aeróbico', false, NULL),
  ('Aerobic', 320, 'cardio', 'moderate', 'Aeróbic clásico', false, NULL),

  -- Fuerza
  ('Pesas (moderado)', 240, 'strength', 'moderate', 'Entrenamiento con pesas', false, NULL),
  ('Pesas (intenso)', 360, 'strength', 'high', 'Entrenamiento intenso con pesas', false, NULL),
  ('CrossFit', 480, 'strength', 'high', 'Entrenamiento funcional de alta intensidad', false, NULL),
  ('Calistenia', 300, 'strength', 'moderate', 'Ejercicios con peso corporal', false, NULL),
  ('TRX', 300, 'strength', 'moderate', 'Entrenamiento en suspensión', false, NULL),
  ('Pilates', 240, 'strength', 'low', 'Ejercicios de control y fortalecimiento', false, NULL),
  ('Funcional', 300, 'strength', 'moderate', 'Entrenamiento funcional', false, NULL),

  -- Deportes
  ('Fútbol', 420, 'sports', 'moderate', 'Partido de fútbol', false, NULL),
  ('Baloncesto', 360, 'sports', 'moderate', 'Partido de baloncesto', false, NULL),
  ('Tenis', 360, 'sports', 'moderate', 'Partido de tenis', false, NULL),
  ('Pádel', 360, 'sports', 'moderate', 'Partido de pádel', false, NULL),
  ('Voleibol', 240, 'sports', 'moderate', 'Partido de voleibol', false, NULL),
  ('Artes marciales', 480, 'sports', 'high', 'Artes marciales o boxeo', false, NULL),
  ('Boxeo', 540, 'sports', 'high', 'Entrenamiento de boxeo', false, NULL),
  ('Escalada', 420, 'sports', 'moderate', 'Escalada deportiva', false, NULL),

  -- Flexibilidad
  ('Yoga', 180, 'flexibility', 'low', 'Sesión de yoga', false, NULL),
  ('Yoga (power)', 240, 'flexibility', 'moderate', 'Yoga dinámico', false, NULL),
  ('Estiramientos', 120, 'flexibility', 'low', 'Sesión de estiramientos', false, NULL),
  ('Tai Chi', 180, 'flexibility', 'low', 'Práctica de Tai Chi', false, NULL),

  -- Otros
  ('Jardinería', 200, 'other', 'low', 'Trabajo de jardinería', false, NULL),
  ('Limpiar casa', 180, 'other', 'low', 'Tareas del hogar', false, NULL),
  ('Bailar (salsa, bachata)', 300, 'other', 'moderate', 'Baile social', false, NULL),
  ('Patinar', 360, 'other', 'moderate', 'Patinaje sobre ruedas o hielo', false, NULL),
  ('Golf', 240, 'other', 'low', 'Jugar al golf', false, NULL),
  ('Senderismo', 300, 'other', 'moderate', 'Caminata por montaña', false, NULL)
ON CONFLICT DO NOTHING;
