from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

out = r'C:\TecsisAi-2\output\Anexo_TecSisIA_DER_Epicas_Historias.docx'
doc = Document()
sec=doc.sections[0]; sec.top_margin=Inches(.7); sec.bottom_margin=Inches(.7); sec.left_margin=Inches(.75); sec.right_margin=Inches(.75)
styles=doc.styles; styles['Normal'].font.name='Calibri'; styles['Normal']._element.rPr.rFonts.set(qn('w:eastAsia'),'Calibri'); styles['Normal'].font.size=Pt(10)

def shade(cell, color='17365D'):
    tcPr=cell._tc.get_or_add_tcPr(); shd=OxmlElement('w:shd'); shd.set(qn('w:fill'),color); tcPr.append(shd)
def header(row):
    for c in row.cells:
        shade(c)
        for p in c.paragraphs:
            for r in p.runs: r.font.color.rgb=__import__('docx').shared.RGBColor(255,255,255); r.bold=True
def table(headers, rows, widths=None):
    t=doc.add_table(rows=1, cols=len(headers)); t.style='Table Grid';
    for i,h in enumerate(headers): t.rows[0].cells[i].text=h
    header(t.rows[0])
    for row in rows:
        cells=t.add_row().cells
        for i,v in enumerate(row): cells[i].text=str(v)
    if widths:
        for row in t.rows:
            for i,w in enumerate(widths): row.cells[i].width=Inches(w)
    doc.add_paragraph()
    return t

p=doc.add_paragraph(style='Title'); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.add_run('Anexo de análisis funcional y modelo de datos')
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.add_run('TecSis-IA Gestión Centralizada de Tesis con IA Local').bold=True
doc.add_paragraph('Este anexo resume el modelo entidad relación, las épicas y las historias de usuario del proyecto TecSis-IA. Sirve como material de respaldo para la sustentación y la validación de requisitos.')

doc.add_heading('Modelo entidad relación lógico', level=1)
doc.add_paragraph('El modelo organiza la gestión de tesis, documentos indexados y consultas. Las relaciones principales permiten mantener trazabilidad sobre quién registra contenido, qué documento pertenece a cada proyecto y qué consultas se realizaron.')
table(['Entidad','Campos principales','Relaciones'],[
['Usuario','id_usuario, nombre, correo, contraseña_hash, rol','Registra tesis y realiza consultas'],
['Tesis','id_tesis, título, autores, año, estado, activo','Pertenece a un usuario o responsable; tiene documentos'],
['Documento RAG','id_documento, archivo, tipo, contenido, estado_indexación, embedding','Pertenece a una tesis; alimenta la búsqueda semántica'],
['Consulta','id_consulta, pregunta, respuesta, fecha','La realiza un usuario; recupera documentos relacionados'],
['Conversación','id_conversación, mensaje, rol, fecha','Pertenece a una consulta y usuario'],
['Estado','id_estado, nombre, descripción','Clasifica el avance de una tesis']
],[1.25,3.3,2.5])
doc.add_heading('Relaciones principales', level=2)
for x in ['Usuario 1 a N Tesis','Tesis 1 a N Documento RAG','Usuario 1 a N Consulta','Consulta 1 a N Conversación','Estado 1 a N Tesis']:
    doc.add_paragraph(x, style='List Bullet')

doc.add_page_break()
doc.add_heading('Épicas e historias de usuario', level=1)
epics=[
('EP-01','Autenticación y acceso seguro','Medio','HU-01 a HU-04'),
('EP-02','Carga y procesamiento de documentos académicos','Alto','HU-05 a HU-10'),
('EP-03','Control de visibilidad del repositorio','Bajo','HU-11 a HU-15'),
('EP-04','Métricas e historial del sistema','Alto','HU-16 a HU-20')]
table(['Código','Épica','Prioridad','Historias'],epics,[.7,3.8,.9,1.1])
stories=[
('HU-01','Iniciar sesión en el panel administrativo con usuario y contraseña institucional','3'),('HU-02','Ver mensaje de error claro al ingresar credenciales incorrectas','2'),('HU-03','Cerrar sesión de forma segura desde el panel administrativo','1'),('HU-04','Mantener la sesión activa durante la jornada sin autenticarse nuevamente','3'),
('HU-05','Cargar un archivo XML o PDF desde el panel administrativo','4'),('HU-06','Registrar metadatos del proyecto título autores año y carrera durante la carga','3'),('HU-07','Recibir confirmación visual del éxito o fallo del procesamiento del archivo','2'),('HU-08','Ver el estado de indexación pendiente procesando activo o error','3'),('HU-09','Visualizar el listado completo de documentos y sus estados de indexación','3'),('HU-10','Eliminar un documento del catálogo cuando ya no sea parte del corpus activo','2'),
('HU-11','Activar un documento para incluirlo en el corpus de consulta','2'),('HU-12','Desactivar temporalmente un documento sin eliminarlo','2'),('HU-13','Filtrar documentos por estado activo inactivo o error','3'),('HU-14','Buscar un documento por título autor o año','3'),('HU-15','Ver el detalle de metadatos de un documento seleccionado','2'),
('HU-16','Visualizar métricas generales del repositorio','4'),('HU-17','Consultar el total de proyectos registrados y documentos indexados','3'),('HU-18','Ver el historial de consultas realizadas mediante el asistente de IA','4'),('HU-19','Exportar el historial de análisis','3'),('HU-20','Consultar conversaciones anteriores realizadas con el asistente de IA','5')]
table(['Código','Historia de usuario','Esfuerzo'],stories,[.75,5.3,.75])
doc.add_heading('Criterios de aceptación principales', level=1)
for t in ['El acceso solo permite usuarios con credenciales válidas y muestra un mensaje claro ante error.','La carga acepta archivos PDF o XML y registra los metadatos del proyecto.','El sistema muestra el estado de indexación y permite controlar la visibilidad de cada documento.','Las consultas recuperan información del repositorio activo y registran el historial de interacción.','El panel muestra métricas e historial para el seguimiento del repositorio.']:
    doc.add_paragraph(t, style='List Bullet')
doc.save(out)
