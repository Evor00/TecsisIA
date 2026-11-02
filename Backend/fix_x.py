import re

with open(r'D:\TecsisAi-2\Frontend\frontend_admin\src\views\ProyectosView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("Trash2, Edit2,", "Trash2, Edit2, X,")

with open(r'D:\TecsisAi-2\Frontend\frontend_admin\src\views\ProyectosView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Imported X.")
