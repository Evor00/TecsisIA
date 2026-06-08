-- ============================================================
--  SEED EXTRA: 10 tesis adicionales + 15 logs de consulta
--  Ejecutar DESPUÉS de tecsisai_schema.sql y patch_columnas_tesis.sql
-- ============================================================
SET search_path TO tecsisai, public;

-- ── Tesis adicionales C24 ────────────────────────────────────────────────────
-- El trigger trg_tesis_generar_codigo asigna el código automáticamente.

INSERT INTO tesis (titulo, autor, grupo, tecnologias, promocion, estado, similitud_maxima, score, usuario_id)
VALUES
  ('Plataforma de Telemedicina con IA y Diagnóstico por Imagen',
   'A. Mendoza · R. Ccori · V. Salinas',
   'Grupo Eta', '["Flutter","TensorFlow","FastAPI","PostgreSQL"]',
   'C24', 'Aprobada', 41.50, '91/100', 1),

  ('Sistema de Monitoreo Ambiental IoT con Dashboard en Tiempo Real',
   'P. Solis · N. Huanca',
   'Grupo Theta', '["React","Node.js","MQTT","InfluxDB"]',
   'C24', 'En Revisión', 29.80, NULL, 1),

  ('Aplicación de Delivery con Seguimiento GPS y Pagos Online',
   'C. Vargas · F. Paredes · G. Quispe',
   'Grupo Iota', '["React Native","Node.js","Firebase","Stripe"]',
   'C24', 'Observada', 67.30, NULL, 1),

  ('Sistema ERP para PYMEs con Módulo de Contabilidad',
   'J. Llanos · B. Arce',
   'Grupo Kappa', '["Vue.js","Laravel","MySQL","Docker"]',
   'C24', 'Aprobada', 52.10, '88/100', 1),

  ('Chatbot de Atención al Cliente con Procesamiento de Lenguaje Natural',
   'D. Cueva · S. Puma · M. Rios',
   'Grupo Lambda', '["React","Python","Rasa","PostgreSQL"]',
   'C24', 'En Revisión', 35.60, NULL, 1),

  ('Control de Acceso Biométrico con Reconocimiento Facial',
   'E. Valois · G. Cruz',
   'Grupo Mu', '["Python","OpenCV","FastAPI","React"]',
   'C24', 'Aprobada', 44.20, '86/100', 1),

  ('Marketplace de Servicios Freelance con Sistema de Pagos Escrow',
   'K. Quispe · L. Ramos · T. Aguilar',
   'Grupo Nu', '["Next.js","Node.js","PostgreSQL","Stripe"]',
   'C24', 'En Revisión', 23.90, NULL, 1),

  ('Sistema de Gestión Académica para Institutos Superiores',
   'M. Torres · R. Flores',
   'Grupo Xi', '["Angular","Spring Boot","Oracle","Docker"]',
   'C24', 'Rechazada', 79.40, NULL, 1),

  ('Plataforma E-Learning Adaptativa con Recomendaciones por IA',
   'H. Díaz · C. Mamani · A. Zapata',
   'Grupo Pi', '["React","FastAPI","PostgreSQL","scikit-learn"]',
   'C24', 'Aprobada', 38.70, '93/100', 1),

  ('App de Salud Mental con Seguimiento de Estado de Ánimo',
   'L. Condori · P. Huanca',
   'Grupo Rho', '["Flutter","Firebase","Node.js"]',
   'C24', 'En Revisión', 18.50, NULL, 1);


-- ── Logs de consulta adicionales ─────────────────────────────────────────────

