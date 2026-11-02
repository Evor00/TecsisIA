from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


OUTPUT = Path(r"C:\TecsisAi-2\output\guiones")
OUTPUT.mkdir(parents=True, exist_ok=True)


def set_font(run, size=11, bold=False, color=None):
    run.font.name = "Aptos"
    run._element.rPr.rFonts.set(qn("w:ascii"), "Aptos")
    run._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos")
    run.font.size = Pt(size)
    run.bold = bold
    if color:
        run.font.color.rgb = RGBColor(*color)


def style_doc(doc):
    section = doc.sections[0]
    section.top_margin = Inches(0.75)
    section.bottom_margin = Inches(0.7)
    section.left_margin = Inches(0.8)
    section.right_margin = Inches(0.8)

    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = "Aptos"
    normal._element.rPr.rFonts.set(qn("w:ascii"), "Aptos")
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos")
    normal.font.size = Pt(11)
    normal.paragraph_format.space_after = Pt(7)
    normal.paragraph_format.line_spacing = 1.12

    for name, size in [("Title", 22), ("Heading 1", 15), ("Heading 2", 12)]:
        st = styles[name]
        st.font.name = "Aptos"
        st._element.rPr.rFonts.set(qn("w:ascii"), "Aptos")
        st._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos")
        st.font.size = Pt(size)
        st.font.color.rgb = RGBColor(0, 0, 0)
        st.font.bold = True
        st.paragraph_format.space_before = Pt(14 if name != "Title" else 0)
        st.paragraph_format.space_after = Pt(6)


def title(doc, text, subtitle):
    p = doc.add_paragraph(style="Title")
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_font(p.add_run(text), 22, True, (0, 0, 0))
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_font(p.add_run(subtitle), 11, False, (70, 70, 70))
    p.paragraph_format.space_after = Pt(16)


def heading(doc, text):
    p = doc.add_paragraph(style="Heading 1")
    set_font(p.add_run(text), 15, True, (0, 0, 0))
    return p


def paragraph(doc, text, italic=False):
    p = doc.add_paragraph()
    r = p.add_run(text)
    set_font(r, 11, False, (0, 0, 0))
    r.italic = italic
    return p


def speaker(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.18)
    p.paragraph_format.space_after = Pt(8)
    r = p.add_run('"' + text + '"')
    set_font(r, 11, False, (0, 0, 0))
    return p


