import re

with open(r'D:\TecsisAi-2\Frontend\frontend_admin\src\views\ProyectosView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: apiFetch
content = content.replace("await apiFetch(/api/proyectos//, {", "await apiFetch(`/api/proyectos/${proyecto.id}/`, {")

# Fix 2: showToast
content = re.sub(
    r'showToast\(\? Proyecto "" actualizado\)',
    'showToast(`? Proyecto "${updated.titulo}" actualizado`)',
    content
)

with open(r'D:\TecsisAi-2\Frontend\frontend_admin\src\views\ProyectosView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed JSX syntax errors.")
