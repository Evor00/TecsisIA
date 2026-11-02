import re

with open(r'D:\TecsisAi-2\Frontend\frontend_admin\src\views\ProyectosView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract RegistrarProyectoModal to see its code
match = re.search(r'function RegistrarProyectoModal\(\{.*?\n\}(?=\n\nfunction DetalleTesisModal|\n\nconst PROYECTOS_FALLBACK)', content, re.DOTALL)
if match:
    with open('modal_code.txt', 'w', encoding='utf-8') as fw:
        fw.write(match.group(0))
    print("Extracted modal.")
else:
    print("Could not find RegistrarProyectoModal")
