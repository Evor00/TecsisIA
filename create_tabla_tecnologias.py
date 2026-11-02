from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import textwrap

OUT = Path(r"C:\TecsisAi-2\output\tabla_tecnologias_tecsis_ia_compacta_v3.png")
OUT.parent.mkdir(parents=True, exist_ok=True)

W, H = 3840, 1600
M = 100
COLS = [500, 870, 840, 1330]
HEADER_H = 94
TITLE_H = 205

BG = "#F6F8FC"
NAVY = "#0C2D57"
BLUE = "#1267B3"
GRID = "#C9D4E2"
TEXT = "#17212E"
MUTED = "#40536A"
ALT = "#EEF5FD"
WHITE = "#FFFFFF"

font_dir = Path(r"C:\Windows\Fonts")
REG = str(font_dir / "arial.ttf")
BOLD = str(font_dir / "arialbd.ttf")

def font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else REG, size)

rows = [
    ("Frontend", "React 19 + Vite + Tailwind CSS", "Angular, Vue, Bootstrap", "Componentes reutilizables, interfaz ágil y estilos consistentes."),
    ("Backend y API", "Django 6 + Django REST Framework", "Flask, FastAPI, Node.js", "Autenticación, validaciones, reglas de negocio y API REST."),
    ("Base de datos", "PostgreSQL", "MySQL, MongoDB", "Datos relacionales de usuarios, tesis, conversaciones y consultas."),
    ("Búsqueda vectorial", "pgvector", "Pinecone, ChromaDB, Weaviate", "Embeddings y similitud vectorial dentro de PostgreSQL."),
    ("Embeddings", "paraphrase multilingual MiniLM L12 v2", "BGE, E5, OpenAI Embeddings", "Modelo multilingüe para español con vectores de 384 dimensiones."),
    ("RAG y documentos", "Sentence Transformers + RAG propio + PyPDF", "LangChain, LlamaIndex, PyMuPDF", "Procesa PDF/XML, fragmenta contenido y recupera evidencia."),
    ("Infraestructura", "LLM institucional local en Ubuntu con GPU", "Servicios cloud externos", "Mayor control institucional de datos académicos y del contexto."),
]

def wrap(text, width_px, fnt):
    words = text.split()
    lines, current = [], ""
    for word in words:
        test = word if not current else current + " " + word
        if ImageDraw.Draw(Image.new("RGB", (1, 1))).textlength(test, font=fnt) <= width_px:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


# Cada fila se ajusta al número real de líneas: no se deja espacio vacío
# cuando el contenido cabe en una sola línea.
BODY_SIZE = 38
LINE_H = 45
row_heights = []
for row in rows:
    max_lines = 1
    for c_idx, col_w in enumerate(COLS):
        lines = wrap(row[c_idx], col_w - 38, font(BODY_SIZE, bold=(c_idx == 0)))
        max_lines = max(max_lines, len(lines))
    row_heights.append(max(96, max_lines * LINE_H + 30))

H = TITLE_H + 100 + HEADER_H + sum(row_heights) + 80

img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

# Title block
draw.rounded_rectangle((M, 55, W-M, 175), radius=28, fill=NAVY)
title = "Tecnologías utilizadas en TecSis IA"
draw.text((M + 48, 78), title, font=font(58, True), fill=WHITE)
subtitle = "Selección tecnológica para el desarrollo y la búsqueda semántica"
draw.text((M + 50, 258), subtitle, font=font(32), fill=MUTED)

top = TITLE_H + 100
headers = ["Componente", "Tecnología usada", "Alternativas", "Justificación de elección"]
x = M
for i, w in enumerate(COLS):
    draw.rectangle((x, top, x+w, top+HEADER_H), fill=BLUE)
    draw.text((x+20, top+33), headers[i], font=font(30, True), fill=WHITE)
    x += w

current_y = top + HEADER_H
for r_idx, row in enumerate(rows):
    y = current_y
    row_h = row_heights[r_idx]
    fill = WHITE if r_idx % 2 == 0 else ALT
    x = M
    for c_idx, w in enumerate(COLS):
        draw.rectangle((x, y, x+w, y+row_h), fill=fill, outline=GRID, width=2)
        text = row[c_idx]
        fnt = font(BODY_SIZE, bold=(c_idx == 0))
        lines = wrap(text, w - 38, fnt)
        line_h = LINE_H
        total = len(lines) * line_h
        ty = y + max(15, (row_h-total)//2)
        color = NAVY if c_idx == 0 else TEXT
        for line in lines:
            draw.text((x+19, ty), line, font=fnt, fill=color)
            ty += line_h
        x += w
    current_y += row_h

footer_y = current_y + 22
draw.text((M, footer_y), "Embeddings: vector(384) en PostgreSQL mediante pgvector. Ollama no forma parte de la implementación sustentada.", font=font(25, True), fill=NAVY)

img.save(OUT, quality=95)
print(OUT)