def tip(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(5)
    r = p.add_run("Clave: ")
    set_font(r, 10, True, (25, 85, 150))
    r = p.add_run(text)
    set_font(r, 10, False, (55, 55, 55))


def bullet(doc, text):
    p = doc.add_paragraph(style="List Bullet")
    p.paragraph_format.space_after = Pt(4)
    set_font(p.add_run(text), 10, False, (0, 0, 0))


def add_slide_script(doc, number, slide, timing, spoken, key):
    heading(doc, f"{number}. {slide}  ({timing})")
    speaker(doc, spoken)
    tip(doc, key)


def build_ppt_script():
    doc = Document()
    style_doc(doc)
    title(doc, "Guion de exposición TecSis IA", "Presentación de 10 minutos para sustentación")
    paragraph(doc, "Este guion sirve para presentar el problema, la solución y el funcionamiento técnico de TecSis IA. Mantén un ritmo natural: explica la idea central de cada diapositiva y evita leer todo de forma literal.", True)

    add_slide_script(doc, "1", "Portada", "25 segundos",
        "Buenos días, jurado. Presentamos TecSis IA, una plataforma web para centralizar la gestión de tesis y facilitar la consulta de conocimiento académico mediante inteligencia artificial. Nuestro propósito es transformar un repositorio de documentos dispersos en una fuente de información organizada, consultable y trazable.",
        "No expliques tecnologías todavía. Abre con el problema de conocimiento que queda sin aprovechar.")
    add_slide_script(doc, "2", "Problemática", "50 segundos",
        "Las tesis suelen almacenarse como archivos PDF o XML, muchas veces dispersos y difíciles de consultar. La búsqueda tradicional depende de palabras exactas. Por ejemplo, una tesis puede hablar de predicción de demanda y el usuario buscar pronóstico de ventas; una búsqueda convencional podría no relacionarlas. Esto consume tiempo y reduce el aprovechamiento del conocimiento académico.",
        "Usa un ejemplo sencillo de términos parecidos para que se entienda la búsqueda semántica.")
    add_slide_script(doc, "3", "Objetivo solución y alcance", "50 segundos",
        "Como solución proponemos TecSis IA, una plataforma web que centraliza la información de tesis y permite consultarla mediante búsqueda semántica. El alcance incluye autenticación, gestión de tesis, carga de archivos PDF o XML, procesamiento documental, consultas semánticas e historial de consultas. Los usuarios directos son los encargados del repositorio y docentes; los estudiantes son beneficiarios indirectos.",
        "Diferencia alcance actual de posibilidades futuras. No prometas funcionalidades que no estén implementadas.")
    add_slide_script(doc, "4", "Requerimientos funcionales", "55 segundos",
        "Los requerimientos principales se agrupan en autenticación y control de acceso por roles; gestión de tesis; carga y procesamiento de documentos; y consultas con inteligencia artificial e historial. Esto permite gestionar tanto la información académica como la interacción del usuario con el repositorio.",
        "Menciona solo los requerimientos que se pueden demostrar o defender en el sistema.")
    add_slide_script(doc, "5", "Tecnologías utilizadas", "1 minuto",
        "En la interfaz utilizamos React con Vite. React permite construir una interfaz dinámica por componentes y Vite agiliza el desarrollo. En el backend utilizamos Django REST Framework, que expone la API y concentra la lógica de usuarios, tesis, documentos y consultas. Para la persistencia usamos PostgreSQL y, para trabajar con vectores semánticos, utilizamos la extensión pgvector.",
        "No digas que una tecnología se usa si no está en el proyecto. Estas son las capas reales de la solución.")
    add_slide_script(doc, "6", "Procesamiento documental y embeddings", "1 minuto 15 segundos",
        "Cuando se carga una tesis en PDF o XML, el backend extrae su contenido y lo divide en fragmentos, llamados chunks. Para representar cada fragmento utilizamos el modelo de embeddings paraphrase multilingual MiniLM L12 v2, de Sentence Transformers. Es un modelo multilingüe adecuado para texto en español y genera vectores de 384 dimensiones. Cada vector normalizado se guarda en PostgreSQL, en la tabla documentos rag, mediante pgvector.",
        "Esta es una de las partes más técnicas: recalca modelo, Sentence Transformers, 384 dimensiones y pgvector.")
    add_slide_script(doc, "7", "Consulta semántica RAG", "1 minuto 15 segundos",
        "Cuando el usuario formula una pregunta, aplicamos el mismo modelo de embeddings a la consulta y obtenemos otro vector de 384 dimensiones. Luego pgvector compara ese vector con los vectores de los fragmentos almacenados y recupera los más similares por significado. Este enfoque se llama RAG: primero recuperamos evidencia desde nuestro repositorio y luego usamos ese contexto para construir la respuesta.",
        "Aclara que el embedding recupera evidencia; no es el modelo que redacta la respuesta final.")
    add_slide_script(doc, "8", "Arquitectura y modelo de datos", "1 minuto",
        "El usuario interactúa con el frontend en React y Vite. Este consume la API creada con Django REST Framework. El backend gestiona las validaciones, autenticación, tesis, documentos y consultas, y se conecta a PostgreSQL. El procesamiento RAG usa Sentence Transformers para los embeddings y pgvector para la búsqueda por similitud. En datos, usuarios se relaciona con tesis, las tesis con documentos rag, y también se mantienen conversaciones, mensajes y registros de consulta para conservar trazabilidad.",
        "Separa mentalmente arquitectura de datos: primero el flujo de componentes y luego las relaciones principales.")
    add_slide_script(doc, "9", "Cronograma", "45 segundos",
        "El proyecto fue planificado de abril a diciembre. Las etapas incluyen análisis, requerimientos, diseño, desarrollo de backend y frontend, procesamiento documental, búsqueda semántica, pruebas, documentación y preparación de sustentación. El orden permite construir primero la base del sistema y después integrar la funcionalidad de inteligencia artificial.",
        "No leas todas las filas del Gantt. Explica la secuencia y la lógica del plan.")
    add_slide_script(doc, "10", "Conclusión y siguiente etapa", "45 segundos",
        "Como conclusión, TecSis IA no solo almacena tesis: convierte sus contenidos en conocimiento recuperable mediante embeddings, pgvector y RAG. Como siguiente etapa proponemos validar la calidad de las respuestas con usuarios reales y definir formalmente el modelo institucional que se utilizará en producción. Muchas gracias. A continuación mostraremos una breve demostración del sistema.",
        "No afirmes que está en producción si aún es una etapa futura.")

    heading(doc, "Distribución de tiempo")
    paragraph(doc, "PPT: aproximadamente 8 minutos y 40 segundos. Reserva el resto hasta los 10 minutos para transiciones, una pausa breve o una explicación adicional solicitada por el jurado.")
    doc.save(OUTPUT / "Guion_Exposicion_TecSis_IA.docx")


def build_demo_script():
    doc = Document()
    style_doc(doc)
    title(doc, "Guion de demostración técnica TecSis IA", "Demostración de 5 minutos con explicación de tecnologías")
    paragraph(doc, "Este guion acompaña las acciones que se muestran en el sistema. El objetivo es que el jurado entienda qué sucede técnicamente detrás de cada pantalla.", True)

    add_slide_script(doc, "1", "Inicio de sesión", "30 segundos",
        "Primero ingresamos al sistema mediante autenticación. La interfaz está desarrollada con React y Vite. Al iniciar sesión, el frontend envía la solicitud al backend construido con Django REST Framework. El backend valida las credenciales y controla el acceso según el rol del usuario.",
        "No muestres contraseñas. Explica que las acciones disponibles dependen del rol.")
    add_slide_script(doc, "2", "Listado y gestión de tesis", "45 segundos",
        "Después de autenticarnos, consultamos el repositorio de tesis. Esta información se almacena en PostgreSQL. Cada tesis cuenta con datos como código, título, autor, promoción, estado, ruta del archivo y usuario responsable. Esto permite tener un repositorio estructurado y trazable.",
        "Muestra una tesis real y sus metadatos. Evita navegar por demasiadas pantallas.")
    add_slide_script(doc, "3", "Registro o carga documental", "55 segundos",
        "En esta etapa registramos o visualizamos una tesis y cargamos su documento en PDF o XML. El backend recibe el archivo, extrae el contenido textual y lo divide en fragmentos para prepararlo para la búsqueda. La tesis permanece como entidad académica y los fragmentos procesados se guardan como documentos rag asociados a ella.",
        "No necesitas mostrar toda la carga si demora; puedes mostrar un documento previamente indexado.")
    add_slide_script(doc, "4", "Modelo de embeddings", "55 segundos",
        "Para convertir los fragmentos de texto en representaciones numéricas utilizamos Sentence Transformers con el modelo paraphrase multilingual MiniLM L12 v2. Este modelo es multilingüe, trabaja con español y genera embeddings de 384 dimensiones. Los vectores se normalizan y se almacenan mediante pgvector en PostgreSQL, en una columna vector de 384 dimensiones.",
        "Si el jurado pregunta por qué: es un modelo multilingüe y ligero, apropiado para recuperación semántica en español.")
    add_slide_script(doc, "5", "Consulta semántica", "1 minuto 10 segundos",
        "Ahora realizamos una pregunta en lenguaje natural. El sistema aplica el mismo modelo de embeddings a la pregunta y genera un vector. Luego pgvector compara ese vector con los vectores de los fragmentos de tesis y recupera los más similares por significado. Por eso, el sistema no depende solo de encontrar palabras idénticas; busca contexto relacionado.",
        "Es la parte principal de la demo: escribe una pregunta clara relacionada con documentos ya indexados.")
    add_slide_script(doc, "6", "Respuesta basada en evidencia", "45 segundos",
        "La consulta sigue un enfoque RAG, Retrieval Augmented Generation. Primero recuperamos evidencia relevante del repositorio y esa evidencia se utiliza como contexto para construir una respuesta. Así reducimos el riesgo de responder sin base documental, porque la información se fundamenta en las tesis procesadas.",
        "No digas que elimina totalmente las alucinaciones; di que reduce el riesgo al usar evidencia recuperada.")
    add_slide_script(doc, "7", "Historial y cierre", "30 segundos",
        "Finalmente, el sistema registra conversaciones, mensajes y consultas. Esto aporta trazabilidad sobre el uso de la plataforma. Con esta demostración se evidencia el flujo completo: autenticación, gestión de tesis, procesamiento documental y consulta semántica sobre conocimiento institucional.",
        "Cierra la demo aquí. Si quedan preguntas, vuelve a arquitectura o DER, no improvises una función nueva.")

    heading(doc, "Respuestas técnicas breves")
    paragraph(doc, "¿Qué modelo de embeddings usan?")
    speaker(doc, "Usamos paraphrase multilingual MiniLM L12 v2, mediante Sentence Transformers. Genera embeddings de 384 dimensiones y es adecuado para textos académicos en español.")
    paragraph(doc, "¿Por qué pgvector?")
    speaker(doc, "Porque permite almacenar y comparar los embeddings directamente en PostgreSQL, evitando separar la base transaccional de la búsqueda vectorial para este alcance.")
    paragraph(doc, "¿El modelo de embeddings redacta la respuesta?")
    speaker(doc, "No. El modelo de embeddings recupera fragmentos relevantes. La respuesta se construye a partir de ese contexto recuperado mediante el modelo institucional definido para la generación.")
    paragraph(doc, "¿Cómo reducen respuestas sin fundamento?")
    speaker(doc, "Primero recuperamos fragmentos relevantes del repositorio y los usamos como evidencia. Esto reduce el riesgo de respuestas sin base documental, aunque la calidad debe validarse con pruebas y usuarios reales.")
    doc.save(OUTPUT / "Guion_Demo_Tecnica_TecSis_IA.docx")


if __name__ == "__main__":
    build_ppt_script()
    build_demo_script()
