# -*- coding: utf-8 -*-
import os

BASE = r"D:\TecsisAi-2\ejemplos_tesis"
os.makedirs(BASE, exist_ok=True)

TESIS_XML = [
    {
        "titulo": "Sistema de Monitoreo IoT para Invernaderos Inteligentes con Raspberry Pi",
        "autores": ["C. Valdivia", "S. Huayta", "R. Mendoza"],
        "grupo": "Grupo Delta",
        "promocion": "C24",
        "codigo": "C24-101",
        "estado": "Aprobada",
        "score": "91/100",
        "tecnologias": ["Python", "Raspberry Pi", "MQTT", "InfluxDB", "Grafana"],
        "resumen": "Sistema embebido de monitoreo de variables ambientales (temperatura, humedad, CO2 y luminosidad) para invernaderos, usando sensores conectados a Raspberry Pi que publican datos mediante protocolo MQTT hacia una base de datos InfluxDB. Panel de control en tiempo real desarrollado en Grafana con alertas automáticas por correo y SMS.",
        "secciones": {
            "Introducción": "La agricultura de precisión requiere el control constante de variables ambientales para maximizar la productividad y reducir pérdidas. Los invernaderos tradicionales dependen de la observación manual, lo que genera errores e inconsistencias. Este proyecto propone un sistema IoT de bajo costo para automatizar el monitoreo ambiental en invernaderos de pequeña y mediana escala.",
            "Marco Teórico": "El Internet de las Cosas (IoT) permite conectar dispositivos físicos a internet para recopilar y compartir datos. MQTT (Message Queuing Telemetry Transport) es un protocolo de mensajería ligero ideal para dispositivos con recursos limitados. InfluxDB es una base de datos de series temporales optimizada para datos de sensores. Grafana proporciona visualización en tiempo real con capacidad de alertas.",
            "Metodología": "Se utilizó la metodología de prototipado iterativo. Se instalaron sensores DHT22 (temperatura/humedad), MH-Z19 (CO2) y BH1750 (luminosidad) en un invernadero piloto. La Raspberry Pi 4 actúa como gateway central ejecutando un broker Mosquitto MQTT. Los datos se almacenan cada 30 segundos en InfluxDB Cloud. Se desarrollaron dashboards de Grafana con umbrales de alerta configurables.",
            "Resultados": "El sistema procesó más de 1.2 millones de lecturas en 30 días de prueba con disponibilidad del 99.4%. La detección de anomalías permitió prevenir 3 eventos de daño por temperatura extrema. El costo total del hardware fue de S/. 380, representando un 85% menos que soluciones comerciales equivalentes.",
            "Conclusiones": "El sistema IoT desarrollado cumple con los requisitos de monitoreo en tiempo real con bajo costo y alta fiabilidad. La integración de MQTT con InfluxDB demostró ser robusta para entornos de producción. Se recomienda incorporar modelos de predicción climática basados en Machine Learning para optimizar el control automatizado del invernadero."
        }
    },
    {
        "titulo": "Plataforma de Telemedicina con IA para Diagnóstico Dermatológico — Flutter y FastAPI",
        "autores": ["A. Mendoza", "R. Ccori"],
        "grupo": "Grupo Beta",
        "promocion": "C24",
        "codigo": "C24-102",
        "estado": "Aprobada",
        "score": "96/100",
        "tecnologias": ["Flutter", "FastAPI", "TensorFlow", "PostgreSQL", "AWS"],
        "resumen": "Aplicación móvil multiplataforma que permite a pacientes fotografiar lesiones de piel y recibir un diagnóstico preliminar usando un modelo CNN entrenado con el dataset HAM10000. El backend en FastAPI gestiona autenticación, histórico médico y comunicación con el médico. Desplegada en AWS con almacenamiento S3.",
        "secciones": {
            "Introducción": "Las enfermedades dermatológicas afectan al 30% de la población peruana, pero el acceso a especialistas en zonas rurales es limitado. La inteligencia artificial ha demostrado capacidad comparable a dermatólogos expertos en la clasificación de lesiones cutáneas. Este proyecto desarrolla una plataforma accesible que combina IA y telemedicina para democratizar el diagnóstico dermatológico.",
            "Marco Teórico": "Las redes neuronales convolucionales (CNN) son el estándar en visión computacional para clasificación de imágenes médicas. EfficientNet-B4 fue seleccionada por su equilibrio entre precisión y eficiencia computacional. Flutter permite desarrollar aplicaciones para iOS y Android desde una sola base de código. FastAPI es un framework moderno de Python para APIs REST con validación automática mediante Pydantic.",
            "Metodología": "El dataset HAM10000 (10,015 imágenes dermoscópicas) fue preprocesado con técnicas de data augmentation. Se implementó transfer learning partiendo de EfficientNet-B4 preentrenada en ImageNet. El entrenamiento utilizó GPU Tesla T4 en Google Colab durante 40 épocas. La app Flutter captura la imagen, la envía al API FastAPI en AWS EC2, y muestra el resultado con un mapa de calor Grad-CAM.",
            "Resultados": "El modelo alcanzó 89.3% de accuracy en clasificación de 7 tipos de lesiones. El tiempo de diagnóstico desde la captura es de 2.1 segundos. En pruebas con 80 pacientes voluntarios, el 94% consideró la interfaz intuitiva y el 87% afirmó que usaría la app como complemento a una consulta médica.",
            "Conclusiones": "La plataforma demuestra la viabilidad de la IA como herramienta de apoyo diagnóstico en dermatología. La precisión del 89.3% es comparable a estudios similares publicados en literatura científica. Se recomienda recopilar datos de pacientes peruanos para fine-tuning del modelo y mejorar la representatividad étnica del dataset."
        }
    },
    {
        "titulo": "Chatbot de Atención al Cliente con NLP usando BERT y React",
        "autores": ["D. Cueva", "B. Arce", "S. Puma"],
        "grupo": "Grupo Gamma",
        "promocion": "C24",
        "codigo": "C24-103",
        "estado": "Aprobada",
        "score": "88/100",
        "tecnologias": ["React", "FastAPI", "Hugging Face", "BERT", "Redis"],
        "resumen": "Sistema de chatbot inteligente para servicio al cliente que utiliza el modelo BERT fine-tuneado para comprensión de intención en español. El sistema clasifica consultas en 25 categorías y genera respuestas usando una base de conocimiento vectorial. Gestión de sesiones con Redis y panel de monitoreo en tiempo real.",
        "secciones": {
            "Introducción": "Las empresas de retail peruano reciben un promedio de 1,500 consultas diarias que requieren respuesta inmediata. La atención manual genera altos costos operativos y tiempos de espera que afectan la satisfacción del cliente. Este proyecto implementa un chatbot basado en procesamiento de lenguaje natural capaz de resolver el 70% de las consultas sin intervención humana.",
            "Marco Teórico": "BERT (Bidirectional Encoder Representations from Transformers) es un modelo de lenguaje preentrenado que captura el contexto bidireccional de las palabras. El fine-tuning permite adaptar BERT a dominios específicos con datasets reducidos. Los vectores de embeddings permiten búsqueda semántica en bases de conocimiento. Redis gestiona el estado de conversaciones con latencia de microsegundos.",
            "Metodología": "Se recopiló un dataset de 8,000 interacciones reales de un centro de atención al cliente. BERT-base-multilingual fue fine-tuneado para clasificación de intención en 25 categorías. La base de conocimiento se indexó con FAISS para búsqueda de similitud semántica. El frontend en React implementa un widget embebible con historial de conversación y transferencia a agente humano.",
            "Resultados": "El chatbot resolvió el 73% de las consultas sin escalar a un agente humano. La precisión de clasificación de intención alcanzó el 91.4%. El tiempo promedio de respuesta fue de 0.8 segundos. La satisfacción del cliente (CSAT) mejoró de 3.2 a 4.1 sobre 5.",
            "Conclusiones": "El chatbot NLP demostró ser una solución efectiva y escalable para atención al cliente. El uso de BERT en español superó significativamente enfoques basados en reglas. Se recomienda incorporar análisis de sentimiento para detectar clientes frustrados y priorizar la escalación a agentes humanos."
        }
    },
    {
        "titulo": "Sistema de Control de Almacén con RFID y Angular",
        "autores": ["E. Valois", "G. Cruz"],
        "grupo": "Grupo Omega",
        "promocion": "C24",
        "codigo": "C24-104",
        "estado": "Aprobada",
        "score": "85/100",
        "tecnologias": ["Angular", "Spring Boot", "RFID", "MySQL", "Docker"],
        "resumen": "Sistema web para control automatizado de almacén usando tecnología RFID para rastreo de activos en tiempo real. La plataforma Angular permite visualizar la ubicación de cada producto, registrar entradas/salidas y generar reportes de inventario. Backend en Spring Boot con integración a lectores RFID Zebra FX7500.",
        "secciones": {
            "Introducción": "Los errores de inventario en almacenes logísticos generan pérdidas significativas estimadas en el 3.5% de las ventas anuales. La tecnología RFID (Radio Frequency Identification) permite la identificación y rastreo automático de objetos sin contacto visual. Este proyecto implementa un sistema de control de almacén que elimina el conteo manual mediante etiquetas RFID y lectores estratégicamente ubicados.",
            "Marco Teórico": "La tecnología RFID utiliza campos electromagnéticos para identificar y rastrear etiquetas con datos. Los lectores fijos Zebra FX7500 pueden leer hasta 750 etiquetas por segundo con un rango de 10 metros. Angular es un framework TypeScript para desarrollo de aplicaciones web empresariales con arquitectura de componentes. Spring Boot proporciona un backend robusto con APIs REST bien definidas.",
            "Metodología": "Se instalaron 4 lectores RFID en los accesos del almacén piloto de 500 m². Se etiquetaron 2,000 productos con tags RFID EPC Gen2. El backend Spring Boot procesa los eventos RFID en tiempo real mediante WebSockets. Angular muestra un mapa interactivo del almacén con la ubicación de cada producto. Se desarrollaron APIs de integración con el ERP SAP existente.",
            "Resultados": "El tiempo de inventario completo se redujo de 8 horas a 23 minutos. La precisión del inventario mejoró del 94.2% al 99.7%. Las mermas no detectadas se redujeron en un 80%. El ROI del sistema se proyecta en 14 meses considerando el costo de implementación.",
            "Conclusiones": "La implementación RFID demostró ser transformadora para las operaciones del almacén. La integración con el ERP SAP permitió sincronización bidireccional de inventarios en tiempo real. Se recomienda extender el sistema a los almacenes de distribución regional para consolidar la visibilidad de la cadena de suministro."
        }
    },
    {
        "titulo": "App de Delivery con Seguimiento GPS en Tiempo Real — React Native y Node.js",
        "autores": ["P. Solis", "N. Huanca", "C. Vargas"],
        "grupo": "Grupo Sigma",
        "promocion": "C24",
        "codigo": "C24-105",
        "estado": "Aprobada",
        "score": "90/100",
        "tecnologias": ["React Native", "Node.js", "Socket.io", "MongoDB", "Google Maps API"],
        "resumen": "Aplicación móvil de delivery con rastreo GPS en tiempo real del repartidor, sistema de notificaciones push y calificación de pedidos. El backend Node.js gestiona pedidos, rutas y pagos con integración a Izipay. Comunicación en tiempo real mediante Socket.io para actualización del mapa en el cliente.",
        "secciones": {
            "Introducción": "El mercado de delivery en Lima creció un 340% durante la pandemia y mantiene una tasa de crecimiento anual del 45%. Sin embargo, la experiencia del usuario en aplicaciones de delivery locales presenta deficiencias en el rastreo en tiempo real y la comunicación con el repartidor. Este proyecto desarrolla una solución completa de delivery con énfasis en la transparencia y experiencia del cliente.",
            "Marco Teórico": "React Native permite desarrollar aplicaciones móviles nativas para iOS y Android compartiendo el 95% del código. Socket.io implementa comunicación bidireccional en tiempo real mediante WebSockets con fallback a long-polling. La API de Google Maps proporciona geocodificación, cálculo de rutas óptimas y renderizado de mapas. MongoDB es ideal para documentos de pedidos con esquemas flexibles.",
            "Metodología": "Se desarrollaron 3 aplicaciones: cliente (usuario final), repartidor y panel de administración web. El backend Node.js con Express gestiona los pedidos en MongoDB Atlas. La ubicación del repartidor se actualiza cada 3 segundos mediante Socket.io. Se implementó el algoritmo Dijkstra modificado para asignación óptima de repartidores considerando distancia y carga de trabajo.",
            "Resultados": "En 2 meses de piloto con 15 repartidores se procesaron 3,400 pedidos con una tasa de entrega exitosa del 97.8%. El tiempo promedio de entrega fue de 28 minutos. La calificación promedio de la experiencia fue 4.6/5. El sistema soportó picos de 200 pedidos simultáneos sin degradación del servicio.",
            "Conclusiones": "La aplicación de delivery demostró la viabilidad técnica de implementar rastreo GPS en tiempo real con Stack JavaScript full-stack. La arquitectura basada en eventos con Socket.io permitió escalabilidad horizontal eficiente. Se recomienda incorporar predicción de demanda por zona y horario para optimizar la distribución previa de repartidores."
        }
    },
    {
        "titulo": "Sistema ERP para PYMEs con Vue.js y Spring Boot",
        "autores": ["F. Paredes", "J. Llanos"],
        "grupo": "Grupo Alpha",
        "promocion": "C24",
        "codigo": "C24-106",
        "estado": "Aprobada",
        "score": "87/100",
        "tecnologias": ["Vue.js", "Spring Boot", "MySQL", "Docker", "Jenkins"],
        "resumen": "Sistema ERP modular para pequeñas y medianas empresas que integra módulos de ventas, compras, inventario, contabilidad y recursos humanos. Desarrollado con Vue.js en el frontend y Spring Boot en el backend con arquitectura de microservicios. Interfaz multiidioma (español/inglés) y generación de reportes en PDF.",
        "secciones": {
            "Introducción": "El 78% de las PYMEs peruanas no cuenta con un sistema ERP adecuado, dependiendo de hojas de cálculo y procesos manuales que dificultan el crecimiento. Los sistemas ERP comerciales como SAP resultan prohibitivos para empresas con menos de 50 empleados. Este proyecto desarrolla un ERP modular, asequible y adaptado a la realidad de las PYMEs peruanas.",
            "Marco Teórico": "Un ERP (Enterprise Resource Planning) integra todos los procesos de negocio en un sistema centralizado con una base de datos común. Vue.js es un framework progresivo JavaScript que permite construir interfaces de usuario con curva de aprendizaje gradual. Spring Boot con Spring Security implementa autenticación JWT y autorización basada en roles. Jenkins automatiza el ciclo CI/CD para despliegues sin interrupción.",
            "Metodología": "Se utilizó la metodología RUP (Rational Unified Process) con fases de inicio, elaboración, construcción y transición. Se levantaron requerimientos con 5 PYMEs del sector comercial. El sistema fue diseñado con arquitectura de microservicios: servicio de ventas, compras, inventario, contabilidad y RRHH independientes. Docker Compose orquesta los servicios en producción.",
            "Resultados": "El sistema fue implantado en 3 PYMEs piloto durante 3 meses. El tiempo de facturación se redujo en un 65%. Los errores de inventario disminuyeron al 0.8%. La generación de estados financieros pasó de 2 días a 5 minutos. El costo mensual de S/. 150 representa el 92% menos que alternativas comerciales comparables.",
            "Conclusiones": "El ERP modular desarrollado responde exitosamente a las necesidades de gestión de PYMEs peruanas a un costo accesible. La arquitectura de microservicios facilitó el desarrollo paralelo y el mantenimiento independiente de módulos. Se recomienda desarrollar una versión SaaS multitenancy para escalar el servicio a cientos de empresas mediante suscripción mensual."
        }
    },
    {
        "titulo": "Plataforma de E-Learning Adaptativo con Machine Learning",
        "autores": ["V. Castro", "M. Apaza", "L. Quispe"],
        "grupo": "Grupo Beta",
        "promocion": "C24",
        "codigo": "C24-107",
        "estado": "En Revisión",
        "score": "",
        "tecnologias": ["React", "Django", "Scikit-learn", "PostgreSQL", "Celery"],
        "resumen": "Plataforma de educación en línea que adapta el contenido y la secuencia de aprendizaje según el desempeño del estudiante usando algoritmos de Machine Learning. El sistema identifica el estilo de aprendizaje del usuario y personaliza los ejercicios, el ritmo de avance y los recursos adicionales recomendados.",
        "secciones": {
            "Introducción": "La educación online tiene una tasa de abandono promedio del 80% debido a la falta de personalización y retroalimentación inmediata. Los sistemas de e-learning tradicionales presentan el mismo contenido a todos los estudiantes independientemente de su nivel o estilo de aprendizaje. Este proyecto implementa un sistema adaptativo que personaliza la experiencia educativa usando inteligencia artificial.",
            "Marco Teórico": "El aprendizaje adaptativo usa algoritmos para personalizar el contenido educativo según el desempeño individual. Los Sistemas Tutores Inteligentes (ITS) modelan el conocimiento del estudiante y seleccionan actividades óptimas. La Teoría de Respuesta al Ítem (TRI) permite calibrar la dificultad de ejercicios. El algoritmo Knowledge Tracing bayesiano predice el dominio de habilidades específicas.",
            "Metodología": "Se desarrolló un modelo de perfil de aprendizaje usando K-means para clasificar estudiantes en 4 estilos (visual, auditivo, lector/escritor, kinestésico). Un modelo de árbol de decisión selecciona el siguiente ejercicio óptimo basado en el historial de respuestas. Celery gestiona tareas asíncronas de recalibración del perfil. El sistema fue probado con 120 estudiantes de programación básica durante 8 semanas.",
            "Resultados": "Los estudiantes en el grupo adaptativo completaron el 73% del curso vs 41% en el grupo control. La nota promedio de evaluación final fue 15.4 vs 12.8 en el grupo control. El tiempo de dominio de conceptos se redujo en un 35%. La satisfacción con el sistema fue calificada 4.4/5.",
            "Conclusiones": "El sistema de e-learning adaptativo demostró mejorar significativamente la tasa de completitud y el desempeño académico. La personalización basada en ML superó estadísticamente (p<0.05) al enfoque tradicional uniforme. Se recomienda implementar análisis de emociones mediante la cámara del dispositivo para detectar estados de frustración o aburrimiento en tiempo real."
        }
    },
    {
        "titulo": "Sistema de Detección de Fraude en Transacciones Bancarias con Redes Neuronales",
        "autores": ["R. Flores", "C. Mamani"],
        "grupo": "Grupo Delta",
        "promocion": "C24",
        "codigo": "C24-108",
        "estado": "Aprobada",
        "score": "93/100",
        "tecnologias": ["Python", "TensorFlow", "Kafka", "Spark", "PostgreSQL"],
        "resumen": "Sistema de detección de fraude en tiempo real para transacciones bancarias que procesa 10,000 transacciones por segundo usando Apache Kafka y Spark Streaming. El modelo LSTM entrenado con datos históricos de fraude detecta patrones anómalos con una precisión del 97.8% y genera alertas inmediatas al equipo de seguridad.",
        "secciones": {
            "Introducción": "El fraude bancario electrónico generó pérdidas de S/. 842 millones en Perú en 2024, con un incremento del 67% respecto al año anterior. Los sistemas de detección tradicionales basados en reglas presentan altas tasas de falsos positivos que generan fricción en los clientes legítimos. Este proyecto implementa un sistema de detección inteligente que equilibra precisión y experiencia del cliente.",
            "Marco Teórico": "Las redes LSTM (Long Short-Term Memory) son variantes de RNN capaces de capturar dependencias temporales en secuencias de transacciones. Apache Kafka es una plataforma de streaming distribuida que procesa millones de eventos por segundo. Apache Spark Streaming procesa micro-lotes de datos con latencia de milisegundos. El algoritmo SMOTE genera datos sintéticos de fraude para balancear el dataset altamente desbalanceado.",
            "Metodología": "Se utilizó un dataset de 2.8 millones de transacciones con 0.3% de fraudes. SMOTE incrementó las muestras de fraude al 15% para entrenamiento. La arquitectura LSTM usa una ventana temporal de las últimas 10 transacciones del cliente. El pipeline Kafka → Spark → LSTM → PostgreSQL procesa alertas en menos de 200ms. Se implementó un panel de gestión de alertas para el equipo antifraude.",
            "Resultados": "El modelo LSTM alcanzó 97.8% de F1-score en el conjunto de prueba. La tasa de falsos positivos se redujo al 0.12% comparado con el 2.8% del sistema basado en reglas anterior. El sistema detectó el 96.4% de fraudes en tiempo real. El throughput de 10,847 transacciones/segundo superó los requisitos del banco colaborador.",
            "Conclusiones": "El sistema de detección de fraude LSTM superó significativamente los enfoques tradicionales en todos los métricas evaluadas. La arquitectura Kafka-Spark demostró ser robusta y escalable para volúmenes de producción bancaria. Se recomienda implementar un modelo de ensemble que combine LSTM con XGBoost para mejorar la detección de fraudes emergentes."
        }
    },
    {
        "titulo": "Aplicación de Realidad Aumentada para Mantenimiento Industrial — Unity y ARCore",
        "autores": ["J. Benites", "A. Quispe", "F. Chávez"],
        "grupo": "Grupo Gamma",
        "promocion": "C24",
        "codigo": "C24-109",
        "estado": "Observada",
        "score": "",
        "tecnologias": ["Unity", "ARCore", "C#", "Python", "REST API"],
        "resumen": "Aplicación Android de realidad aumentada que superpone información de mantenimiento y guías paso a paso sobre equipos industriales capturados por la cámara del dispositivo. Usa reconocimiento de marcadores fiduciales y seguimiento 3D para mostrar instrucciones, valores de sensor en tiempo real y diagramas técnicos flotantes.",
        "secciones": {
            "Introducción": "Los errores en procedimientos de mantenimiento industrial generan el 23% de las fallas no planificadas en plantas manufactureras. Los manuales técnicos en papel son de difícil acceso durante el trabajo en campo y no reflejan actualizaciones en tiempo real. Este proyecto implementa una solución de realidad aumentada que lleva la documentación técnica directamente al campo visual del técnico.",
            "Marco Teórico": "La Realidad Aumentada (AR) superpone información digital sobre el entorno físico en tiempo real. ARCore de Google proporciona seguimiento del entorno, comprensión de la profundidad y estimación de iluminación en dispositivos Android. Unity es el motor de desarrollo más usado para aplicaciones AR/VR. Los marcadores fiduciales (ArUco) permiten identificación y localización precisa de equipos.",
            "Metodología": "Se desarrolló en Unity 2022 con el SDK ARFoundation/ARCore. Se crearon marcadores ArUco para 20 equipos industriales de la planta piloto. El backend Python proporciona datos de sensores en tiempo real vía API REST. La interfaz muestra overlays 3D con valores de temperatura, presión y rpm, además de guías paso a paso con video integrado. Se realizaron pruebas con 8 técnicos de mantenimiento.",
            "Resultados": "El tiempo de resolución de incidencias de mantenimiento se redujo en un 41%. Los errores de procedimiento disminuyeron un 68%. El 87.5% de los técnicos prefirió la aplicación AR sobre los manuales tradicionales. La precisión del seguimiento de marcadores fue del 98.2% con buenas condiciones de iluminación.",
            "Conclusiones": "La realidad aumentada demostró ser una herramienta valiosa para el mantenimiento industrial, mejorando la precisión y velocidad de los procedimientos. Las limitaciones encontradas incluyen sensibilidad a condiciones de iluminación deficiente y necesidad de dispositivos Android de gama media-alta. Se recomienda explorar el uso de HoloLens para liberar las manos del técnico durante las intervenciones."
        }
    },
    {
        "titulo": "Plataforma de Análisis de Sentimientos en Redes Sociales para Marketing Digital",
        "autores": ["K. Medina", "T. Ríos"],
        "grupo": "Grupo Omega",
        "promocion": "C24",
        "codigo": "C24-110",
        "estado": "Aprobada",
        "score": "89/100",
        "tecnologias": ["Python", "React", "Twitter API", "BERT", "Elasticsearch"],
        "resumen": "Dashboard de análisis de sentimientos que monitorea menciones de marcas en Twitter/X, Instagram y Facebook en tiempo real. Usa el modelo RoBERTa fine-tuneado para clasificación de sentimientos en español con detección de emociones (alegría, enojo, tristeza, sorpresa). Los resultados se indexan en Elasticsearch para búsqueda y análisis histórico.",
        "secciones": {
            "Introducción": "Las empresas peruanas invierten en promedio S/. 85,000 anuales en marketing digital sin métricas claras del impacto en la percepción de marca. El monitoreo manual de redes sociales es inviable dado el volumen de menciones. Este proyecto desarrolla una plataforma automatizada de social listening con análisis de sentimientos mediante IA para medir el pulso de la audiencia en tiempo real.",
            "Marco Teórico": "El análisis de sentimientos es una rama del NLP que clasifica texto según la polaridad emocional expresada. RoBERTa (Robustly Optimized BERT Approach) supera a BERT original en benchmarks de NLP. Elasticsearch proporciona búsqueda full-text e indexación en tiempo real con capacidad para millones de documentos. Apache Airflow orquesta los pipelines de ingesta de datos de múltiples plataformas.",
            "Metodología": "Se conectaron las APIs de Twitter v2, Instagram Graph API y Facebook Graph API para ingesta de menciones. RoBERTa-large-bne fue fine-tuneado con 50,000 tweets en español con etiquetas de sentimiento manual. Un pipeline Airflow ingesta y procesa 50,000 menciones diarias. Elasticsearch almacena los análisis para queries históricos. El dashboard React muestra tendencias, word clouds y mapas de calor por horario.",
            "Resultados": "El modelo alcanzó 88.4% de accuracy en clasificación de sentimientos y 83.1% en detección de emociones. El sistema procesó en promedio 127,000 menciones diarias de 10 marcas piloto. 3 marcas detectaron crisis de reputación emergente a través del sistema con 4 horas de anticipación respecto al monitoreo manual.",
            "Conclusiones": "La plataforma de análisis de sentimientos demostró ser una herramienta estratégica para la gestión de marca en redes sociales. La detección temprana de crisis justifica por sí sola la inversión en el sistema. Se recomienda incorporar análisis de influencers y detección automática de temas virales para complementar las capacidades de social listening."
        }
    }
]

