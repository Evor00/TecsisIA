# Evaluación de calidad RAG — TecSis-IA

Este protocolo permite demostrar que las respuestas de TecSis-IA están basadas
en los proyectos indexados y no solo en texto generado por un modelo.

## Qué evaluar

Construye un conjunto de 20 a 30 preguntas reales de docentes o estudiantes.
Para cada pregunta identifica antes de ejecutar el sistema el proyecto o los
proyectos que deberían recuperarse. Incluye consultas de cuatro tipos:

- búsqueda directa: «¿Qué tesis usa React?»;
- comparación: «¿En qué se diferencian los proyectos A y B?»;
- consulta de detalle: «¿Qué metodología empleó el proyecto C?»;
- ausencia de evidencia: preguntas que no estén respaldadas por el repositorio.

## Registro de resultados

Usa una tabla como esta por cada ejecución:

| ID | Pregunta | Fuente esperada | Fuentes recuperadas | Cita correcta | Respuesta fiel | Tiempo (ms) | Observación |
|---|---|---|---|---|---|---:|---|
| R01 | ¿Qué proyecto usa React? | C24-001 | C24-001 | Sí | Sí | 850 | — |

La API incluye en `retrieval` el método utilizado, las fuentes recuperadas,
el umbral y `tiempo_recuperacion_ms`. Guarda además el tiempo total que tarda
en aparecer la respuesta al usuario.

## Métricas recomendadas

- **Recall@4:** porcentaje de preguntas donde la fuente esperada está entre las
  cuatro fuentes recuperadas.
- **Precisión de citas:** respuestas cuyas citas corresponden realmente a la
  afirmación realizada, divididas entre el total de respuestas con citas.
- **Fidelidad:** porcentaje de respuestas que no añaden datos fuera del
  contexto proporcionado.
- **Tasa de abstención correcta:** en preguntas sin evidencia, porcentaje de
  veces que el sistema reconoce la falta de información en lugar de inventarla.
- **Tiempo de respuesta:** media y mediana del tiempo total, y del tiempo de
  recuperación reportado por la API.

## Criterio de aceptación inicial

Como meta inicial para la demostración de tesis, busca al menos 80% de
Recall@4, 90% de precisión de citas y 90% de abstenciones correctas. Reporta
los resultados reales, el tamaño de la colección evaluada y las limitaciones:
calidad de PDFs, documentos sin texto, consultas ambiguas y disponibilidad del
modelo generativo.