INSERT INTO log_consultas (usuario_id, prompt_ingresado, resultado, tokens_procesados, fecha)
VALUES
  (1,
   'Sistemas de reconocimiento facial y biometría',
   '[{"titulo":"Control de Acceso Biométrico","autor":"E. Valois","similitud":78,"estado":"aprobado","codigo":"C24-012"},{"titulo":"Plataforma de Telemedicina con IA","autor":"A. Mendoza","similitud":62,"estado":"aprobado","codigo":"C24-007"}]',
   1380, NOW() - INTERVAL '1 day'),

  (1,
   'Aplicaciones móviles con Flutter para salud',
   '[{"titulo":"App de Salud Mental","autor":"L. Condori","similitud":85,"estado":"en-revision","codigo":"C24-016"},{"titulo":"Plataforma de Telemedicina con IA","autor":"A. Mendoza","similitud":71,"estado":"aprobado","codigo":"C24-007"}]',
   1050, NOW() - INTERVAL '2 days'),

  (1,
   'Machine learning y predicción de datos académicos',
   '[{"titulo":"Plataforma E-Learning Adaptativa","autor":"H. Díaz","similitud":69,"estado":"aprobado","codigo":"C24-015"},{"titulo":"Chatbot NLP","autor":"D. Cueva","similitud":54,"estado":"en-revision","codigo":"C24-011"}]',
   1620, NOW() - INTERVAL '3 days'),

  (1,
   'Microservicios y arquitectura de contenedores Docker',
   '[{"titulo":"Sistema ERP para PYMEs","autor":"J. Llanos","similitud":73,"estado":"aprobado","codigo":"C24-010"},{"titulo":"Sistema de Gestión Académica","autor":"M. Torres","similitud":88,"estado":"rechazado","codigo":"C24-014"}]',
   1780, NOW() - INTERVAL '4 days'),

  (1,
   'Pagos en línea y comercio electrónico',
   '[{"titulo":"Marketplace Freelance","autor":"K. Quispe","similitud":91,"estado":"en-revision","codigo":"C24-013"},{"titulo":"App de Delivery con GPS","autor":"C. Vargas","similitud":77,"estado":"observado","codigo":"C24-009"}]',
   1440, NOW() - INTERVAL '5 days'),

  (1,
   'Integración de IoT con bases de datos de series temporales',
   '[{"titulo":"Sistema de Monitoreo Ambiental IoT","autor":"P. Solis","similitud":83,"estado":"en-revision","codigo":"C24-008"}]',
   920, NOW() - INTERVAL '6 days'),

  (1,
   'APIs REST con Node.js y Express para e-commerce',
   '[]',
   670, NOW() - INTERVAL '7 days'),

  (1,
   'Sistemas de recomendación con filtrado colaborativo',
   '[{"titulo":"Plataforma E-Learning Adaptativa","autor":"H. Díaz","similitud":66,"estado":"aprobado","codigo":"C24-015"}]',
   1190, NOW() - INTERVAL '8 days'),

  (1,
   'Procesamiento de lenguaje natural en español',
   '[{"titulo":"Chatbot de Atención al Cliente","autor":"D. Cueva","similitud":89,"estado":"en-revision","codigo":"C24-011"}]',
   1350, NOW() - INTERVAL '9 days'),

  (1,
   'Bases de datos vectoriales para búsqueda semántica',
   '[]',
   740, NOW() - INTERVAL '10 days'),

  (1,
   'Desarrollo full-stack con Next.js y PostgreSQL',
   '[{"titulo":"Marketplace de Servicios Freelance","autor":"K. Quispe","similitud":58,"estado":"en-revision","codigo":"C24-013"}]',
   1080, NOW() - INTERVAL '11 days'),

  (1,
   'Seguridad en aplicaciones web: autenticación y autorización',
   '[]',
   860, NOW() - INTERVAL '12 days'),

  (1,
   'Visión por computadora para detección de objetos en tiempo real',
   '[{"titulo":"Control de Acceso Biométrico","autor":"E. Valois","similitud":74,"estado":"aprobado","codigo":"C24-012"}]',
   1560, NOW() - INTERVAL '13 days'),

  (1,
   'Gestión de proyectos ágiles con tableros Kanban digitales',
   '[]',
   580, NOW() - INTERVAL '14 days'),

  (1,
   'Análisis de sentimientos en redes sociales con deep learning',
   '[{"titulo":"App de Salud Mental","autor":"L. Condori","similitud":61,"estado":"en-revision","codigo":"C24-016"},{"titulo":"Chatbot NLP","autor":"D. Cueva","similitud":55,"estado":"en-revision","codigo":"C24-011"}]',
   1290, NOW() - INTERVAL '15 days');