def generar_xml(t):
    autores_xml = "\n    ".join(f"<autor>{a}</autor>" for a in t["autores"])
    techs_xml = "\n    ".join(f"<tecnologia>{x}</tecnologia>" for x in t["tecnologias"])
    secciones_xml = "\n  ".join(
        f'<seccion titulo="{titulo}">\n      {texto}\n    </seccion>'
        for titulo, texto in t["secciones"].items()
    )
    score_xml = f"<score>{t['score']}</score>" if t["score"] else ""
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<tesis>
  <titulo>{t["titulo"]}</titulo>
  <autores>
    {autores_xml}
  </autores>
  <grupo>{t["grupo"]}</grupo>
  <promocion>{t["promocion"]}</promocion>
  <codigo>{t["codigo"]}</codigo>
  <estado>{t["estado"]}</estado>
  {score_xml}
  <tecnologias>
    {techs_xml}
  </tecnologias>
  <resumen>
    {t["resumen"]}
  </resumen>
  <secciones>
  {secciones_xml}
  </secciones>
</tesis>"""

for t in TESIS_XML:
    nombre = t["codigo"].replace("-", "_") + "_" + t["titulo"][:40].replace(" ", "_").replace("/", "-") + ".xml"
    nombre = nombre.replace(":", "").replace("—", "").replace(",", "")
    ruta = os.path.join(BASE, nombre)
    with open(ruta, "w", encoding="utf-8") as f:
        f.write(generar_xml(t))

print(f"Generados {len(TESIS_XML)} archivos XML en {BASE}")
